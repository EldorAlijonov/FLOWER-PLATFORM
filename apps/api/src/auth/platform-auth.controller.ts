import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PlatformAuthGuard } from './platform-auth.guard';

@Controller('v1/platform/auth')
export class PlatformAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profiles')
  @UseGuards(PlatformAuthGuard)
  profiles() {
    return this.authService.listProfiles();
  }
}
