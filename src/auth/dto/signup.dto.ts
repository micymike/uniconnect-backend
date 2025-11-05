import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  googlePhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referredByCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailpasswordBoolean?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pushToken?: string;
}