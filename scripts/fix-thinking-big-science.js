#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixThinkingBigScience() {
  try {
    console.log('🔧 Fixing "Thinking Big Science" categorization...');
    
    const { data, error } = await supabase
      .from('events')
      .update({ ai_event_types: ['Workshop / Discussion', 'Technical Talk / Presentation'] })
      .eq('title', 'Thinking Big Science')
      .select();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Updated "Thinking Big Science" to: [Workshop / Discussion, Technical Talk / Presentation]');
    } else {
      console.log('❌ Event not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixThinkingBigScience();
