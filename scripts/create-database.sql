-- UniConnect Database Schema
-- Auto-generated from backend routes
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    accountType VARCHAR(50) DEFAULT 'offer',
    acceptedTerms BOOLEAN DEFAULT true,
    googlePhotoUrl TEXT,
    referralCode VARCHAR(255) UNIQUE NOT NULL,
    referredBy VARCHAR(255),
    emailpassword BOOLEAN DEFAULT true,
    pushToken TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal Posts table
CREATE TABLE IF NOT EXISTS meal_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mealId VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    images TEXT[], -- Array of image URLs
    location VARCHAR(255) NOT NULL,
    restaurantName VARCHAR(255) DEFAULT 'Uniconnect',
    deliveryOptions BOOLEAN DEFAULT false,
    category VARCHAR(100) DEFAULT 'General',
    tags TEXT[], -- Array of tags
    ingredients TEXT[], -- Array of ingredients
    status VARCHAR(50) DEFAULT 'available',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Marketplace table
CREATE TABLE IF NOT EXISTS marketplace (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    productId VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    frontImage TEXT,
    backImage TEXT,
    category VARCHAR(100) DEFAULT 'Others',
    subcategory VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'Used',
    location VARCHAR(255) NOT NULL,
    negotiable BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'available',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderId VARCHAR(255) UNIQUE NOT NULL,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'meal' or 'market'
    itemId VARCHAR(255) NOT NULL,
    itemDetails JSONB, -- Flexible JSON for item details
    quantity INTEGER DEFAULT 1,
    totalAmount DECIMAL(10,2) NOT NULL,
    deliveryAddress TEXT,
    contactInfo JSONB, -- Contact information
    specialInstructions TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivering, delivered, cancelled
    paymentStatus VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rental Properties table
CREATE TABLE IF NOT EXISTS rental_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    propertyId VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    type VARCHAR(100), -- apartment, house, studio, etc.
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(8,2), -- Square meters or feet
    images TEXT[], -- Array of image URLs
    amenities JSONB, -- Array of amenities
    landlordId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contactInfo JSONB, -- Landlord contact information
    availability VARCHAR(50) DEFAULT 'available', -- available, rented, maintenance
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, rented
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rental Inquiries table
CREATE TABLE IF NOT EXISTS rental_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiryId VARCHAR(255) UNIQUE NOT NULL,
    propertyId VARCHAR(255) NOT NULL,
    tenantId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    contactInfo JSONB, -- Tenant contact information
    moveInDate DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, responded, rejected
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notificationId VARCHAR(255) UNIQUE NOT NULL,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- general, order, rental, market, meal
    data JSONB, -- Additional notification data
    read BOOLEAN DEFAULT false,
    readAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_userid ON users(userId);
CREATE INDEX IF NOT EXISTS idx_users_referralcode ON users(referralCode);
CREATE INDEX IF NOT EXISTS idx_users_referredby ON users(referredBy);

CREATE INDEX IF NOT EXISTS idx_meal_posts_userid ON meal_posts(userId);
CREATE INDEX IF NOT EXISTS idx_meal_posts_location ON meal_posts(location);
CREATE INDEX IF NOT EXISTS idx_meal_posts_category ON meal_posts(category);
CREATE INDEX IF NOT EXISTS idx_meal_posts_status ON meal_posts(status);
CREATE INDEX IF NOT EXISTS idx_meal_posts_createdat ON meal_posts(createdAt);

CREATE INDEX IF NOT EXISTS idx_marketplace_userid ON marketplace(userId);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_location ON marketplace(location);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_createdat ON marketplace(createdAt);

CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdat ON orders(createdAt);

CREATE INDEX IF NOT EXISTS idx_rental_properties_landlordid ON rental_properties(landlordId);
CREATE INDEX IF NOT EXISTS idx_rental_properties_type ON rental_properties(type);
CREATE INDEX IF NOT EXISTS idx_rental_properties_status ON rental_properties(status);
CREATE INDEX IF NOT EXISTS idx_rental_properties_availability ON rental_properties(availability);

CREATE INDEX IF NOT EXISTS idx_rental_inquiries_propertyid ON rental_inquiries(propertyId);
CREATE INDEX IF NOT EXISTS idx_rental_inquiries_tenantid ON rental_inquiries(tenantId);
CREATE INDEX IF NOT EXISTS idx_rental_inquiries_status ON rental_inquiries(status);

CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_createdat ON notifications(createdAt);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_posts_updated_at BEFORE UPDATE ON meal_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_updated_at BEFORE UPDATE ON marketplace FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_properties_updated_at BEFORE UPDATE ON rental_properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = userId::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = userId::text);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

-- Meal posts policies
CREATE POLICY "Anyone can view meal posts" ON meal_posts FOR SELECT USING (status = 'available');
CREATE POLICY "Users can manage own meal posts" ON meal_posts FOR ALL USING (auth.uid()::text = userId::text);

-- Marketplace policies
CREATE POLICY "Anyone can view marketplace items" ON marketplace FOR SELECT USING (status = 'available');
CREATE POLICY "Users can manage own marketplace items" ON marketplace FOR ALL USING (auth.uid()::text = userId::text);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid()::text = userId::text);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid()::text = userId::text);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid()::text = userId::text);

-- Rental properties policies
CREATE POLICY "Anyone can view rental properties" ON rental_properties FOR SELECT USING (status = 'active' AND availability = 'available');
CREATE POLICY "Landlords can manage own properties" ON rental_properties FOR ALL USING (auth.uid()::text = landlordId::text);

-- Rental inquiries policies
CREATE POLICY "Landlords can view inquiries for their properties" ON rental_inquiries FOR SELECT USING (
    auth.uid()::text IN (
        SELECT landlordId::text FROM rental_properties WHERE propertyId = rental_inquiries.propertyId
    )
);
CREATE POLICY "Tenants can manage own inquiries" ON rental_inquiries FOR ALL USING (auth.uid()::text = tenantId::text);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = userId::text);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid()::text = userId::text);

-- Create storage bucket for file uploads (use Supabase helper)
-- Note: This requires running in the Supabase SQL Editor or with service role
select storage.create_bucket('uploads', public => true);

-- Recommended storage RLS policies
-- Allow public read for objects in the 'uploads' bucket
CREATE POLICY "Public read for uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow authenticated users to upload to the 'uploads' bucket
CREATE POLICY "Authenticated upload to uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Allow object owners to update their files in 'uploads'
CREATE POLICY "Owners can update uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads' AND owner = auth.uid());

-- Allow object owners to delete their files in 'uploads'
CREATE POLICY "Owners can delete uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND owner = auth.uid());

COMMIT;
