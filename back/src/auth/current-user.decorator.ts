import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthRequest } from './auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    return request.user;
  },
);
