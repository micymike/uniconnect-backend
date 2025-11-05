import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalsController {
  constructor(private rentalsService: RentalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rentals' })
  async findAll() {
    try {
      const rentals = await this.rentalsService.findAll();
      return ApiResponse.success('Rentals fetched successfully', rentals);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rental by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const rental = await this.rentalsService.findOne(id);
      return ApiResponse.success('Rental fetched successfully', rental);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}