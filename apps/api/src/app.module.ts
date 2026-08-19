import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CrmAdminModule } from './crm-admin/crm-admin.module';
import { PrismaModule } from './database/prisma.module';
import { PlatformShopsModule } from './platform-shops/platform-shops.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CrmAdminModule,
    PlatformShopsModule,
    PrismaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
