import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ReportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();
  private adminSockets = new Set<string>();

  handleConnection(client: Socket) {
  }

  handleDisconnect(client: Socket) {
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

  sendReportNotificationToAdmin(userId: number, data: any) {
    for (const socketId of this.adminSockets) {
      this.server.to(socketId).emit('reportNotification', data);
    }
  }

  broadcastReportProcessed(reportId: string) {
    for (const socketId of this.adminSockets) {
      this.server.to(socketId).emit('reportProcessed', { reportId });
    }
  }
}
