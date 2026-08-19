import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { authCookies, authMessages } from './auth.constants';
import { AuthService } from './auth.service';
import { getCookieValue } from './session-cookie';

@Injectable()
export class ShopAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const shopToken = getCookieValue(request.headers.cookie, authCookies.shop);
    const platformToken = getCookieValue(request.headers.cookie, authCookies.platform);

    if (!shopToken && platformToken) {
      throw new ForbiddenException(authMessages.forbidden);
    }

    request.user = await this.authService.getShopUserByToken(shopToken);
    return true;
  }
}
