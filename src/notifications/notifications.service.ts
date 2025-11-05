import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async findAll() {
    return [];
  }

  async findByUser(userId: string) {
    return [];
  }
}