import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }
}