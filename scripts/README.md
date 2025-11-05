# Database Setup Scripts

This directory contains automated scripts to set up your UniConnect database in Supabase.

## 🚀 Quick Setup

### Option 1: Automated Script (Recommended)
```bash
cd backend
npm run db:setup
```

### Option 2: Manual SQL Execution
```bash
cd backend
npm run db:sql
```
Then copy the SQL from `scripts/create-database.sql` and run it in your Supabase SQL Editor.

## 📁 Files Overview

### `create-database.sql`
- Complete database schema for UniConnect
- Creates all required tables, indexes, and policies
- Includes Row Level Security (RLS) policies
- Sets up storage bucket for file uploads

### `simple-setup.js`
- Automated script that executes the SQL
- User-friendly console output with colors
- Error handling and troubleshooting tips
- Table verification after setup

### `setup-database.js`
- Advanced setup script with more features
- Detailed logging and error reporting
- Storage bucket verification
- Performance monitoring setup

## 🗄️ Database Schema

### Tables Created:
- **users** - User accounts and profiles
- **meal_posts** - Meal listings and posts
- **marketplace** - Product listings
- **orders** - Order management
- **rental_properties** - Rental property listings
- **rental_inquiries** - Rental inquiry management
- **notifications** - Notification system

### Features:
- ✅ UUID primary keys for security
- ✅ Proper foreign key relationships
- ✅ Indexes for performance optimization
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp triggers
- ✅ Storage bucket for file uploads

## 🔧 Environment Setup

Make sure your `.env` file contains:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚨 Troubleshooting

### Script Fails to Connect
1. Verify your Supabase URL is correct
2. Check your service role key
3. Ensure your Supabase project is active
4. Check internet connection

### Tables Not Created
1. Run the SQL manually in Supabase Dashboard
2. Check for SQL syntax errors
3. Verify you have admin permissions

### Permission Errors
1. Use the SERVICE_ROLE_KEY (not anon key)
2. Ensure you have project owner permissions
3. Check Supabase dashboard for any restrictions

## 📋 Verification

After running the setup, you can verify:

1. **Check Tables**: Go to Supabase Dashboard → Table Editor
2. **Test API**: Start the backend and test endpoints
3. **Storage**: Verify the 'uploads' bucket exists

## 🎯 Next Steps

1. Run the setup script: `npm run db:setup`
2. Start the backend: `npm start`
3. Test the authentication endpoints
4. Upload a test file to verify storage

## 💡 Tips

- The script creates indexes for better performance
- RLS policies ensure users can only access their own data
- Storage bucket is configured for public file uploads
- All tables have automatic `updated_at` timestamps

## 🆘 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Try manual SQL execution as fallback
3. Verify your Supabase project settings
4. Ensure all environment variables are set correctly
