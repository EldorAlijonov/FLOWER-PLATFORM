import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { authCookies, authMessages } from './auth.constants';
import { AuthService } from './auth.service';
import { getCookieValue } from './session-cookie';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const platformToken = getCookieValue(request.headers.cookie, authCookies.platform);
    const shopToken = getCookieValue(request.headers.cookie, authCookies.shop);

    if (!platformToken && shopToken) {
      throw new ForbiddenException(authMessages.forbidden);
    }

    request.platformUser = await this.authService.getPlatformUserByToken(platformToken);
    return true;
  }
}
