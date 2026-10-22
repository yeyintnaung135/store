import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthRequest } from './jwt-auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return context.switchToHttp().getRequest<AuthRequest>().user;
  },
);
