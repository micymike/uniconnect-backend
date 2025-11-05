import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ApiResponse } from '../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
  async signup(@Body() signupDto: SignupDto) {
    try {
      const result = await this.authService.signup(signupDto);
      return ApiResponse.success('User created successfully', result);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto.email, loginDto.password);
      return ApiResponse.success('Login successful', result);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('google')
  @ApiOperation({ summary: 'Google authentication' })
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    try {
      const result = await this.authService.googleAuth(googleAuthDto);
      return ApiResponse.success('Authentication successful', result);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('verify-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify JWT token' })
  async verifyToken(@Request() req) {
    try {
      const user = await this.authService.verifyToken(req.user.userId);
      if (!user) {
        return ApiResponse.error('Invalid token');
      }
      return ApiResponse.success('Token is valid', { user });
    } catch (error) {
      return ApiResponse.error('Invalid token');
    }
  }
}