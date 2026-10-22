import { FilmsService } from './films.service';

describe('FilmsService view counter', () => {
  it('buffers a view once and applies the cooldown key', async () => {
    const redis = {
      setIfNotExists: jest.fn().mockResolvedValue(true),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(true),
      lpush: jest.fn().mockResolvedValue(1),
    };
    const service = new FilmsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      redis as any,
    );

    const result = await service.updateView('film-1', 'user-1');

    expect(result.EM).toBe('View counted successfully');
    expect(redis.setIfNotExists).toHaveBeenCalledWith('view:film:film-1:user:user-1', '1', 180);
    expect(redis.incr).toHaveBeenCalledWith('view:film:film-1:pending');
  });

  it('does not increment again during the cooldown', async () => {
    const redis = {
      setIfNotExists: jest.fn().mockResolvedValue(false),
      incr: jest.fn(),
      expire: jest.fn(),
      lpush: jest.fn(),
    };
    const service = new FilmsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      redis as any,
    );

    const result = await service.updateView('film-1', 'user-1');

    expect(result.EM).toBe('View already counted recently');
    expect(redis.incr).not.toHaveBeenCalled();
  });
});
