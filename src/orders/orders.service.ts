import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const newOrder = this.orderRepository.create({
      userId: createOrderDto.userId,
      type: createOrderDto.type,
      itemId: createOrderDto.itemId,
      itemDetails: createOrderDto.itemDetails,
      quantity: createOrderDto.quantity,
      totalAmount: createOrderDto.totalAmount,
      deliveryAddress: createOrderDto.deliveryAddress,
      contactInfo: createOrderDto.contactInfo,
      specialInstructions: createOrderDto.specialInstructions,
      status: 'pending',
      paymentStatus: 'pending',
    });

    return await this.orderRepository.save(newOrder);
  }

  async findByUser(userId: string, page = 1, limit = 20, status?: string, type?: string) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('order.type = :type', { type });
    }

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(orderId: string) {
    const order = await this.orderRepository.findOne({ where: { orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async update(orderId: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(orderId);
    
    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    if (updateOrderDto.paymentStatus) {
      order.paymentStatus = updateOrderDto.paymentStatus;
    }

    return await this.orderRepository.save(order);
  }

  async remove(orderId: string) {
    const order = await this.findOne(orderId);

    if (order.status !== 'pending' && order.status !== 'cancelled') {
      throw new BadRequestException('Cannot delete order in current status');
    }

    await this.orderRepository.remove(order);
    return { message: 'Order deleted successfully' };
  }

  async getStats(userId: string) {
    const orders = await this.orderRepository.find({ 
      where: { userId },
      select: ['status', 'totalAmount', 'type', 'createdAt']
    });

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalSpent: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      mealOrders: orders.filter(o => o.type === 'meal').length,
      marketOrders: orders.filter(o => o.type === 'market').length
    };
  }
}