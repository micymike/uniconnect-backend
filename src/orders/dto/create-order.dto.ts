import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  itemDetails?: any;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number = 1;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  contactInfo?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}