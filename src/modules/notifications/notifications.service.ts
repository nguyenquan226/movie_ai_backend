import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { IUser } from '../users/interface/user.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async createNotification(data: CreateNotificationDto) {
    const notification = this.notificationRepo.create({
      user: { userId: data.userId } as any,
      type: data.type,
      message: data.message,
      replier: data.replierId ? ({ userId: data.replierId } as any) : null,
      result: data.result,
      isRead: false,
    });

    return await this.notificationRepo.save(notification);
  }

  async getNotifications(user: IUser, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [result, total] = await this.notificationRepo.findAndCount({
      where: { user: { userId: user.userId } },
      relations: ['replier'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      EC: 1,
      EM: 'Get notifications successfully',
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: result,
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepo.count({
      where: { user: { userId }, isRead: false },
    });

    return {
      EC: 1,
      EM: 'Get unread count successfully',
      count,
    };
  }

  async markAsRead(notificationId: number, user: IUser) {
    const notification = await this.notificationRepo.findOne({
      where: { notificationId, user: { userId: user.userId } },
    });

    if (!notification) {
      return {
        EC: 0,
        EM: 'Notification not found',
      };
    }

    notification.isRead = true;
    await this.notificationRepo.save(notification);

    return {
      EC: 1,
      EM: 'Mark as read successfully',
    };
  }

  async markAllAsRead(user: IUser) {
    await this.notificationRepo.update(
      { user: { userId: user.userId }, isRead: false },
      { isRead: true },
    );

    return {
      EC: 1,
      EM: 'Mark all as read successfully',
    };
  }

  async deleteNotification(notificationId: number, user: IUser) {
    const notification = await this.notificationRepo.findOne({
      where: { notificationId, user: { userId: user.userId } },
    });

    if (!notification) {
      return {
        EC: 0,
        EM: 'Notification not found',
      };
    }

    await this.notificationRepo.remove(notification);

    return {
      EC: 1,
      EM: 'Delete notification successfully',
    };
  }

  async markAsReadByReportId(reportId: string, userId: number) {
    const notifications = await this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.isRead = :isRead', { isRead: false })
      .andWhere('notification.type = :type', { type: 'report' })
      .getMany();

    const targetNotifications = notifications.filter((n) => {
      const res = typeof n.result === 'string' ? JSON.parse(n.result) : n.result;
      return res && res.reportId === reportId;
    });

    if (targetNotifications.length > 0) {
      for (const n of targetNotifications) {
        n.isRead = true;
        await this.notificationRepo.save(n);
      }
    }
  }

  async markAsReadByTargetId(targetId: string, reportType: string, userId: number) {
    const notifications = await this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.isRead = :isRead', { isRead: false })
      .andWhere('notification.type = :type', { type: 'report' })
      .getMany();

    const targetNotifications = notifications.filter((n) => {
      const res = typeof n.result === 'string' ? JSON.parse(n.result) : n.result;
      if (!res) return false;
      if (reportType === 'COMMENT') {
        return res.commentId === targetId;
      } else if (reportType === 'RATING') {
        return res.ratingId === targetId;
      }
      return false;
    });

    if (targetNotifications.length > 0) {
      for (const n of targetNotifications) {
        n.isRead = true;
        await this.notificationRepo.save(n);
      }
    }
  }
}
