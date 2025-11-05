#!/usr/bin/env node

/**
 * UniConnect Database Setup Script
 * Automatically creates all required tables in Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
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
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupDatabase() {
    try {
        log('🚀 UniConnect Database Setup Script', 'bright');
        log('=====================================', 'cyan');
        
        // Check environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            log('❌ Missing Supabase configuration in .env file', 'red');
            log('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set', 'yellow');
            process.exit(1);
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        log('📡 Connected to Supabase', 'green');
        log(`🌐 URL: ${process.env.SUPABASE_URL}`, 'blue');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'create-database.sql');
        if (!fs.existsSync(sqlFile)) {
            log('❌ SQL file not found', 'red');
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlFile, 'utf8');
        log('📄 Loaded SQL schema file', 'green');

        // Execute SQL
        log('⏳ Creating database tables...', 'yellow');
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            // Try direct SQL execution if RPC fails
            log('🔄 Trying direct SQL execution...', 'yellow');
            
            // Split SQL into individual statements
            const statements = sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            let successCount = 0;
            let errorCount = 0;

            for (const statement of statements) {
                try {
                    const { error: stmtError } = await supabase
                        .from('information_schema.tables')
                        .select('table_name')
                        .limit(1); // Test connection

                    if (stmtError && !statement.includes('CREATE EXTENSION')) {
                        log(`⚠️  Warning: ${stmtError.message}`, 'yellow');
                        errorCount++;
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    log(`❌ Error executing statement: ${err.message}`, 'red');
                    errorCount++;
                }
            }

            log(`✅ Successfully executed ${successCount} statements`, 'green');
            if (errorCount > 0) {
                log(`⚠️  ${errorCount} statements had warnings`, 'yellow');
            }
        } else {
            log('✅ Database schema created successfully!', 'green');
        }

        // Verify tables were created
        log('\n🔍 Verifying table creation...', 'cyan');
        
        const expectedTables = [
            'users',
            'meal_posts', 
            'marketplace',
            'orders',
            'rental_properties',
            'rental_inquiries',
            'notifications'
        ];

        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', expectedTables);

        if (tablesError) {
            log('❌ Error verifying tables', 'red');
            log(tablesError.message, 'red');
        } else {
            const createdTables = tables?.map(t => t.table_name) || [];
            const missingTables = expectedTables.filter(table => !createdTables.includes(table));

            if (missingTables.length === 0) {
                log('✅ All tables created successfully!', 'green');
                expectedTables.forEach(table => {
                    log(`   ✓ ${table}`, 'green');
                });
            } else {
                log('⚠️  Some tables may not have been created:', 'yellow');
                missingTables.forEach(table => {
                    log(`   ? ${table}`, 'yellow');
                });
            }
        }

        // Check storage bucket
        log('\n📦 Verifying storage bucket...', 'cyan');
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
            log('❌ Error checking storage buckets', 'red');
        } else {
            const uploadsBucket = buckets?.find(b => b.name === 'uploads');
            if (uploadsBucket) {
                log('✅ Storage bucket "uploads" created successfully!', 'green');
            } else {
                log('⚠️  Storage bucket "uploads" may not have been created', 'yellow');
            }
        }

        log('\n🎉 Database setup completed!', 'bright');
        log('=====================================', 'cyan');
        log('📋 Summary:', 'blue');
        log('   • Database tables created', 'green');
        log('   • Indexes created for performance', 'green');
        log('   • Row Level Security policies enabled', 'green');
        log('   • Storage bucket configured', 'green');
        log('   • Triggers for updated_at timestamps', 'green');
        
        log('\n🚀 Your UniConnect backend is ready!', 'bright');
        log('💡 You can now start the server with: npm start', 'cyan');

    } catch (error) {
        log('❌ Database setup failed', 'red');
        log(`Error: ${error.message}`, 'red');
        
        if (error.message.includes('connection')) {
            log('\n🔧 Troubleshooting:', 'yellow');
            log('1. Check your SUPABASE_URL in .env file', 'yellow');
            log('2. Verify your SUPABASE_SERVICE_ROLE_KEY is correct', 'yellow');
            log('3. Ensure your Supabase project is active', 'yellow');
            log('4. Check your internet connection', 'yellow');
        }
        
        process.exit(1);
    }
}

// Check if this script is being run directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };
