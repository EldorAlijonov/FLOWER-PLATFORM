import { Controller, Get } from '@nestjs/common';
import { CrmAdminService } from './crm-admin.service';

@Controller('crm-admin')
export class CrmAdminController {
  constructor(private readonly crmAdminService: CrmAdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.crmAdminService.getDashboard();
  }
}
