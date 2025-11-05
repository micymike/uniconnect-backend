import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findAll() {
    return [];
  }

  async findOne(userId: string) {
    return null;
  }
}