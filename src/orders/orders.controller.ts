import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      const order = await this.ordersService.create(createOrderDto);
      return ApiResponse.success('Order created successfully', order);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get orders by user ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    try {
      const result = await this.ordersService.findByUser(userId, page, limit, status, type);
      return ApiResponse.success('Orders fetched successfully', result);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('orderId') orderId: string) {
    try {
      const order = await this.ordersService.findOne(orderId);
      return ApiResponse.success('Order fetched successfully', order);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Update order status' })
  async update(@Param('orderId') orderId: string, @Body() updateOrderDto: UpdateOrderDto) {
    try {
      const order = await this.ordersService.update(orderId, updateOrderDto);
      return ApiResponse.success('Order status updated successfully', order);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':orderId')
  @ApiOperation({ summary: 'Delete order' })
  async remove(@Param('orderId') orderId: string) {
    try {
      const result = await this.ordersService.remove(orderId);
      return ApiResponse.success('Order deleted successfully', result);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get order statistics for user' })
  async getStats(@Param('userId') userId: string) {
    try {
      const stats = await this.ordersService.getStats(userId);
      return ApiResponse.success('Order stats fetched successfully', stats);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}