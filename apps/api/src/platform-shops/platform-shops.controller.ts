import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformAuthGuard } from '../auth/platform-auth.guard';
import {
  createPlatformShopSchema,
  updatePlatformShopSchema,
  zodFieldErrors,
} from './platform-shops.dto';
import { PlatformShopsService } from './platform-shops.service';

@Controller('v1/platform/dashboard')
@UseGuards(PlatformAuthGuard)
export class PlatformDashboardController {
  constructor(private readonly platformShopsService: PlatformShopsService) {}

  @Get()
  dashboard() {
    return this.platformShopsService.getDashboard();
  }
}

@Controller('v1/platform/audit')
@UseGuards(PlatformAuthGuard)
export class PlatformAuditController {
  constructor(private readonly platformShopsService: PlatformShopsService) {}

  @Get()
  listAudit() {
    return this.platformShopsService.listAuditLogs();
  }
}

@Controller('v1/platform/shops')
@UseGuards(PlatformAuthGuard)
export class PlatformShopsController {
  constructor(private readonly platformShopsService: PlatformShopsService) {}

  @Get()
  listShops() {
    return this.platformShopsService.listShops();
  }

  @Get(':id')
  getShop(@Param('id') id: string) {
    return this.platformShopsService.getShop(id);
  }

  @Post()
  createShop(@Body() body: unknown, @Req() request: any) {
    const parsed = createPlatformShopSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: "Ma'lumotlarni tekshiring.",
        errors: zodFieldErrors(parsed.error),
      });
    }

    return this.platformShopsService.createShop(parsed.data, request.platformUser.id);
  }

  @Patch(':id')
  updateShop(@Param('id') id: string, @Body() body: unknown, @Req() request: any) {
    const parsed = updatePlatformShopSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: "Ma'lumotlarni tekshiring.",
        errors: zodFieldErrors(parsed.error),
      });
    }

    return this.platformShopsService.updateShop(id, parsed.data, request.platformUser.id);
  }

  @Post(':id/block')
  blockShop(@Param('id') id: string, @Req() request: any) {
    return this.platformShopsService.blockShop(id, request.platformUser.id);
  }

  @Post(':id/unblock')
  unblockShop(@Param('id') id: string, @Req() request: any) {
    return this.platformShopsService.unblockShop(id, request.platformUser.id);
  }

  @Post(':id/reset-owner-password')
  resetOwnerPassword(@Param('id') id: string, @Req() request: any) {
    return this.platformShopsService.resetOwnerPassword(id, request.platformUser.id);
  }

  @Delete(':id')
  deleteShop(@Param('id') id: string, @Req() request: any) {
    return this.platformShopsService.deleteShop(id, request.platformUser.id);
  }
}
