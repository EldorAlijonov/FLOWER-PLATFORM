import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      name: 'flower-platform-api',
      status: 'ok',
      routes: {
        dashboard: '/api/crm-admin/dashboard',
        auth: '/api/v1/auth/login',
        platformProfiles: '/api/v1/platform/auth/profiles',
      },
    };
  }
}
