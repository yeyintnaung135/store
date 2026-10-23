import type { Request } from 'express';

export type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

export type AuthToken = {
  accessToken: string;
  user: PublicUser;
};

export type AuthRequest = Request & {
  user: { sub: string; role: string };
};
