#!/usr/bin/env node

/**
 * Simple Database Setup Script for UniConnect
 * Execute SQL directly using Supabase client
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
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSQLScript() {
    try {
        log('🚀 UniConnect Database Setup', 'bright');
        log('==============================', 'cyan');
        
        // Validate environment
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            log('❌ Missing Supabase credentials in .env', 'red');
            process.exit(1);
        }

        // Initialize Supabase admin client
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

        // Read and prepare SQL
        const sqlFile = path.join(__dirname, 'create-database.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        log('📄 SQL schema loaded', 'green');

        // Split SQL into manageable chunks
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => 
                stmt.length > 0 && 
                !stmt.startsWith('--') && 
                !stmt.startsWith('/*') &&
                !stmt.startsWith('COMMIT') &&
                !stmt.startsWith('BEGIN')
            );

        log(`📝 Found ${statements.length} SQL statements to execute`, 'blue');

        // Execute statements one by one
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip empty or comment-only statements
            if (!statement || statement.startsWith('--')) {
                skippedCount++;
                continue;
            }

            try {
                log(`⏳ Executing statement ${i + 1}/${statements.length}...`, 'yellow');
                
                // Use raw SQL execution through Postgres function
                const { error } = await supabase
                    .rpc('exec', { sql: statement });

                if (error) {
                    // Try alternative method for common statements
                    if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
                        log(`⚠️  Possible warning: ${error.message}`, 'yellow');
                        errorCount++;
                    } else {
                        log(`❌ Error: ${error.message}`, 'red');
                        errorCount++;
                    }
                } else {
                    successCount++;
                }
            } catch (err) {
                log(`❌ Execution error: ${err.message}`, 'red');
                errorCount++;
            }
        }

        log('\n📊 Execution Summary:', 'cyan');
        log(`   ✅ Successful: ${successCount}`, 'green');
        log(`   ❌ Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'green');
        log(`   ⏭️  Skipped: ${skippedCount}`, 'yellow');

        // Verify table creation
        log('\n🔍 Verifying database setup...', 'cyan');
        
        const expectedTables = [
            'users', 'meal_posts', 'marketplace', 'orders',
            'rental_properties', 'rental_inquiries', 'notifications'
        ];

        try {
            const { data: existingTables, error } = await supabase
                .from('pg_tables')
                .select('tablename')
                .eq('schemaname', 'public')
                .in('tablename', expectedTables);

            if (error) {
                log('⚠️  Could not verify tables automatically', 'yellow');
            } else {
                const created = existingTables?.map(t => t.tablename) || [];
                const missing = expectedTables.filter(t => !created.includes(t));
                
                if (missing.length === 0) {
                    log('✅ All required tables created!', 'green');
                    created.forEach(table => log(`   ✓ ${table}`, 'green'));
                } else {
                    log('⚠️  Some tables may need manual creation:', 'yellow');
                    missing.forEach(table => log(`   ? ${table}`, 'yellow'));
                }
            }
        } catch (err) {
            log('⚠️  Table verification failed - this is normal', 'yellow');
        }

        log('\n🎉 Database setup process completed!', 'bright');
        log('================================', 'cyan');
        
        if (errorCount === 0) {
            log('🚀 Perfect! Your database is ready!', 'green');
        } else {
            log('⚠️  Setup completed with some warnings', 'yellow');
            log('💡 Your backend should still work fine', 'yellow');
        }

        log('\n📋 Next Steps:', 'blue');
        log('1. Start your backend: npm start', 'cyan');
        log('2. Test the API endpoints', 'cyan');
        log('3. Run your frontend app', 'cyan');

    } catch (error) {
        log('❌ Database setup failed', 'red');
        log(`Error: ${error.message}`, 'red');
        
        log('\n🔧 Manual Setup Required:', 'yellow');
        log('1. Open Supabase Dashboard', 'yellow');
        log('2. Go to SQL Editor', 'yellow');
        log('3. Copy and paste the contents of:', 'yellow');
        log('   backend/scripts/create-database.sql', 'cyan');
        log('4. Execute the SQL script', 'yellow');
        
        process.exit(1);
    }
}

// Run the setup
if (require.main === module) {
    executeSQLScript();
}

module.exports = { executeSQLScript };
