import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Public, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  @Permission('Get notifications', 'NOTIFICATIONS')
  @SkipCheckPermission()
  getNotifications(@User() user: IUser, @Query() query: any) {
    return this.notificationsService.getNotifications(user, query);
  }

  @Get('unread-count')
  @Permission('Get unread count', 'NOTIFICATIONS')
  @SkipCheckPermission()
  getUnreadCount(@User() user: IUser) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  @Permission('Mark notification as read', 'NOTIFICATIONS')
  @SkipCheckPermission()
  markAsRead(@Param('id') id: string, @User() user: IUser) {
    return this.notificationsService.markAsRead(parseInt(id), user);
  }

  @Patch('read-all')
  @Permission('Mark all notifications as read', 'NOTIFICATIONS')
  @SkipCheckPermission()
  markAllAsRead(@User() user: IUser) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Delete(':id')
  @Permission('Delete notification', 'NOTIFICATIONS')
  @SkipCheckPermission()
  deleteNotification(@Param('id') id: string, @User() user: IUser) {
    return this.notificationsService.deleteNotification(parseInt(id), user);
  }
}
