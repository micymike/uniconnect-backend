import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
  async getProfile(userId: string) {
    return null;
  }

  async updateProfile(userId: string, updateData: any) {
    return null;
  }
}