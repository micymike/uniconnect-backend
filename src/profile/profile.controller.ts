import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Param('userId') userId: string) {
    try {
      const profile = await this.profileService.getProfile(userId);
      return ApiResponse.success('Profile fetched successfully', profile);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Param('userId') userId: string, @Body() updateData: any) {
    try {
      const profile = await this.profileService.updateProfile(userId, updateData);
      return ApiResponse.success('Profile updated successfully', profile);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}