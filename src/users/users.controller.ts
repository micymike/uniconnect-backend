import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    try {
      const users = await this.usersService.findAll();
      return ApiResponse.success('Users fetched successfully', users);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('userId') userId: string) {
    try {
      const user = await this.usersService.findOne(userId);
      return ApiResponse.success('User fetched successfully', user);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}