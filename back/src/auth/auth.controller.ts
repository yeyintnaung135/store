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
import { ForgotPasswordDto } from './types/forgot-password.dto.js';
import { LoginDto } from './types/login.dto.js';
import { RegisterDto } from './types/register.dto.js';
import { ResetPasswordDto } from './types/reset-password.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import {
  RESET_TOKEN_COOKIE,
  resetTokenCookieOptions,
  resetTokenSetOptions,
} from './reset-token.cookie.js';

const resetMessage =
  'If an account exists, the reset token was stored in a cookie';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register with an email or a phone number' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Log in with an email or a phone number and receive a JWT',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read the current user from the bearer JWT' })
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Put a password reset token in an httpOnly cookie',
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
  @ApiOperation({ summary: 'Set a new password using the reset token cookie' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.resetPassword(
      request.cookies?.[RESET_TOKEN_COOKIE],
      dto.password,
    );
    response.clearCookie(RESET_TOKEN_COOKIE, resetTokenCookieOptions());
    return { message: 'Password updated' };
  }
}
