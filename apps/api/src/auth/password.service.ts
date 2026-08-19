import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  async hash(password: string) {
    return bcrypt.hash(password, 12);
  }

  async verify(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  }
}
