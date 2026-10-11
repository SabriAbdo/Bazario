import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp?: number;
}

/** Returns the token's expiration time in epoch ms, or null if undecodable/missing. */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiryMs = getTokenExpiryMs(token);
  return expiryMs === null ? true : expiryMs <= Date.now();
}
