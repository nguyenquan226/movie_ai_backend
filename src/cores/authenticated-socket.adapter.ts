import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, ServerOptions, Socket } from 'socket.io';
import { TokenBlacklistService } from 'src/modules/auth/token-blacklist.service';
import { resolveCorsOrigins } from 'src/common/utils/cors.util';

export class AuthenticatedSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const corsOrigin = resolveCorsOrigins(
      this.configService.get<string>('FRONTEND_URL'),
      this.configService.get<string>('CORS_ORIGINS'),
    );

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST'],
      },
    }) as Server;

    server.use(async (socket: Socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const blacklisted = await this.tokenBlacklistService.isBlacklisted(token);
        if (blacklisted) {
          return next(new Error('Unauthorized'));
        }

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        });
        socket.data.user = payload;
        return next();
      } catch {
        return next(new Error('Unauthorized'));
      }
    });

    return server;
  }

  private extractToken(socket: Socket): string | undefined {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    const queryToken = socket.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    return undefined;
  }
}
