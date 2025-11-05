import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  orderId: string;

  @Column()
  userId: string;

  @Column()
  type: string;

  @Column()
  itemId: string;

  @Column('jsonb', { nullable: true })
  itemDetails: any;

  @Column({ default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  deliveryAddress: string;

  @Column('jsonb', { nullable: true })
  contactInfo: any;

  @Column({ nullable: true })
  specialInstructions: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 'pending' })
  paymentStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}