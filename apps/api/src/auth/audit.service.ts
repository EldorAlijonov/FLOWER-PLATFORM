import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

type AuthAuditInput = {
  action:
    'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'USER_BLOCKED_LOGIN_ATTEMPT' | 'PASSWORD_CHANGED';
  entity: 'PLATFORM_AUTH' | 'SHOP_AUTH';
  shopId?: string;
  userId?: string;
  platformUserId?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuthAuditInput) {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        shopId: input.shopId,
        userId: input.userId,
        platformUserId: input.platformUserId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}
