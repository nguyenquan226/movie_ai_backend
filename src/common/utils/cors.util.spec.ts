import { parseCorsOrigins, resolveCorsOrigins } from './cors.util';

describe('CORS origin configuration', () => {
  it('allows only configured origins', () => {
    expect(parseCorsOrigins('https://app.example, https://admin.example')).toEqual([
      'https://app.example',
      'https://admin.example',
    ]);
    expect(resolveCorsOrigins('https://app.example')).toBe('https://app.example');
  });

  it('does not fall back to wildcard CORS when configuration is absent or wildcard', () => {
    expect(parseCorsOrigins()).toBe(false);
    expect(parseCorsOrigins('*')).toEqual([]);
  });
});
