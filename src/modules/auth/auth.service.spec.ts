import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: { updateUserToken: jest.Mock; findUserByRefreshToken: jest.Mock };
  let jwt: { sign: jest.Mock; verify: jest.Mock; decode: jest.Mock };
  let blacklist: { add: jest.Mock };
  let config: { get: jest.Mock };
  let roles: { findOne: jest.Mock };

  beforeEach(() => {
    users = {
      updateUserToken: jest.fn().mockResolvedValue(undefined),
      findUserByRefreshToken: jest.fn(),
    };
    jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
      decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 600 }),
    };
    blacklist = { add: jest.fn().mockResolvedValue(undefined) };
    config = {
      get: jest.fn((key: string) => (key === 'REFRESH_TOKEN_expiresIn' ? '7d' : 'refresh-secret')),
    };
    roles = { findOne: jest.fn().mockResolvedValue({ role: { permissons: [] } }) };
    service = new AuthService(
      users as any,
      config as any,
      jwt as any,
      roles as any,
      {} as any,
      blacklist as any,
    );
  });

  it('stores a rotated refresh token and sets the refresh cookie', async () => {
    users.findUserByRefreshToken.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      roleId: 'role-1',
      fullName: 'User',
    });
    const response = { clearCookie: jest.fn(), cookie: jest.fn() };

    const result = await service.processNewToken('old-refresh-token', response as any);

    expect(jwt.verify).toHaveBeenCalledWith('old-refresh-token', { secret: 'refresh-secret' });
    expect(users.updateUserToken).toHaveBeenCalledWith('signed-token', 'user-1');
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token');
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'signed-token',
      expect.any(Object),
    );
    expect(result.access_token).toBe('signed-token');
  });

  it('blacklists the current access token on logout', async () => {
    const response = { clearCookie: jest.fn() };

    await service.handleLogout(response as any, { userId: 'user-1' } as any, 'access-token');

    expect(users.updateUserToken).toHaveBeenCalledWith('', 'user-1');
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token');
    expect(blacklist.add).toHaveBeenCalledWith('access-token', expect.any(Number));
  });
});
