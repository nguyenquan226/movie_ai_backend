export type PermissionMatch = {
  apiPath: string;
  method: string;
};

export function isAuthEndpoint(endpoint?: string): boolean {
  if (!endpoint) {
    return false;
  }
  return endpoint.startsWith('/api/v1/auth') || endpoint.startsWith('/api/v2/auth');
}

export function hasMatchingPermission(
  permissions: PermissionMatch[] | undefined,
  method: string,
  endpoint: string | undefined,
): boolean {
  if (isAuthEndpoint(endpoint)) {
    return true;
  }

  if (!endpoint) {
    return false;
  }

  return (permissions ?? []).some(
    (permission) => permission.apiPath === endpoint && permission.method === method,
  );
}
