export const RESET_TOKEN_COOKIE = 'reset_token';

export const RESET_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

export function resetTokenCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/auth',
  };
}

export function resetTokenSetOptions() {
  return {
    ...resetTokenCookieOptions(),
    maxAge: RESET_TOKEN_MAX_AGE_MS,
  };
}
