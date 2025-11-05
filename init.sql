-- Create database if not exists
CREATE DATABASE uniconnect_db;

-- Connect to the database
\c uniconnect_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    "userId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    "accountType" VARCHAR(50) DEFAULT 'offer',
    "acceptedTerms" BOOLEAN DEFAULT true,
    "googlePhotoUrl" TEXT,
    "referralCode" VARCHAR(255) UNIQUE NOT NULL,
    "referredBy" VARCHAR(255),
    emailpassword BOOLEAN DEFAULT true,
    "pushToken" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    "orderId" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    "itemId" VARCHAR(255) NOT NULL,
    "itemDetails" JSONB,
    quantity INTEGER DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "contactInfo" JSONB,
    "specialInstructions" TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    "paymentStatus" VARCHAR(50) DEFAULT 'pending',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users("referralCode");
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders("createdAt");

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();