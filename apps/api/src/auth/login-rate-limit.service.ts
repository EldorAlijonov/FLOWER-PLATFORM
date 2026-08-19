import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type AttemptState = {
  count: number;
  resetAt: number;
};

@Injectable()
export class LoginRateLimitService {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly windowMs = 1000 * 60 * 5;
  private readonly maxAttempts = 5;

  assertAllowed(scope: 'platform' | 'shop', login: string, ip = 'unknown') {
    const key = this.key(scope, login, ip);
    const state = this.attempts.get(key);

    if (!state || state.resetAt <= Date.now()) {
      return;
    }

    if (state.count >= this.maxAttempts) {
      throw new HttpException("Juda ko'p urinish bo'ldi. Birozdan keyin qayta urinib ko'ring.", HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  recordFailure(scope: 'platform' | 'shop', login: string, ip = 'unknown') {
    const key = this.key(scope, login, ip);
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    current.count += 1;
  }

  recordSuccess(scope: 'platform' | 'shop', login: string, ip = 'unknown') {
    this.attempts.delete(this.key(scope, login, ip));
  }

  private key(scope: 'platform' | 'shop', login: string, ip: string) {
    return `${scope}:${login.toLowerCase()}:${ip}`;
  }
}
