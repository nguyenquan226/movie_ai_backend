export function parseCorsOrigins(raw?: string): boolean | string | string[] {
  const value = raw?.trim();
  if (!value || value === '*') {
    return true;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return true;
  }

  return origins.length === 1 ? origins[0] : origins;
}

export function resolveCorsOrigins(frontendUrl?: string, corsOrigins?: string): boolean | string | string[] {
  return parseCorsOrigins(corsOrigins || frontendUrl);
}
