import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import {
  RESET_TOKEN_COOKIE,
  resetTokenCookieOptions,
  resetTokenSetOptions,
} from './reset-token.cookie.js';
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
  refreshTokenSetOptions,
} from './refresh-token.cookie.js';

const resetMessage =
  'If an account exists, the reset token was stored in a cookie';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register with an email or a phone number',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      refreshTokenSetOptions(),
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Log in with an email or phone and receive an access token',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      refreshTokenSetOptions(),
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new access token',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    const session = await this.authService.refresh(token);

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      refreshTokenSetOptions(),
    );

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Revoke the refresh token and clear its cookie',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

    await this.authService.logout(token);

    response.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions());

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Read the current user from the bearer JWT',
  })
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Put a password reset token in an HttpOnly cookie',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.createResetToken(dto);

    if (token) {
      response.cookie(RESET_TOKEN_COOKIE, token, resetTokenSetOptions());
    }

    return { message: resetMessage };
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Set a new password using the reset token cookie',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[RESET_TOKEN_COOKIE] as string | undefined;

    await this.authService.resetPassword(token, dto.password);

    response.clearCookie(RESET_TOKEN_COOKIE, resetTokenCookieOptions());

    return { message: 'Password updated' };
  }
}
