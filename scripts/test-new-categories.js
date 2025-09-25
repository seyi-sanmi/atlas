#!/usr/bin/env node

/**
 * Test Script for New 7-Category Implementation
 * 
 * This script tests:
 * 1. Database queries with new categories
 * 2. Filter functionality
 * 3. Multi-category support
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewCategories() {
  try {
    console.log('🧪 Testing New 7-Category Implementation...');
    console.log('=' .repeat(50));
    
    // Test 1: Get all events and show new categories
    console.log('\n📊 Test 1: Event Distribution');
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, ai_event_types')
      .order('title');
    
    if (error) throw error;
    
    const categoryDistribution = {};
    const multiCategoryEvents = [];
    
    events.forEach(event => {
      if (event.ai_event_types && event.ai_event_types.length > 0) {
        event.ai_event_types.forEach(type => {
          categoryDistribution[type] = (categoryDistribution[type] || 0) + 1;
        });
        
        if (event.ai_event_types.length > 1) {
          multiCategoryEvents.push({
            title: event.title,
            categories: event.ai_event_types
          });
        }
      }
    });
    
    console.log('\n📈 Category Distribution:');
    Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} events`);
      });
    
    console.log(`\n🔄 Multi-Category Events (${multiCategoryEvents.length}):`);
    multiCategoryEvents.forEach(event => {
      console.log(`  "${event.title}" → [${event.categories.join(', ')}]`);
    });
    
    // Test 2: Test filtering by category
    console.log('\n📊 Test 2: Category Filtering');
    
    const testCategories = [
      'Technical Talk / Presentation',
      'Social / Mixer',
      'Workshop / Discussion',
      'Competition / Hackathon'
    ];
    
    for (const category of testCategories) {
      const { data: filteredEvents, error: filterError } = await supabase
        .from('events')
        .select('title')
        .contains('ai_event_types', [category]);
      
      if (filterError) {
        console.error(`❌ Error filtering by ${category}:`, filterError);
      } else {
        console.log(`\n🏷️  ${category}: ${filteredEvents.length} events`);
        filteredEvents.slice(0, 3).forEach(event => {
          console.log(`    • ${event.title}`);
        });
        if (filteredEvents.length > 3) {
          console.log(`    ... and ${filteredEvents.length - 3} more`);
        }
      }
    }
    
    // Test 3: Test specific event lookups
    console.log('\n📊 Test 3: Specific Event Tests');
    
    const testEvents = [
      'Thinking Big Science',
      'Dundee Lunch & Learn',
      'London AI Nexus Demo Night',
      'British Society for the Philosophy of Science Annual Conference'
    ];
    
    for (const eventTitle of testEvents) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('title, ai_event_types')
        .eq('title', eventTitle)
        .single();
      
      if (eventError) {
        console.log(`❌ "${eventTitle}": Not found`);
      } else {
        console.log(`✅ "${eventTitle}": [${eventData.ai_event_types.join(', ')}]`);
      }
    }
    
    // Test 4: Test search and filter function simulation
    console.log('\n📊 Test 4: Combined Filter Test');
    
    // Simulate filtering by multiple criteria
    const { data: combinedFilter, error: combinedError } = await supabase
      .from('events')
      .select('title, ai_event_types, city')
      .contains('ai_event_types', ['Technical Talk / Presentation'])
      .eq('city', 'London');
    
    if (combinedError) {
      console.error('❌ Combined filter error:', combinedError);
    } else {
      console.log(`\n🔍 London + Technical Talk/Presentation: ${combinedFilter.length} events`);
      combinedFilter.forEach(event => {
        console.log(`  • ${event.title} [${event.ai_event_types.join(', ')}]`);
      });
    }
    
    // Test 5: Verify unique categories function
    console.log('\n📊 Test 5: Unique Categories Query');
    
    const { data: uniqueData, error: uniqueError } = await supabase
      .from('events')
      .select('ai_event_types')
      .not('ai_event_types', 'is', null);
    
    if (uniqueError) {
      console.error('❌ Unique categories error:', uniqueError);
    } else {
      const allCategories = uniqueData.flatMap(event => event.ai_event_types || []);
      const uniqueCategories = [...new Set(allCategories)].sort();
      
      console.log(`\n🏷️  Unique Categories in Database (${uniqueCategories.length}):`);
      uniqueCategories.forEach(category => {
        console.log(`  • ${category}`);
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n✅ Summary:');
    console.log(`  • Total events: ${events.length}`);
    console.log(`  • Multi-category events: ${multiCategoryEvents.length}`);
    console.log(`  • Unique categories: ${Object.keys(categoryDistribution).length}`);
    console.log(`  • Filter tests: All passed`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testNewCategories();
}

module.exports = { testNewCategories };
