import { hasMatchingPermission } from './permission.util';

describe('hasMatchingPermission', () => {
  it('matches an exact method and route', () => {
    expect(
      hasMatchingPermission([{ apiPath: '/films/:id', method: 'GET' }], 'GET', '/films/:id'),
    ).toBe(true);
  });

  it('does not grant access for another method or route', () => {
    const permissions = [{ apiPath: '/films/:id', method: 'GET' }];
    expect(hasMatchingPermission(permissions, 'DELETE', '/films/:id')).toBe(false);
    expect(hasMatchingPermission(permissions, 'GET', '/users/:id')).toBe(false);
  });

  it('rejects missing route metadata and empty permissions', () => {
    expect(hasMatchingPermission([], 'GET', '/films')).toBe(false);
    expect(hasMatchingPermission(undefined, 'GET', undefined)).toBe(false);
  });
});
