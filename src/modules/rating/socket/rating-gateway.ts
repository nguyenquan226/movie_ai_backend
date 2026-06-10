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
export class RatingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {}

  broadcastRatingUpdate(data: {
    filmId: string;
    averageRating: number;
    totalRatings: number;
    newRating?: any;
  }) {
    this.server.emit('ratingUpdated', data);
  }

  broadcastRatingDelete(data: { filmId: string; ratingId: string }) {
    this.server.emit('ratingDeleted', data);
  }

  broadcastHideRating(ratingId: string, isHidden: boolean, filmId: string) {
    this.server.emit('hideRating', { ratingId, isHidden, filmId });
  }
}
