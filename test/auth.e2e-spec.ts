import { Controller, ExecutionContext, Get, Injectable, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { LocalAuthGuard } from '../src/modules/auth/local-auth.guard';
import { RolesService } from '../src/modules/roles/roles.service';
import { UsersService } from '../src/modules/users/users.service';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import request from 'supertest';

@Injectable()
class TestRbacGuard {
  private readonly jwtAuthGuard = new JwtAuthGuard(new Reflector());

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    req.user = {
      userId: token === 'admin-token' ? 'admin-1' : 'user-1',
      permissions:
        token === 'admin-token' ? [{ apiPath: '/api/v1/admin/reports', method: 'GET' }] : [],
    };
    return this.jwtAuthGuard.handleRequest(null, req.user, null, context);
  }
}

@Controller('admin')
class TestRbacController {
  @Get('reports')
  @UseGuards(TestRbacGuard)
  getReports() {
    return { reports: [] };
  }
}

describe('Auth and RBAC HTTP flows', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn().mockResolvedValue({ EC: 1, EM: 'registered' }),
    login: jest.fn().mockImplementation((_user, response) => {
      response.cookie('refresh_token', 'refresh-1', { httpOnly: true });
      return { access_token: 'access-1' };
    }),
    processNewToken: jest.fn().mockResolvedValue({ access_token: 'access-2' }),
    handleLogout: jest.fn().mockResolvedValue({ EC: 1, EM: 'Logout ok' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController, TestRbacController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: RolesService, useValue: {} },
        { provide: UsersService, useValue: {} },
        TestRbacGuard,
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            userId: 'user-1',
            email: 'user@example.com',
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(require('cookie-parser')());
    app.setGlobalPrefix('api/v1');
    app.use((req, _res, next) => {
      if (req.path.endsWith('/logout')) {
        req.user = { userId: 'user-1' };
      }
      next();
    });
    await app.init();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => app.close());

  it('registers, logs in, rotates refresh tokens, and logs out', async () => {
    const agent = request.agent(await app.getUrl());

    await agent.post('/api/v1/auth/register').send({}).expect(201);
    const login = await agent.post('/api/v1/auth/login').send({}).expect(201);
    expect(login.body.access_token).toBe('access-1');
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refresh_token=refresh-1')]),
    );

    const refresh = await agent.get('/api/v1/auth/refreshToken').expect(200);
    expect(authService.processNewToken).toHaveBeenCalledWith('refresh-1', expect.any(Object));
    expect(refresh.body.access_token).toBe('access-2');

    await agent.post('/api/v1/auth/logout').set('Authorization', 'Bearer access-1').expect(201);
    expect(authService.handleLogout).toHaveBeenCalledWith(
      expect.any(Object),
      { userId: 'user-1' },
      'access-1',
    );
  });

  it('denies a regular user and allows the permitted administrator route', async () => {
    const baseUrl = await app.getUrl();
    await request(baseUrl)
      .get('/api/v1/admin/reports')
      .set('Authorization', 'Bearer user-token')
      .expect(403);
    await request(baseUrl)
      .get('/api/v1/admin/reports')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);
  });
});
