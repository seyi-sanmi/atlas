#!/usr/bin/env node

/**
 * Cleanup Database - Remove the ai_event_types column we mistakenly added
 * and revert to just using the existing ai_event_type field
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
  try {
    console.log('🧹 Cleaning up database - removing redundant ai_event_types column...');
    
    // First, let's see what we have
    const { data: sampleEvent, error: sampleError } = await supabase
      .from('events')
      .select('ai_event_type, ai_event_types')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.log('❌ Error checking database:', sampleError);
      return;
    }
    
    console.log('📊 Current state:', {
      ai_event_type: sampleEvent.ai_event_type,
      ai_event_types: sampleEvent.ai_event_types
    });
    
    // If ai_event_types exists, we need to clean it up
    if (sampleEvent.ai_event_types !== undefined) {
      console.log('🔄 Found ai_event_types column - will use SQL to remove it');
      console.log('💡 Run this SQL in your Supabase dashboard:');
      console.log('');
      console.log('-- Remove the ai_event_types column');
      console.log('ALTER TABLE events DROP COLUMN IF EXISTS ai_event_types;');
      console.log('');
      console.log('-- Remove any constraints related to ai_event_types');
      console.log('ALTER TABLE events DROP CONSTRAINT IF EXISTS check_max_event_types;');
      console.log('');
      console.log('-- Remove any indexes related to ai_event_types');
      console.log('DROP INDEX IF EXISTS idx_events_ai_event_types;');
      console.log('');
    } else {
      console.log('✅ No ai_event_types column found - database is already clean');
    }
    
    console.log('📋 After running the SQL, we\'ll use the simple category rename approach');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

if (require.main === module) {
  cleanupDatabase();
}

module.exports = { cleanupDatabase };
