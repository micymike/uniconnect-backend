import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { generateReferralCode, hashPassword, comparePassword, sanitizeUser } from '../common/utils/helpers';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, username, googlePhotoUrl, referredByCode, emailpasswordBoolean, pushToken } = signupDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email is already taken');
    }

    const hashedPassword = await hashPassword(password);
    
    let referralCode: string;
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode(username);
      const codeCheck = await this.userRepository.findOne({ where: { referralCode } });
      if (!codeCheck) {
        isUnique = true;
      }
    }

    let referredBy = null;
    if (referredByCode) {
      const referrer = await this.userRepository.findOne({ where: { referralCode: referredByCode } });
      if (referrer) {
        referredBy = referredByCode;
      }
    }

    const newUser = this.userRepository.create({
      username,
      email,
      accountType: 'offer',
      acceptedTerms: true,
      googlePhotoUrl: googlePhotoUrl || null,
      referralCode,
      referredBy,
      emailpassword: emailpasswordBoolean || true,
      pushToken: pushToken || null,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);
    const token = this.generateToken({ userId: savedUser.userId, email: savedUser.email });
    return { user: sanitizeUser(savedUser), token };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken({ userId: user.userId, email: user.email });
    return { user: sanitizeUser(user), token };
  }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    const { email, username, googlePhotoUrl, pushToken } = googleAuthDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      const token = this.generateToken({ userId: existingUser.userId, email: existingUser.email });
      return { user: sanitizeUser(existingUser), token };
    }

    let referralCode: string;
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode(username);
      const codeCheck = await this.userRepository.findOne({ where: { referralCode } });
      if (!codeCheck) {
        isUnique = true;
      }
    }

    const newUser = this.userRepository.create({
      username,
      email,
      accountType: 'offer',
      acceptedTerms: true,
      googlePhotoUrl,
      referralCode,
      emailpassword: false,
      pushToken,
      password: null,
    });

    const savedUser = await this.userRepository.save(newUser);
    const token = this.generateToken({ userId: savedUser.userId, email: savedUser.email });
    return { user: sanitizeUser(savedUser), token };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await comparePassword(password, user.password)) {
      return user;
    }
    return null;
  }

  async verifyToken(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    return user ? sanitizeUser(user) : null;
  }

  private generateToken(payload: { userId: string; email: string }) {
    return this.jwtService.sign(payload);
  }
}