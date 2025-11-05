import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: 'offer' })
  accountType: string;

  @Column({ default: true })
  acceptedTerms: boolean;

  @Column({ nullable: true })
  googlePhotoUrl: string;

  @Column({ unique: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @Column({ default: true })
  emailpassword: boolean;

  @Column({ nullable: true })
  pushToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}