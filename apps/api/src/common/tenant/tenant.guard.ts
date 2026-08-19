import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Foundation placeholder: auth will attach membership and shopId to the request.
    return Boolean(request.user?.shopId);
  }
}
