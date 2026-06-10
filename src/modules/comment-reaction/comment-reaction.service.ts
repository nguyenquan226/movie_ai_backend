import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentReaction } from './entities/comment-reaction.entity';
import { CreateCommentReactionDto } from './dto/create-comment-reaction.dto';
import { IUser } from '../users/interface/user.interface';
import { Comment } from '../comment/entities/comment.entity';
import { CommentGateway } from '../comment/socket/comment-gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentReactionService {
  constructor(
    @InjectRepository(CommentReaction)
    private readonly reactionRepo: Repository<CommentReaction>,

    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly commentGateway: CommentGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reactToComment(dto: CreateCommentReactionDto, user: IUser) {
    try {
      const { commentId, type } = dto;

      const comment = await this.commentRepo.findOne({
        where: { commentId },
        relations: ['user', 'film'],
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      let existing = await this.reactionRepo.findOne({
        where: {
          user: { userId: user.userId },
          comment: { commentId },
        },
        relations: ['user', 'comment'],
      });

      let userReaction: 'LIKE' | 'DISLIKE' | null = null;
      let message = 'Reacted successfully';

      if (!existing) {
        const newReaction = this.reactionRepo.create({
          user: { userId: user.userId } as any,
          comment: { commentId } as any,
          type,
        });
        await this.reactionRepo.save(newReaction);

        userReaction = type;
        message = 'Reacted successfully';
      } else if (existing.type === type) {
        await this.reactionRepo.remove(existing);

        userReaction = null;
        message = 'Reaction removed';
      } else {
        existing.type = type;
        await this.reactionRepo.save(existing);

        userReaction = type;
        message = 'Reaction updated';
      }

      const [totalLike, totalDislike] = await Promise.all([
        this.reactionRepo.count({
          where: { comment: { commentId }, type: 'LIKE' },
        }),
        this.reactionRepo.count({
          where: { comment: { commentId }, type: 'DISLIKE' },
        }),
      ]);

      comment.totalLike = totalLike;
      comment.totalDislike = totalDislike;
      await this.commentRepo.save(comment);

      const reaction = { commentId, userId: user.userId, userReaction, totalLike, totalDislike };
      this.commentGateway.broadcastReactComment(reaction);

      //socket.io notification
      if (userReaction && comment.user && comment.user.userId !== user.userId) {
        const reactionUser = await this.reactionRepo.findOne({
          where: { user: { userId: user.userId } },
          relations: ['user'],
        });

        this.commentGateway.sendReactionNotification(String(comment.user.userId), {
          targetUserId: comment.user.userId,
          commentId,
          reactionType: type,
          reactionUser: reactionUser?.user || { userId: user.userId, fullName: 'Anonymous' },
          film: comment.film ? { filmId: comment.film.filmId, slug: comment.film.slug } : null,
        });

        // save notification to db
        try {
          const reactionText = type === 'LIKE' ? 'thích' : 'không thích';
          await this.notificationsService.createNotification({
            userId: comment.user.userId,
            type: 'reaction',
            message: `${reactionUser?.user?.fullName || 'Ai đó'} đã ${reactionText} bình luận của bạn`,
            replierId: user.userId,
            result: {
              commentId: commentId,
              reactionType: type,
              filmId: comment.film?.filmId,
              slug: comment.film?.slug,
            },
          });
        } catch (notifError) {
          console.error('Error creating reaction notification:', notifError);
        }
      }

      return {
        EC: 1,
        EM: message,
        commentId,
        totalLike,
        totalDislike,
        userReaction,
      };
    } catch (error) {
      console.error('Error in reactToComment:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from reactToComment service',
      });
    }
  }
}
