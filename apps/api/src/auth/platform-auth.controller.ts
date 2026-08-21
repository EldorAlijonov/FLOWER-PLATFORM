import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { authCookies } from './auth.constants';
import { AuthService } from './auth.service';
import { PlatformAuthGuard } from './platform-auth.guard';
import { getCookieValue } from './session-cookie';

const platformPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Hozirgi parolni kiriting.').max(256),
    newPassword: z
      .string()
      .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak.")
      .max(256),
    confirmPassword: z.string().min(1, 'Parolni takrorlang.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Parollar bir-biriga mos emas.',
  });

@Controller('v1/platform/auth')
export class PlatformAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profiles')
  @UseGuards(PlatformAuthGuard)
  profiles() {
    return this.authService.listProfiles();
  }

  @Get('profile')
  @UseGuards(PlatformAuthGuard)
  profile(@Req() request: any) {
    return {
      user: request.platformUser,
    };
  }

  @Get('security')
  @UseGuards(PlatformAuthGuard)
  security(@Req() request: any) {
    const token = getCookieValue(request.headers.cookie, authCookies.platform);
    return this.authService.getPlatformSecurity(request.platformUser.id, token);
  }

  @Post('change-password')
  @UseGuards(PlatformAuthGuard)
  changePassword(@Body() body: unknown, @Req() request: any) {
    const parsed = platformPasswordChangeSchema.safeParse(body);

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

    const token = getCookieValue(request.headers.cookie, authCookies.platform);
    return this.authService.changePlatformPassword(
      request.platformUser.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
      token,
    );
  }
}
