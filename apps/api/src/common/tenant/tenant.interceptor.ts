import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const shopId = request.user?.shopId;
    const userId = request.user?.id;
    const role = request.user?.role;
    const permissions = request.user?.permissions ?? [];

    if (!shopId || !userId) {
      return next.handle();
    }

    return TenantContext.run({ shopId, userId, role, permissions }, () => next.handle());
  }
}
