import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthRequest } from './types/auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return context.switchToHttp().getRequest<AuthRequest>().user;
  },
);
