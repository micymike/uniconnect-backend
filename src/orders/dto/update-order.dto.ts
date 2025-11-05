import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'paid', 'failed', 'refunded'])
  paymentStatus?: string;
}