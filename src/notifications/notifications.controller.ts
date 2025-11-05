import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  async findAll() {
    try {
      const notifications = await this.notificationsService.findAll();
      return ApiResponse.success('Notifications fetched successfully', notifications);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications by user ID' })
  async findByUser(@Param('userId') userId: string) {
    try {
      const notifications = await this.notificationsService.findByUser(userId);
      return ApiResponse.success('User notifications fetched successfully', notifications);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}