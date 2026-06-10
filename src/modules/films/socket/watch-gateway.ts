import { Logger } from '@nestjs/common';

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CoWatchingService } from 'src/modules/co-watching/co-watching.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methos: ['GET', 'POST'],
    credential: true,
    allowedHeader: ['*'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class WatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WatchGateway');

  constructor(private readonly coWatchingService: CoWatchingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`>>> Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`>>> Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const { roomId } = data;
    await client.join(roomId);

    this.logger.log(`Client ${client.id} joined room: ${roomId}`);

    client.to(roomId).emit('user_joined', {
      userId: client.id,
      roomId,
    });

    return {
      success: true,
      roomId,
      userId: client.id,
      roomSize: this.server.sockets.adapter.rooms.get(roomId)?.size || 1,
    };
  }

  @SubscribeMessage('sync_event')
  handleSyncEvent(
    @MessageBody() data: { roomId: string; event: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, event } = data;

    this.logger.log(`Sync event in room ${roomId} from ${client.id}:`, event);
    if (event.type === 'syncEpisode') {
      this.coWatchingService.update(roomId, {
        partNumber: event.part,
        episodeNumber: event.episode,
      });
    }

    client.to(roomId).emit('sync_event', event);

    return { success: true };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    await client.leave(roomId);

    this.logger.log(`Client ${client.id} left room: ${roomId}`);

    client.to(roomId).emit('user_left', {
      userId: client.id,
      roomId,
    });

    return { success: true };
  }
}
