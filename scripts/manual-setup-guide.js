#!/usr/bin/env node

/**
 * Manual Database Setup Guide
 * Provides step-by-step instructions for setting up Supabase
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function showManualSetup() {
    log('🚀 UniConnect Database Setup Guide', 'bright');
    log('=====================================', 'cyan');
    
    log('\n📋 Step 1: Open Supabase Dashboard', 'blue');
    log('   • Go to: https://app.supabase.com', 'yellow');
    log('   • Select your project', 'yellow');
    
    log('\n📋 Step 2: Open SQL Editor', 'blue');
    log('   • Click on "SQL Editor" in the sidebar', 'yellow');
    log('   • Click "New query"', 'yellow');
    
    log('\n📋 Step 3: Copy the SQL Script', 'blue');
    log('   • The SQL is located at:', 'yellow');
    log(`     ${path.join(__dirname, 'create-database.sql')}`, 'cyan');
    log('   • Open the file and copy all contents', 'yellow');
    
    log('\n📋 Step 4: Execute the SQL', 'blue');
    log('   • Paste the SQL into the editor', 'yellow');
    log('   • Click "Run" to execute', 'yellow');
    log('   • Wait for completion (should take 10-30 seconds)', 'yellow');
    
    log('\n✅ What the script creates:', 'green');
    log('   • 7 database tables (users, meal_posts, marketplace, etc.)', 'green');
    log('   • Performance indexes', 'green');
    log('   • Row Level Security policies', 'green');
    log('   • Storage bucket for uploads', 'green');
    log('   • Automatic timestamp triggers', 'green');
    
    log('\n🔍 Step 5: Verify Setup', 'blue');
    log('   • Go to "Table Editor" in Supabase', 'yellow');
    log('   • You should see these tables:', 'yellow');
    const tables = ['users', 'meal_posts', 'marketplace', 'orders', 'rental_properties', 'rental_inquiries', 'notifications'];
    tables.forEach(table => log(`     ✓ ${table}`, 'green'));
    
    log('\n📦 Step 6: Check Storage', 'blue');
    log('   • Go to "Storage" in sidebar', 'yellow');
    log('   • You should see an "uploads" bucket', 'yellow');
    
    log('\n🚀 Step 7: Start Your Backend', 'blue');
    log('   • Run: npm start', 'yellow');
    log('   • Your backend is now ready!', 'green');
    
    log('\n🎯 Quick Copy Commands:', 'magenta');
    log('   # Windows (PowerShell):', 'cyan');
    log(`   Get-Content "${path.join(__dirname, 'create-database.sql')}" | clip`, 'yellow');
    log('   # Windows (CMD):', 'cyan');
    log(`   type "${path.join(__dirname, 'create-database.sql')}" | clip`, 'yellow');
    log('   # macOS/Linux:', 'cyan');
    log(`   cat "${path.join(__dirname, 'create-database.sql')}" | pbcopy`, 'yellow');
    
    log('\n⚠️  Troubleshooting:', 'yellow');
    log('   • If you get permission errors, ensure you\'re using the SERVICE_ROLE_KEY', 'red');
    log('   • If tables already exist, the script will skip them', 'yellow');
    log('   • Check your Supabase project is active and not paused', 'yellow');
    
    log('\n📞 Need Help?', 'cyan');
    log('   • Check the SQL file for comments explaining each table', 'yellow');
    log('   • Review Supabase documentation for any errors', 'yellow');
    log('   • Your backend code is ready to work with these tables', 'green');
    
    log('\n🎉 Database Setup Guide Complete!', 'bright');
    log('=====================================', 'cyan');
}

// Show the guide
if (require.main === module) {
    showManualSetup();
}

module.exports = { showManualSetup };
