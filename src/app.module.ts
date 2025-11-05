import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { MealsModule } from './meals/meals.module';
import { MarketModule } from './market/market.module';
import { RentalsModule } from './rentals/rentals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { DatabaseModule } from './config/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    MealsModule,
    MarketModule,
    RentalsModule,
    NotificationsModule,
    ProfileModule,
  ],
})
export class AppModule {}