import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { LoginRateLimitService } from './login-rate-limit.service';
import { PasswordService } from './password.service';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthGuard } from './platform-auth.guard';
import { ShopAuthGuard } from './shop-auth.guard';

@Module({
  controllers: [AuthController, PlatformAuthController],
  providers: [
    AuthService,
    AuditService,
    LoginRateLimitService,
    PasswordService,
    PlatformAuthGuard,
    ShopAuthGuard,
  ],
  exports: [AuthService, PlatformAuthGuard, ShopAuthGuard],
})
export class AuthModule {}
