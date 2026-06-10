import { IsNull, Repository, Not, In } from 'typeorm';
import { Injectable, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { IUser } from '../users/interface/user.interface';
import aqp from 'api-query-params';
import { CommentGateway } from './socket/comment-gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly commentGateway: CommentGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createComment(dto: CreateCommentDto, user: IUser) {
    try {
      if (!user || !user.userId) {
        return {
          EC: 0,
          EM: 'Unauthorized: user not found in request',
        };
      }

      const comment = this.commentRepo.create({
        content: dto.content?.trim(),
        user: { userId: user.userId } as any,
        film: { filmId: dto.filmId } as any,
        part: dto.partId ? ({ partId: dto.partId } as any) : undefined,
        episode: dto.episodeId ? ({ episodeId: dto.episodeId } as any) : undefined,
        parent: dto.parentId ? ({ commentId: dto.parentId } as any) : undefined,
      });

      comment.createdBy = user.userId;

      const savedComment = await this.commentRepo.save(comment);

      let parentComment: Comment | null = null;

      if (dto.parentId) {
        parentComment = await this.commentRepo.findOne({
          where: { commentId: dto.parentId },
          relations: ['user', 'parent', 'parent.user'],
        });

        if (parentComment) {
          await this.commentRepo.increment(
            { commentId: parentComment.commentId },
            'totalChildrenComment',
            1,
          );
        }
      }

      const fullComment = await this.commentRepo.findOne({
        where: { commentId: savedComment.commentId },
        relations: ['user', 'parent', 'parent.user', 'film'],
      });

      if (fullComment) {
        this.commentGateway.broadcastNewComment(fullComment);
        if (dto.parentId && parentComment?.user) {
          const targetUserId = parentComment.user.userId;
          this.commentGateway.broadcastReplyComment({
            parentId: parentComment.commentId,
            replyToUser: parentComment.user,
            replyComment: fullComment,
          });

          //socket.io notification
          if (targetUserId !== user.userId) {
            this.commentGateway.sendReplyNotification(String(targetUserId), {
              targetUserId,
              parentId: parentComment.commentId,
              replyToUser: parentComment.user,
              replyComment: fullComment,
            });

            // save notification to db
            try {
              const filmTitle = fullComment.film?.title;
              const notification = await this.notificationsService.createNotification({
                userId: targetUserId,
                type: 'reply',
                message: `${fullComment.user.fullName} đã trả lời bình luận của bạn trong ${filmTitle}`,
                replierId: user.userId,
                result: {
                  commentId: fullComment.commentId,
                  parentId: parentComment.commentId,
                  filmId: dto.filmId,
                  slug: fullComment.film?.slug,
                  filmTitle: filmTitle,
                },
              });
            } catch (notifError) {
              console.error('[NOTIFICATION] Error creating notification:', notifError);
            }
          }
        }
      }

      await this.countCommentsByFilm(dto.filmId);

      return {
        EC: 1,
        EM: 'Create comment successfully',
        fullComment,
      };
    } catch (error) {
      console.error('Error in createComment:', error?.message || error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createComment service',
      });
    }
  }

  async getAllComments(query: any, user: IUser) {
    try {
      const { filter, sort } = aqp(query);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const [data, total] = await this.commentRepo.findAndCount({
        where: {
          parent: IsNull(),
          ...filter,
        },
        relations: ['user', 'film', 'reactions', 'reactions.user'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      for (const root of data) {
        root.children = await loadChildrenRecursive(this.commentRepo, root.commentId, true);
      }

      const userId = user?.userId || null;
      const comments = data.map((comment) => buildTree(comment, userId, true));

      return {
        EC: 1,
        EM: 'Get all comments successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        comments,
      };
    } catch (error) {
      console.error('Error in getAllComments:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllComments service',
      });
    }
  }

  async findCommentsByFilm(query: any, filmId: string, user: IUser | null) {
    try {
      const { filter, sort } = aqp(query);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 5;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const order = sort || { createdAt: 'DESC' };

      const [data, total] = await this.commentRepo.findAndCount({
        where: {
          film: { filmId },
          parent: IsNull(),
          isHidden: false,
          ...filter,
        },
        relations: ['user', 'reactions', 'reactions.user'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
      for (const root of data) {
        root.children = await loadChildrenRecursive(this.commentRepo, root.commentId);
      }

      const userId = user?.userId || null;
      const comments = data.map((comment) => buildTree(comment, userId));

      return {
        EC: 1,
        EM: 'Get comments successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        comments,
      };
    } catch (error) {
      console.error('Error in findCommentsByFilm:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findCommentsByFilm service',
      });
    }
  }

  async getComment(commentId: string) {
    try {
      const comment = await this.commentRepo.findOne({
        where: { commentId },
        relations: ['user', 'children', 'children.user'],
      });
      if (!comment) return { EC: 0, EM: 'Comment not found' };

      const result = {
        id: comment.commentId,
        content: comment.content,
        createdAt: comment.createdAt,
        isHidden: comment.isHidden,
        user: {
          id: comment.user.userId,
          name: comment.user.fullName,
          avatar: comment.user.avatarUrl,
        },
        replies:
          comment.children
            ?.filter((child) => !child.isHidden)
            .map((child) => ({
              id: child.commentId,
              content: child.content,
              createdAt: child.createdAt,
              user: {
                id: child.user.userId,
                name: child.user.fullName,
                avatar: child.user.avatarUrl,
              },
            })) || [],
      };
      return { EC: 1, EM: 'Get comment successfully', result };
    } catch (error) {
      console.error('Error in getComment:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getComment service',
      });
    }
  }
  async updateComment(commentId: string, dto: UpdateCommentDto, user: IUser) {
    try {
      const comment = await this.commentRepo.findOne({
        where: { commentId },
        relations: ['user'],
      });

      if (!comment) return { EC: 0, EM: 'Comment not found' };
      if (comment.user.userId !== user.userId) {
        return {
          EC: 0,
          EM: 'You are not allowed to update this comment (only owner can edit)',
        };
      }

      Object.assign(comment, dto);
      comment.updatedBy = user.userId;

      const updated = await this.commentRepo.save(comment);

      const result = await this.commentRepo.findOne({
        where: { commentId: updated.commentId },
        relations: ['user'],
      });
      this.commentGateway.broadcastUpdateComment(result);
      return {
        EC: 1,
        EM: 'Update comment successfully',
        result,
      };
    } catch (error) {
      console.error('Error in updateComment:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateComment service',
      });
    }
  }

  private async deleteChildrenRecursive(commentId: string, userId: number) {
    const children = await this.commentRepo.find({
      where: { parent: { commentId }, deletedAt: IsNull() },
      relations: ['children'],
    });

    for (const child of children) {
      await this.deleteChildrenRecursive(child.commentId, userId);
      await this.commentRepo.update(child.commentId, { deletedBy: userId });
      await this.commentRepo.softDelete(child.commentId);
      this.commentGateway.broadcastDeleteComment(child.commentId);
    }
  }

  async deleteComment(commentId: string, user: IUser) {
    try {
      const comment = await this.commentRepo.findOne({
        where: { commentId },
        relations: ['user', 'parent', 'film'],
      });

      if (!comment) return { EC: 0, EM: 'Comment not found' };

      if (comment.user.userId !== user.userId)
        return { EC: 0, EM: 'You are not allowed to remove this comment' };

      const filmId = comment.film.filmId;
      await this.deleteChildrenRecursive(commentId, user.userId);
      if (comment.parent) {
        await this.commentRepo.decrement(
          { commentId: comment.parent.commentId },
          'totalChildrenComment',
          1,
        );
      }
      await this.commentRepo.update(commentId, { deletedBy: user.userId });
      await this.commentRepo.softDelete(commentId);
      this.commentGateway.broadcastDeleteComment(commentId);
      await this.countCommentsByFilm(filmId);

      return { EC: 1, EM: 'Delete comment successfully' };
    } catch (error) {
      console.error('Error in deleteComment:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteComment service',
      });
    }
  }

  private async hardDeleteChildrenRecursive(commentId: string) {
    const children = await this.commentRepo.find({
      where: { parent: { commentId } },
      relations: ['children'],
      withDeleted: true,
    });

    for (const child of children) {
      await this.hardDeleteChildrenRecursive(child.commentId);
      await this.commentRepo.delete(child.commentId);
      this.commentGateway.broadcastDeleteComment(child.commentId);
    }
  }

  async hardDeleteComment(commentId: string, user: IUser) {
    try {
      const comment = await this.commentRepo.findOne({
        where: { commentId },
        relations: ['user', 'parent', 'film'],
        withDeleted: true,
      });

      if (!comment) return { EC: 0, EM: 'Comment not found' };

      if (user.roleName !== 'SYSTEM_ADMIN' && user.roleName !== 'ROLE_MOD') {
        return {
          EC: 0,
          EM: 'Only admin/moderator can permanently delete comments',
        };
      }

      const filmId = comment.film.filmId;

      await this.hardDeleteChildrenRecursive(commentId);
      if (comment.parent) {
        await this.commentRepo.decrement(
          { commentId: comment.parent.commentId },
          'totalChildrenComment',
          1,
        );
      }

      await this.commentRepo.delete(commentId);
      this.commentGateway.broadcastDeleteComment(commentId);
      await this.countCommentsByFilm(filmId);

      return { EC: 1, EM: 'Permanently deleted comment successfully' };
    } catch (error) {
      console.error('Error in hardDeleteComment:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from hardDeleteComment service',
      });
    }
  }

  async toggleHideComment(commentId: string, user: IUser) {
    try {
      const comment = await this.commentRepo.findOne({
        where: { commentId },
        relations: ['children', 'user', 'film'],
      });

      if (!comment) return { EC: 0, EM: 'Comment not found' };

      if (user.roleName !== 'SYSTEM_ADMIN' && user.roleName !== 'ROLE_MOD') {
        return {
          EC: 0,
          EM: 'You are not allowed to hide/unhide this comment (only admin/moderator can perform this action)',
        };
      }

      const newHiddenState = !comment.isHidden;
      comment.isHidden = newHiddenState;
      comment.updatedBy = user.userId;
      await this.commentRepo.save(comment);
      await this.toggleHideChildrenRecursive(commentId, newHiddenState, user.userId);
      if (newHiddenState) {
        this.commentGateway.broadcastHideComment(commentId, newHiddenState);
      } else {
        const fullComment = await this.commentRepo.findOne({
          where: { commentId },
          relations: ['user', 'parent', 'parent.user', 'film', 'reactions', 'reactions.user'],
        });
        if (fullComment) {
          fullComment.children = await loadChildrenRecursive(
            this.commentRepo,
            fullComment.commentId,
          );
          this.commentGateway.broadcastUnhideComment(fullComment);
        }
      }

      // gửi thông báo khi bị ẩn
      if (newHiddenState && comment.user) {
        const commentOwnerId = comment.user.userId;
        try {
          const filmTitle = comment.film?.title || 'Unknown';
          const notification = await this.notificationsService.createNotification({
            userId: commentOwnerId,
            type: 'hidden_comment',
            message: `Bình luận của bạn trong phim "${filmTitle}" đã bị ẩn do vi phạm nguyên tắc cộng đồng`,
            result: {
              commentId: comment.commentId,
              commentContent: comment.content,
              filmId: comment.film?.filmId,
              filmTitle: filmTitle,
              filmSlug: comment.film?.slug,
              hiddenAt: new Date(),
            },
          });

          // Gửi realtime notification
          this.commentGateway.sendHiddenCommentNotification(commentOwnerId, {
            notificationId: notification.notificationId,
            commentId: comment.commentId,
            message: `Bình luận của bạn trong phim "${filmTitle}" đã bị ẩn do vi phạm nguyên tắc cộng đồng`,
            film: comment.film
              ? {
                  filmId: comment.film.filmId,
                  title: comment.film.title,
                  slug: comment.film.slug,
                }
              : null,
            createdAt: new Date(),
          });
        } catch (notifError) {
          console.error('[NOTIFICATION] Error creating hidden comment notification:', notifError);
        }
      }
      if (comment.film?.filmId) {
        await this.countCommentsByFilm(comment.film.filmId);
      }
      return {
        EC: 1,
        EM: newHiddenState ? 'Comment hidden successfully' : 'Comment is now visible',
        data: {
          commentId: comment.commentId,
          isHidden: newHiddenState,
        },
      };
    } catch (error) {
      console.error('Error in toggleHideComment:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from toggleHideComment service',
      });
    }
  }

  async hideCommentAndChildren(commentId: string, userId: number) {
    await this.toggleHideChildrenRecursive(commentId, true, userId);
  }

  private async toggleHideChildrenRecursive(parentId: string, isHidden: boolean, userId: number) {
    const children = await this.commentRepo.find({
      where: { parent: { commentId: parentId } },
      relations: ['children'],
    });

    for (const child of children) {
      child.isHidden = isHidden;
      child.updatedBy = userId;
      await this.commentRepo.save(child);
      this.commentGateway.broadcastHideComment(child.commentId, isHidden);
      if (child.children && child.children.length > 0) {
        await this.toggleHideChildrenRecursive(child.commentId, isHidden, userId);
      }
    }
  }

  async countCommentsByFilm(filmId: string) {
    try {
      const total = await this.commentRepo.count({
        where: {
          film: { filmId },
          isHidden: false,
          deletedAt: IsNull(),
        },
      });
      this.commentGateway.broadcastCountComments({ filmId, total });
      return {
        EC: 1,
        EM: 'Count comments successfully',
        totalComments: total,
      };
    } catch (error) {
      console.error('Error in countCommentsByFilm:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from countCommentsByFilm service',
      });
    }
  }

  async getStatistics() {
    try {
      const totalComments = await this.commentRepo.count({
        where: { deletedAt: IsNull() },
      });

      const visibleComments = await this.commentRepo.count({
        where: { deletedAt: IsNull(), isHidden: false },
      });

      const hiddenComments = await this.commentRepo.count({
        where: { deletedAt: IsNull(), isHidden: true },
      });

      const activeUsersResult = await this.commentRepo
        .createQueryBuilder('comment')
        .select('COUNT(DISTINCT comment.userId)', 'count')
        .where('comment.deletedAt IS NULL')
        .getRawOne();

      const activeUsers = parseInt(activeUsersResult?.count || '0');

      const mostCommented = await this.commentRepo
        .createQueryBuilder('comment')
        .leftJoin('comment.film', 'film')
        .select('film.filmId', 'filmId')
        .addSelect('film.title', 'title')
        .addSelect('COUNT(comment.commentId)', 'totalComments')
        .where('comment.deletedAt IS NULL')
        .andWhere('film.filmId IS NOT NULL')
        .groupBy('film.filmId')
        .addGroupBy('film.title')
        .orderBy('"totalComments"', 'DESC')
        .limit(10)
        .getRawMany();

      const topCommenters = await this.commentRepo
        .createQueryBuilder('comment')
        .leftJoin('comment.user', 'user')
        .select('user.userId', 'userId')
        .addSelect('user.fullName', 'fullName')
        .addSelect('user.avatarUrl', 'avatarUrl')
        .addSelect('COUNT(comment.commentId)', 'totalComments')
        .where('comment.deletedAt IS NULL')
        .groupBy('user.userId')
        .addGroupBy('user.fullName')
        .addGroupBy('user.avatarUrl')
        .orderBy('"totalComments"', 'DESC')
        .limit(10)
        .getRawMany();

      const mostReplied = await this.commentRepo
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .leftJoinAndSelect('comment.film', 'film')
        .where('comment.deletedAt IS NULL')
        .andWhere('comment.totalChildrenComment > 0')
        .orderBy('comment.totalChildrenComment', 'DESC')
        .limit(10)
        .getMany();

      return {
        EC: 1,
        EM: 'Get statistics successfully',
        totalComments,
        visibleComments,
        hiddenComments,
        activeUsers,
        mostCommented: mostCommented.map((item) => ({
          filmId: item.filmId,
          title: item.title,
          totalComments: parseInt(item.totalComments),
        })),
        topCommenters: topCommenters.map((item) => ({
          userId: item.userId,
          fullName: item.fullName,
          avatarUrl: item.avatarUrl,
          totalComments: parseInt(item.totalComments),
        })),
        mostReplied: mostReplied.map((comment) => ({
          commentId: comment.commentId,
          content: comment.content,
          totalChildrenComment: comment.totalChildrenComment,
          user: comment.user
            ? {
                userId: comment.user.userId,
                fullName: comment.user.fullName,
                avatarUrl: comment.user.avatarUrl,
              }
            : null,
          film: comment.film
            ? {
                filmId: comment.film.filmId,
                title: comment.film.title,
              }
            : null,
        })),
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error getting comment statistics',
      });
    }
  }
}

async function loadChildrenRecursive(
  repo: Repository<Comment>,
  parentId: string,
  isAdmin: boolean = false,
): Promise<Comment[]> {
  const whereClause: any = {
    parent: { commentId: parentId },
    deletedAt: IsNull(),
  };
  if (!isAdmin) {
    whereClause.isHidden = false;
  }

  const children = await repo.find({
    where: whereClause,
    relations: ['user', 'film', 'reactions', 'reactions.user', 'parent', 'parent.user'],
    order: { createdAt: 'ASC' },
  });
  for (const child of children) {
    child.children = await loadChildrenRecursive(repo, child.commentId, isAdmin);
  }
  return children;
}

function buildTree(comment: any, userId: string | number | null, isAdmin: boolean = false): any {
  const currentReaction = userId ? comment.reactions?.find((r) => r.user?.userId === userId) : null;
  const children = comment.children || [];
  const replies = isAdmin
    ? children.map((child) => buildTree(child, userId, isAdmin))
    : children.filter((child) => !child.isHidden).map((child) => buildTree(child, userId, isAdmin));

  return {
    id: comment.commentId,
    commentId: comment.commentId,
    content: comment.content,
    createdAt: comment.createdAt,
    isHidden: comment.isHidden,
    totalLike: comment.totalLike,
    totalDislike: comment.totalDislike,
    totalChildrenComment: comment.totalChildrenComment,
    currentUserReaction: userId ? currentReaction?.type || null : undefined,
    user: {
      id: comment.user.userId,
      name: comment.user.fullName,
      avatar: comment.user.avatarUrl,
    },
    film: comment.film
      ? {
          filmId: comment.film.filmId,
          title: comment.film.title,
          slug: comment.film.slug,
        }
      : null,
    parent: comment.parent
      ? {
          id: comment.parent.commentId,
          user: {
            id: comment.parent.user?.userId,
            name: comment.parent.user?.fullName,
            avatar: comment.parent.user?.avatarUrl,
          },
        }
      : null,
    replies: replies,
  };
}
