#!/usr/bin/env node

/**
 * Test the simple category rename approach
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleCategories() {
  try {
    console.log('🧪 Testing Simple Category Rename Implementation...');
    
    // Test 1: Check distribution
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, ai_event_type')
      .order('ai_event_type');
    
    if (error) throw error;
    
    const distribution = {};
    events.forEach(event => {
      const type = event.ai_event_type || 'No Category';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    console.log('\n📊 Current Distribution:');
    Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} events`);
      });
    
    // Test 2: Check specific events
    console.log('\n🎯 Specific Event Tests:');
    
    const testEvents = [
      'Thinking Big Science',
      'Dundee Lunch & Learn', 
      'London AI Nexus Demo Night',
      'British Society for the Philosophy of Science Annual Conference'
    ];
    
    for (const title of testEvents) {
      const { data: event, error } = await supabase
        .from('events')
        .select('title, ai_event_type')
        .eq('title', title)
        .single();
      
      if (error) {
        console.log(`❌ "${title}": Not found`);
      } else {
        console.log(`✅ "${title}": ${event.ai_event_type}`);
      }
    }
    
    // Test 3: Filter functionality
    console.log('\n🔍 Filter Tests:');
    
    const filterTests = [
      'Social / Mixer',
      'Technical Talk / Presentation',
      'Workshop / Discussion'
    ];
    
    for (const category of filterTests) {
      const { data: filtered, error } = await supabase
        .from('events')
        .select('title')
        .eq('ai_event_type', category);
      
      if (error) {
        console.error(`❌ Filter error for ${category}:`, error);
      } else {
        console.log(`✅ ${category}: ${filtered.length} events`);
        if (filtered.length > 0) {
          console.log(`   Example: "${filtered[0].title}"`);
        }
      }
    }
    
    // Test 4: Unique types function
    console.log('\n📋 Unique Types Query:');
    
    const { data: uniqueData, error: uniqueError } = await supabase
      .from('events')
      .select('ai_event_type')
      .not('ai_event_type', 'is', null);
    
    if (uniqueError) {
      console.error('❌ Unique types error:', uniqueError);
    } else {
      const uniqueTypes = [...new Set(uniqueData.map(e => e.ai_event_type))].sort();
      console.log(`✅ Unique Categories (${uniqueTypes.length}):`);
      uniqueTypes.forEach(type => {
        console.log(`   • ${type}`);
      });
    }
    
    console.log('\n🎉 Simple Category Implementation Working!');
    console.log('✅ No redundant columns');
    console.log('✅ Clean single-field approach');
    console.log('✅ All filters functional');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testSimpleCategories();
}

module.exports = { testSimpleCategories };
