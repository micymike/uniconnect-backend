import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Meals')
@Controller('meals')
export class MealsController {
  constructor(private mealsService: MealsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all meals' })
  async findAll() {
    try {
      const meals = await this.mealsService.findAll();
      return ApiResponse.success('Meals fetched successfully', meals);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meal by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const meal = await this.mealsService.findOne(id);
      return ApiResponse.success('Meal fetched successfully', meal);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}