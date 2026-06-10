import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Report, ReportStatus, ReportType } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { IUser } from '../users/interface/user.interface';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comment/entities/comment.entity';
import { Rating } from '../rating/entities/rating.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportGateway } from './socket/report-gateway';
import { CommentGateway } from '../comment/socket/comment-gateway';
import { RatingGateway } from '../rating/socket/rating-gateway';
import { CommentService } from '../comment/comment.service';
import { RatingService } from '../rating/rating.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    private readonly notificationsService: NotificationsService,
    private readonly reportGateway: ReportGateway,
    private readonly commentGateway: CommentGateway,
    private readonly ratingGateway: RatingGateway,
    private readonly commentService: CommentService,
    private readonly ratingService: RatingService,
  ) {}

  async createReport(dto: CreateReportDto, user: IUser) {
    try {
      let targetEntity: any = null;
      let targetUser: User | null = null;

      switch (dto.reportType) {
        case ReportType.COMMENT:
          targetEntity = await this.commentRepo.findOne({
            where: { commentId: dto.targetId },
            relations: ['user', 'film'],
          });
          if (!targetEntity) {
            return { EC: 0, EM: 'Comment not found' };
          }
          targetUser = targetEntity.user;
          break;

        case ReportType.RATING:
          targetEntity = await this.ratingRepo.findOne({
            where: { ratingId: dto.targetId },
            relations: ['user', 'film'],
            withDeleted: true,
          });
          if (!targetEntity) {
            return { EC: 0, EM: 'Rating not found' };
          }
          targetUser = targetEntity.user;
          break;

        default:
          return { EC: 0, EM: 'Invalid report type' };
      }

      if (targetUser?.userId === user.userId) {
        return {
          EC: 0,
          EM: 'Bạn không thể báo cáo nội dung của chính mình',
        };
      }
      const existingReport = await this.reportRepo.findOne({
        where: {
          reportType: dto.reportType,
          targetId: dto.targetId,
          reporter: { userId: user.userId },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      if (existingReport) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (existingReport.createdAt > fiveMinutesAgo) {
          const remainingSeconds = Math.ceil(
            (existingReport.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000,
          );
          return {
            EC: 0,
            EM: `Bạn đã báo cáo nội dung này rồi. Vui lòng thử lại sau.`,
          };
        }
      }

      const report = this.reportRepo.create({
        reportType: dto.reportType,
        targetId: dto.targetId,
        reporter: { userId: user.userId } as any,
        reason: dto.reason,
        description: dto.description,
        status: ReportStatus.PENDING,
      });
      const savedReport = await this.reportRepo.save(report);
      await this.sendReportNotifications(savedReport, user, targetEntity);

      return {
        EC: 1,
        EM: 'Report created successfully',
        data: savedReport,
      };
    } catch (error) {
      console.error('Error in createReport:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error creating report',
      });
    }
  }

  private async sendReportNotifications(report: Report, reporter: IUser, targetEntity: any) {
    try {
      const targetRoles = ['SYSTEM_ADMIN', 'ROLE_MOD', 'ADMIN_CLIENT'];

      const adminReceivers = await this.userRepo.find({
        where: { role: { roleName: In(targetRoles) } },
        relations: ['role'],
      });

      if (adminReceivers.length === 0) {
        console.warn('No admin/mod accounts found to receive report notifications');
        return;
      }

      let notificationMessage = '';
      let notificationData: any = {
        reportId: report.reportId,
        reportType: report.reportType,
        reporterId: reporter.userId,
        reporterName: reporter.fullName,
        reporterAvatar: reporter.avatarUrl,
        reason: report.reason,
        description: report.description,
      };
      switch (report.reportType) {
        case ReportType.COMMENT:
          notificationMessage = `${reporter.fullName} đã báo cáo bình luận của ${targetEntity.user.fullName} trong phim "${targetEntity.film?.title || 'Không rõ'}"`;
          notificationData = {
            ...notificationData,
            commentId: targetEntity.commentId,
            commentContent: targetEntity.content,
            commentUserId: targetEntity.user.userId,
            commentUserName: targetEntity.user.fullName,
            filmId: targetEntity.film?.filmId,
            filmTitle: targetEntity.film?.title,
            filmSlug: targetEntity.film?.slug,
          };
          break;

        case ReportType.RATING:
          notificationMessage = `${reporter.fullName} đã báo cáo đánh giá của ${targetEntity.user.fullName} trong phim "${targetEntity.film?.title || 'Không rõ'}"`;
          notificationData = {
            ...notificationData,
            ratingId: targetEntity.ratingId,
            ratingContent: targetEntity.content,
            ratingScore: targetEntity.score,
            ratingUserId: targetEntity.user.userId,
            ratingUserName: targetEntity.user.fullName,
            filmId: targetEntity.film?.filmId,
            filmTitle: targetEntity.film?.title,
            filmSlug: targetEntity.film?.slug,
          };
          break;
      }

      for (const admin of adminReceivers) {
        const notification = await this.notificationsService.createNotification({
          userId: admin.userId,
          type: 'report',
          message: notificationMessage,
          replierId: reporter.userId,
          result: notificationData,
        });

        this.reportGateway.sendReportNotificationToAdmin(admin.userId, {
          notificationId: notification.notificationId,
          message: notificationMessage,
          reporter: {
            userId: reporter.userId,
            fullName: reporter.fullName,
            avatarUrl: reporter.avatarUrl,
          },
          ...notificationData,
        });
      }
    } catch (error) {
      console.error('Error sending report notifications:', error);
    }
  }

  async getReports(query: QueryReportDto) {
    try {
      const { reportType, status, page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const whereConditions: any = {};
      if (reportType) whereConditions.reportType = reportType;
      if (status) whereConditions.status = status;

      const [reports, total] = await this.reportRepo.findAndCount({
        where: whereConditions,
        relations: ['reporter', 'reviewedBy'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          let targetData: any = null;
          const totalReportsForTarget = await this.reportRepo.count({
            where: {
              reportType: report.reportType,
              targetId: report.targetId,
              status: ReportStatus.PENDING,
            },
          });

          switch (report.reportType) {
            case ReportType.COMMENT:
              const comment = await this.commentRepo.findOne({
                where: { commentId: report.targetId },
                relations: ['user', 'film'],
              });
              targetData = comment
                ? {
                    commentId: comment.commentId,
                    content: comment.content,
                    user: comment.user,
                    film: comment.film,
                  }
                : null;
              break;

            case ReportType.RATING:
              const rating = await this.ratingRepo.findOne({
                where: { ratingId: report.targetId },
                relations: ['user', 'film'],
              });
              targetData = rating
                ? {
                    ratingId: rating.ratingId,
                    content: rating.content,
                    ratingValue: rating.ratingValue,
                    user: rating.user,
                    film: rating.film,
                  }
                : null;
              break;
          }

          return {
            ...report,
            targetData,
            totalReportsForTarget,
          };
        }),
      );

      return {
        EC: 1,
        EM: 'Get reports successfully',

        meta: {
          current: page,
          pageSize: limit,
          pages: Math.ceil(total / limit),
          total,
        },
        reports: enrichedReports,
      };
    } catch (error) {
      console.error('Error in getReports:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error getting reports',
      });
    }
  }

  async dismissReport(reportId: string, userId: number, note?: string) {
    try {
      const report = await this.reportRepo.findOne({
        where: { reportId },
        relations: ['reporter'],
      });

      if (!report) {
        return { EC: 0, EM: 'Report not found' };
      }

      if (report.status !== ReportStatus.PENDING) {
        return { EC: 0, EM: 'Report has already been processed' };
      }

      report.status = ReportStatus.DISMISSED;
      report.reviewedBy = { userId } as any;
      report.reviewNote = note;
      report.reviewedAt = new Date();
      await this.reportRepo.save(report);
      if (report.reporter) {
        let thankYouMessage = '';

        switch (report.reportType) {
          case ReportType.COMMENT:
            const comment = await this.commentRepo.findOne({
              where: { commentId: report.targetId },
              relations: ['user', 'film'],
            });
            const commentfilmTitle = comment?.film?.title || 'không xác định';
            thankYouMessage = `Cảm ơn bạn đã báo cáo bình luận của ${comment?.user?.fullName || 'người dùng'} trong phim "${commentfilmTitle}". Chúng tôi đã xử lý báo cáo của bạn. Kết quả: Không vi phạm`;
            break;

          case ReportType.RATING:
            const rating = await this.ratingRepo.findOne({
              where: { ratingId: report.targetId },
              relations: ['user', 'film'],
            });
            const ratingfilmTitle = rating?.film?.title || 'không xác định';
            thankYouMessage = `Cảm ơn bạn đã báo cáo đánh giá của ${rating?.user?.fullName || 'người dùng'} trong phim "${ratingfilmTitle}". Chúng tôi đã xử lý báo cáo của bạn. Kết quả: Không vi phạm`;
            break;
        }

        const notification = await this.notificationsService.createNotification({
          userId: report.reporter.userId,
          type: 'info',
          message: thankYouMessage,
          replierId: userId,
          result: {
            reportId: report.reportId,
            action: 'dismissed',
          },
        });
        this.commentGateway.sendInfoNotification(report.reporter.userId, {
          notificationId: notification.notificationId,
          type: 'info',
          message: thankYouMessage,
          reportId: report.reportId,
          createdAt: new Date().toISOString(),
        });
      }
      const targetRoles = ['SYSTEM_ADMIN', 'ROLE_MOD', 'ADMIN_CLIENT'];
      const adminUsers = await this.userRepo.find({
        where: { role: { roleName: In(targetRoles) } },
        relations: ['role'],
      });

      for (const admin of adminUsers) {
        await this.notificationsService.markAsReadByTargetId(
          report.targetId,
          report.reportType,
          admin.userId,
        );
      }

      this.reportGateway.broadcastReportProcessed(report.reportId);

      return {
        EC: 1,
        EM: 'Report dismissed successfully',
        data: report,
      };
    } catch (error) {
      console.error('Error in dismissReport:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error dismissing report',
      });
    }
  }

  private async autoResolveChildCommentReports(
    parentCommentId: string,
    user: IUser,
    action: 'hidden' | 'hard_deleted',
  ) {
    const childComments = await this.getAllChildComments(parentCommentId);

    if (childComments.length === 0) return;
    const childCommentIds = childComments.map((c) => c.commentId);
    const childReports = await this.reportRepo.find({
      where: {
        targetId: In(childCommentIds),
        reportType: ReportType.COMMENT,
        status: ReportStatus.PENDING,
      },
      relations: ['reporter'],
    });

    for (const childReport of childReports) {
      childReport.status = ReportStatus.ACTIONED;
      childReport.reviewedBy = { userId: user.userId } as any;
      childReport.reviewNote = `Auto-resolved: Parent comment was ${action}`;
      childReport.reviewedAt = new Date();
      await this.reportRepo.save(childReport);
      if (childReport.reporter) {
        const childComment = childComments.find((c) => c.commentId === childReport.targetId);
        const filmTitle = childComment?.film?.title || 'không xác định';
        const actionText = action === 'hidden' ? 'đã được ẩn' : 'đã bị xóa';

        const thankYouMessage = `Cảm ơn bạn đã báo cáo bình luận vi phạm trong phim "${filmTitle}". Bình luận ${actionText} cùng với bình luận gốc.`;

        const notification = await this.notificationsService.createNotification({
          userId: childReport.reporter.userId,
          type: 'info',
          message: thankYouMessage,
          replierId: user.userId,
          result: {
            reportId: childReport.reportId,
            action: 'auto_resolved',
          },
        });

        this.commentGateway.sendInfoNotification(childReport.reporter.userId, {
          notificationId: notification.notificationId,
          type: 'info',
          message: thankYouMessage,
          reportId: childReport.reportId,
          createdAt: new Date().toISOString(),
        });
      }

      this.reportGateway.broadcastReportProcessed(childReport.reportId);
    }
  }

  private async getAllChildComments(parentId: string): Promise<Comment[]> {
    const children = await this.commentRepo.find({
      where: { parent: { commentId: parentId } },
      relations: ['user', 'film', 'children'],
    });

    let allChildren = [...children];
    for (const child of children) {
      const grandChildren = await this.getAllChildComments(child.commentId);
      allChildren = [...allChildren, ...grandChildren];
    }

    return allChildren;
  }

  async deleteTargetFromReport(reportId: string, user: IUser, reason?: string, note?: string) {
    try {
      const report = await this.reportRepo.findOne({
        where: { reportId },
        relations: ['reporter'],
      });

      if (!report) {
        return { EC: 0, EM: 'Report not found' };
      }

      if (report.status !== ReportStatus.PENDING) {
        return { EC: 0, EM: 'Report has already been processed' };
      }
      let actionResult: any;

      switch (report.reportType) {
        case ReportType.COMMENT:
          const comment = await this.commentRepo.findOne({
            where: { commentId: report.targetId },
            relations: ['user', 'film'],
          });

          if (!comment) {
            return { EC: 0, EM: 'Comment not found' };
          }
          comment.isHidden = true;
          await this.commentRepo.save(comment);
          actionResult = { type: 'comment', commentId: comment.commentId, action: 'hidden' };
          await this.commentService.hideCommentAndChildren(comment.commentId, user.userId);

          await this.autoResolveChildCommentReports(comment.commentId, user, 'hidden');

          this.commentGateway.broadcastHideComment(comment.commentId, true);
          if (comment.film?.filmId) {
            await this.commentService.countCommentsByFilm(comment.film.filmId);
          }
          if (comment.user && reason) {
            const filmTitle = comment.film?.title || 'không xác định';
            const notification = await this.notificationsService.createNotification({
              userId: comment.user.userId,
              type: 'warning',
              message: `Bình luận trong phim "${filmTitle}" của bạn đã bị ẩn do vi phạm: ${reason}`,
              replierId: user.userId,
              result: { reason, note },
            });
            this.commentGateway.sendWarningNotification(comment.user.userId, {
              notificationId: notification.notificationId,
              type: 'warning',
              message: `Bình luận trong phim "${filmTitle}" của bạn đã bị ẩn do vi phạm: ${reason}`,
              reason,
              note,
              commentId: comment.commentId,
              filmId: comment.film?.filmId,
              filmTitle: comment.film?.title,
              createdAt: new Date().toISOString(),
            });
          }
          break;

        case ReportType.RATING:
          const rating = await this.ratingRepo.findOne({
            where: { ratingId: report.targetId },
            relations: ['user', 'film'],
          });

          if (!rating) {
            return { EC: 0, EM: 'Rating not found' };
          }
          rating.isHidden = true;
          await this.ratingRepo.save(rating);
          actionResult = { type: 'rating', ratingId: rating.ratingId, action: 'hidden' };
          this.ratingGateway.broadcastHideRating(rating.ratingId, true, rating.film?.filmId);
          if (rating.film?.filmId) {
            await this.ratingService.getRatingsByFilm(rating.film.filmId);
          }
          if (rating.user && reason) {
            const filmTitle = rating.film?.title || 'không xác định';
            const notification = await this.notificationsService.createNotification({
              userId: rating.user.userId,
              type: 'warning',
              message: `Đánh giá trong phim "${filmTitle}" của bạn đã bị ẩn do vi phạm: ${reason}`,
              replierId: user.userId,
              result: { reason, note },
            });
            this.commentGateway.sendWarningNotification(rating.user.userId, {
              notificationId: notification.notificationId,
              type: 'warning',
              message: `Đánh giá của bạn đã bị xóa do vi phạm: ${reason}`,
              reason,
              note,
              ratingId: rating.ratingId,
              filmId: rating.film?.filmId,
              filmTitle: rating.film?.title,
              createdAt: new Date().toISOString(),
            });
          }
          break;

        default:
          return { EC: 0, EM: 'Invalid report type' };
      }
      report.status = ReportStatus.ACTIONED;
      report.reviewedBy = { userId: user.userId } as any;
      report.reviewNote = note;
      report.reviewedAt = new Date();
      await this.reportRepo.save(report);
      const otherReports = await this.reportRepo.find({
        where: {
          targetId: report.targetId,
          reportType: report.reportType,
          status: ReportStatus.PENDING,
        },
        relations: ['reporter'],
      });

      if (otherReports.length > 0) {
        for (const otherReport of otherReports) {
          if (otherReport.reportId !== report.reportId) {
            otherReport.status = ReportStatus.ACTIONED;
            otherReport.reviewedBy = { userId: user.userId } as any;
            otherReport.reviewNote = `Auto-resolved: Target already actioned by another report`;
            otherReport.reviewedAt = new Date();
            await this.reportRepo.save(otherReport);
          }
        }
      }
      const allReporters = [report, ...otherReports];
      for (const reportItem of allReporters) {
        if (reportItem.reporter) {
          let thankYouMessage = '';

          switch (report.reportType) {
            case ReportType.COMMENT:
              const commentData = await this.commentRepo.findOne({
                where: { commentId: report.targetId },
                relations: ['user', 'film'],
              });
              const commentfilmTitle = commentData?.film?.title || 'không xác định';
              thankYouMessage = `Cảm ơn bạn đã báo cáo bình luận vi phạm của ${commentData?.user?.fullName || 'người dùng'} trong phim "${commentfilmTitle}". Chúng tôi đã xử lý báo cáo của bạn.`;
              break;

            case ReportType.RATING:
              const ratingData = await this.ratingRepo.findOne({
                where: { ratingId: report.targetId },
                relations: ['user', 'film'],
              });
              const ratingfilmTitle = ratingData?.film?.title || 'không xác định';
              thankYouMessage = `Cảm ơn bạn đã báo cáo đánh giá vi phạm của ${ratingData?.user?.fullName || 'người dùng'} trong phim "${ratingfilmTitle}". Chúng tôi đã xử lý báo cáo của bạn.`;
              break;
          }

          const thankYouNotification = await this.notificationsService.createNotification({
            userId: reportItem.reporter.userId,
            type: 'info',
            message: thankYouMessage,
            replierId: user.userId,
            result: {
              reportId: reportItem.reportId,
              action: 'actioned',
            },
          });

          this.commentGateway.sendInfoNotification(reportItem.reporter.userId, {
            notificationId: thankYouNotification.notificationId,
            type: 'info',
            message: thankYouMessage,
            reportId: reportItem.reportId,
            createdAt: new Date().toISOString(),
          });
        }
      }
      const targetRoles = ['SYSTEM_ADMIN', 'ROLE_MOD', 'ADMIN_CLIENT'];
      const adminUsers = await this.userRepo.find({
        where: { role: { roleName: In(targetRoles) } },
        relations: ['role'],
      });

      for (const admin of adminUsers) {
        await this.notificationsService.markAsReadByTargetId(
          report.targetId,
          report.reportType,
          admin.userId,
        );
      }

      this.reportGateway.broadcastReportProcessed(report.reportId);
      return {
        EC: 1,
        EM: 'Target actioned and report processed successfully',
        data: { report, actionResult },
      };
    } catch (error) {
      console.error('Error in deleteTargetFromReport:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error deleting target from report',
      });
    }
  }

  async hardDeleteTargetFromReport(reportId: string, user: IUser, note?: string) {
    try {
      const report = await this.reportRepo.findOne({
        where: { reportId },
        relations: ['reporter'],
      });

      if (!report) {
        return { EC: 0, EM: 'Report not found' };
      }

      if (report.status !== ReportStatus.PENDING) {
        return { EC: 0, EM: 'Report has already been processed' };
      }

      let actionResult: any;
      let targetUserFullName: string = 'người dùng';
      let targetFilmTitle: string = 'không xác định';

      switch (report.reportType) {
        case ReportType.COMMENT:
          const comment = await this.commentRepo.findOne({
            where: { commentId: report.targetId },
            relations: ['user', 'film'],
            withDeleted: true,
          });

          if (!comment) {
            return { EC: 0, EM: 'Comment not found' };
          }
          targetUserFullName = comment.user?.fullName || 'người dùng';
          targetFilmTitle = comment.film?.title || 'không xác định';

          await this.autoResolveChildCommentReports(comment.commentId, user, 'hard_deleted');

          const hardDeleteResult = await this.commentService.hardDeleteComment(
            comment.commentId,
            user,
          );

          if (hardDeleteResult.EC !== 1) {
            return { EC: 0, EM: 'Failed to hard delete comment' };
          }

          actionResult = { type: 'comment', commentId: comment.commentId, action: 'hard_deleted' };
          if (comment.user) {
            const filmTitle = comment.film?.title || 'không xác định';
            const notification = await this.notificationsService.createNotification({
              userId: comment.user.userId,
              type: 'warning',
              message: `Bình luận trong phim "${filmTitle}" của bạn đã bị xóa vĩnh viễn do vi phạm nghiêm trọng quy định cộng đồng`,
              replierId: user.userId,
              result: { note, action: 'hard_deleted' },
            });

            this.commentGateway.sendWarningNotification(comment.user.userId, {
              notificationId: notification.notificationId,
              type: 'warning',
              message: `Bình luận trong phim "${filmTitle}" của bạn đã bị xóa vĩnh viễn do vi phạm nghiêm trọng quy định cộng đồng`,
              note,
              commentId: comment.commentId,
              filmId: comment.film?.filmId,
              filmTitle: filmTitle,
              createdAt: new Date().toISOString(),
            });
          }
          break;

        case ReportType.RATING:
          const rating = await this.ratingRepo.findOne({
            where: { ratingId: report.targetId },
            relations: ['user', 'film'],
            withDeleted: true,
          });

          if (!rating) {
            return { EC: 0, EM: 'Rating not found' };
          }
          targetUserFullName = rating.user?.fullName || 'người dùng';
          targetFilmTitle = rating.film?.title || 'không xác định';

          const hardDeleteRatingResult = await this.ratingService.hardDeleteRating(rating.ratingId);
          if (hardDeleteRatingResult.EC !== 1) {
            return { EC: 0, EM: 'Failed to hard delete rating' };
          }
          actionResult = { type: 'rating', ratingId: rating.ratingId, action: 'hard_deleted' };
          if (rating.user) {
            const filmTitle = rating.film?.title || 'không xác định';
            const notification = await this.notificationsService.createNotification({
              userId: rating.user.userId,
              type: 'warning',
              message: `Đánh giá trong phim "${filmTitle}" của bạn đã bị xóa vĩnh viễn do vi phạm nghiêm trọng quy định cộng đồng`,
              replierId: user.userId,
              result: { note, action: 'hard_deleted' },
            });

            this.commentGateway.sendWarningNotification(rating.user.userId, {
              notificationId: notification.notificationId,
              type: 'warning',
              message: `Đánh giá của bạn đã bị xóa vĩnh viễn do vi phạm nghiêm trọng quy định cộng đồng`,
              note,
              ratingId: rating.ratingId,
              filmId: rating.film?.filmId,
              filmTitle: rating.film?.title,
              createdAt: new Date().toISOString(),
            });
          }
          break;

        default:
          return { EC: 0, EM: 'Invalid report type' };
      }
      report.status = ReportStatus.ACTIONED;
      report.reviewedBy = { userId: user.userId } as any;
      report.reviewNote = note || 'Hard deleted due to severe violation';
      report.reviewedAt = new Date();
      await this.reportRepo.save(report);

      const otherReports = await this.reportRepo.find({
        where: {
          targetId: report.targetId,
          reportType: report.reportType,
          status: ReportStatus.PENDING,
        },
        relations: ['reporter'],
      });

      if (otherReports.length > 0) {
        for (const otherReport of otherReports) {
          if (otherReport.reportId !== report.reportId) {
            otherReport.status = ReportStatus.ACTIONED;
            otherReport.reviewedBy = { userId: user.userId } as any;
            otherReport.reviewNote = `Auto-resolved: Target hard deleted by another report`;
            otherReport.reviewedAt = new Date();
            await this.reportRepo.save(otherReport);
          }
        }
      }
      const allReporters = [report, ...otherReports];
      for (const reportItem of allReporters) {
        if (reportItem.reporter) {
          let thankYouMessage = '';

          switch (report.reportType) {
            case ReportType.COMMENT:
              thankYouMessage = `Cảm ơn bạn đã báo cáo bình luận của ${targetUserFullName} trong phim "${targetFilmTitle}" vi phạm nghiêm trọng. Nội dung đã được xóa vĩnh viễn.`;
              break;

            case ReportType.RATING:
              thankYouMessage = `Cảm ơn bạn đã báo cáo đánh giá của ${targetUserFullName} trong phim "${targetFilmTitle}" vi phạm nghiêm trọng. Nội dung đã được xóa vĩnh viễn.`;
              break;
          }

          const thankYouNotification = await this.notificationsService.createNotification({
            userId: reportItem.reporter.userId,
            type: 'info',
            message: thankYouMessage,
            replierId: user.userId,
            result: {
              reportId: reportItem.reportId,
              action: 'hard_deleted',
            },
          });

          this.commentGateway.sendInfoNotification(reportItem.reporter.userId, {
            notificationId: thankYouNotification.notificationId,
            type: 'info',
            message: thankYouMessage,
            reportId: reportItem.reportId,
            createdAt: new Date().toISOString(),
          });
        }
      }
      const targetRoles = ['SYSTEM_ADMIN', 'ROLE_MOD', 'ADMIN_CLIENT'];
      const adminUsers = await this.userRepo.find({
        where: { role: { roleName: In(targetRoles) } },
        relations: ['role'],
      });

      for (const admin of adminUsers) {
        await this.notificationsService.markAsReadByTargetId(
          report.targetId,
          report.reportType,
          admin.userId,
        );
      }

      this.reportGateway.broadcastReportProcessed(report.reportId);

      return {
        EC: 1,
        EM: 'Target hard deleted and report processed successfully',
        data: { report, actionResult },
      };
    } catch (error) {
      console.error('Error in hardDeleteTargetFromReport:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error hard deleting target from report',
      });
    }
  }
}
