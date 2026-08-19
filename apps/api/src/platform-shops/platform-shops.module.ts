import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PasswordService } from '../auth/password.service';
import { PrismaModule } from '../database/prisma.module';
import {
  PlatformAuditController,
  PlatformDashboardController,
  PlatformShopsController,
} from './platform-shops.controller';
import { PlatformShopsService } from './platform-shops.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PlatformShopsController, PlatformDashboardController, PlatformAuditController],
  providers: [PlatformShopsService, PasswordService],
})
export class PlatformShopsModule {}
