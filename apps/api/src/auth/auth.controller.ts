import { BadRequestException, Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { authCookies } from './auth.constants';
import { AuthService } from './auth.service';
import { buildClearSessionCookie, buildSessionCookie, getCookieValue } from './session-cookie';

const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, 'Login kiritilishi kerak.')
    .max(64, 'Login 64 belgidan oshmasin.'),
  password: z.string().min(1, 'Parol kiritilishi kerak.').max(256, 'Parol 256 belgidan oshmasin.'),
});

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Yangi parolni kiriting.')
      .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak.")
      .max(256, 'Parol 256 belgidan oshmasin.'),
    confirmPassword: z.string().min(1, 'Parolni takrorlang.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Parollar bir-biriga mos emas.',
  });

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: "Ma'lumotlarni tekshiring.",
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const input = parsed.data;
    const result = await this.authService.loginUnified(input.login, input.password, request.ip);
    const cookieName = result.cookie === 'platform' ? authCookies.platform : authCookies.shop;

    response.setHeader('Set-Cookie', [
      buildClearSessionCookie(
        result.cookie === 'platform' ? authCookies.shop : authCookies.platform,
      ),
      buildSessionCookie(cookieName, result.token),
    ]);

    return {
      user: result.user,
      redirectTo: result.redirectTo,
    };
  }

  @Get('me')
  me(@Req() request: any) {
    const platformToken = getCookieValue(request.headers.cookie, authCookies.platform);
    const shopToken = getCookieValue(request.headers.cookie, authCookies.shop);

    return this.authService.getUnifiedUserByTokens(platformToken, shopToken);
  }

  @Post('logout')
  async logout(@Req() request: any, @Res({ passthrough: true }) response: any) {
    const platformToken = getCookieValue(request.headers.cookie, authCookies.platform);
    const shopToken = getCookieValue(request.headers.cookie, authCookies.shop);

    await this.authService.logoutUnified(platformToken, shopToken);
    response.setHeader('Set-Cookie', [
      buildClearSessionCookie(authCookies.platform),
      buildClearSessionCookie(authCookies.shop),
    ]);

    return { ok: true };
  }

  @Post('change-password')
  async changePassword(@Body() body: unknown, @Req() request: any) {
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: "Ma'lumotlarni tekshiring.",
        errors: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors)
            .filter(([, messages]) => messages?.[0])
            .map(([field, messages]) => [field, messages?.[0]]),
        ),
      });
    }

    const shopToken = getCookieValue(request.headers.cookie, authCookies.shop);
    const shopUser = await this.authService.getShopUserByToken(shopToken);

    return this.authService.changeShopPassword(shopUser.id, parsed.data.newPassword);
  }
}
