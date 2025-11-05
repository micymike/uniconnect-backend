import { Injectable } from '@nestjs/common';

@Injectable()
export class MealsService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }
}