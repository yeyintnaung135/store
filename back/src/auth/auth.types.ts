import type { Request } from 'express';
import type { UserRole } from '../generated/prisma/enums.js';

export type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
};

export type AuthToken = {
  accessToken: string;
  user: PublicUser;
};

export type AuthRequest = Request & {
  user: { sub: string; role: UserRole };
};
