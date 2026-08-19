import { Module } from '@nestjs/common';
import { CrmAdminController } from './crm-admin.controller';
import { CrmAdminService } from './crm-admin.service';

@Module({
  controllers: [CrmAdminController],
  providers: [CrmAdminService],
})
export class CrmAdminModule {}
