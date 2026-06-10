import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class CommentGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();
  private adminSockets = new Set<string>();

  handleConnection(client: Socket) {
    client.on('disconnect', () => {
      for (const [userId, socketSet] of this.userSockets.entries()) {
        if (socketSet.has(client.id)) {
          socketSet.delete(client.id);
          if (socketSet.size === 0) {
            this.userSockets.delete(userId);
          }
          break;
        }
      }

      if (this.adminSockets.has(client.id)) {
        this.adminSockets.delete(client.id);
      }
    });
  }

  @SubscribeMessage('register')
  handleRegister(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (data?.userId) {
      const userIdStr = String(data.userId);
      if (!this.userSockets.has(userIdStr)) {
        this.userSockets.set(userIdStr, new Set());
      }
      this.userSockets.get(userIdStr)!.add(client.id);
    }
  }

  @SubscribeMessage('registerAdmin')
  handleRegisterAdmin(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    this.adminSockets.add(client.id);

    if (data?.userId) {
      const userIdStr = String(data.userId);
      if (!this.userSockets.has(userIdStr)) {
        this.userSockets.set(userIdStr, new Set());
      }
      this.userSockets.get(userIdStr)!.add(client.id);
    }
  }

  private emitToUser(userId: string, event: string, data: any) {
    const userIdStr = String(userId);
    const socketSet = this.userSockets.get(userIdStr);
    if (socketSet && socketSet.size > 0) {
      for (const socketId of socketSet) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  sendReplyNotification(targetUserId: string, data: any) {
    this.emitToUser(targetUserId, 'replyNotification', data);
  }

  sendReactionNotification(targetUserId: string, data: any) {
    this.emitToUser(targetUserId, 'reactionNotification', data);
  }

  @SubscribeMessage('sendComment')
  handleSendComment(@MessageBody() data: any) {
    this.server.emit('newComment', data);
  }

  broadcastNewComment(comment: any) {
    this.server.emit('newComment', comment);
  }

  broadcastReplyComment(data: any) {
    this.server.emit('replyComment', data);
  }

  broadcastDeleteComment(commentId: string) {
    this.server.emit('deleteComment', { commentId });
  }

  broadcastHideComment(commentId: string, isHidden: boolean) {
    this.server.emit('hideComment', { commentId, isHidden });
  }

  broadcastUnhideComment(comment: any) {
    this.server.emit('unhideComment', comment);
  }

  broadcastUpdateComment(comment: any) {
    this.server.emit('updateComment', comment);
  }

  broadcastReactComment(reaction: any) {
    this.server.emit('reactComment', reaction);
  }

  broadcastCountComments(data: { filmId: string; total: number }) {
    this.server.emit('countComments', data);
  }

  sendHiddenCommentNotification(userId: number, data: any) {
    const userIdStr = String(userId);
    this.emitToUser(userIdStr, 'hiddenCommentNotification', data);
  }

  sendWarningNotification(userId: number, data: any) {
    const userIdStr = String(userId);
    this.emitToUser(userIdStr, 'warningNotification', data);
  }

  sendInfoNotification(userId: number, data: any) {
    const userIdStr = String(userId);
    this.emitToUser(userIdStr, 'infoNotification', data);
  }
}
