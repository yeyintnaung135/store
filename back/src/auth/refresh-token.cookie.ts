import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function refreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
  };
}

export function refreshTokenSetOptions(): CookieOptions {
  return {
    ...refreshTokenCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}
