import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Market')
@Controller('market')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get()
  @ApiOperation({ summary: 'Get all market items' })
  async findAll() {
    try {
      const items = await this.marketService.findAll();
      return ApiResponse.success('Market items fetched successfully', items);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get market item by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const item = await this.marketService.findOne(id);
      return ApiResponse.success('Market item fetched successfully', item);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}