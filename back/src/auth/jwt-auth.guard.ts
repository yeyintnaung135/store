import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type AuthRequest = Request & {
  user: { sub: string; role: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      request.user = this.jwt.verify(header.slice('Bearer '.length));
      return true;
    } catch {
      throw new UnauthorizedException('Access token is invalid');
    }
  }
}
