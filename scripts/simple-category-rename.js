#!/usr/bin/env node

/**
 * Simple Category Rename - Update existing ai_event_type values
 * No new columns, just rename the categories to the new 7-category structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple category mapping from old to new
const categoryMapping = {
  'Workshop': 'Workshop / Discussion',
  'Conference': 'Technical Talk / Presentation', 
  'Meetup / Mixer': 'Social / Mixer',
  'Panel Discussion': 'Panel Discussion', // Keep as is
  'Hackathon': 'Competition / Hackathon',
  'Other': 'Technical Talk / Presentation', // Default fallback
  'Lecture': 'Technical Talk / Presentation',
  'Fireside Chat': 'Panel Discussion',
  'Webinar': 'Technical Talk / Presentation'
};

async function simpleCategoryRename() {
  try {
    console.log('🔄 Simple Category Rename - Updating existing ai_event_type values...');
    
    // Step 1: Check current state
    const { data: currentEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, title, ai_event_type, ai_event_types')
      .order('title');
    
    if (fetchError) throw fetchError;
    
    console.log(`📊 Found ${currentEvents.length} events`);
    
    // Show current distribution
    const currentDistribution = {};
    currentEvents.forEach(event => {
      const currentType = event.ai_event_type || 'No Category';
      currentDistribution[currentType] = (currentDistribution[currentType] || 0) + 1;
    });
    
    console.log('\n📈 Current Categories:');
    Object.entries(currentDistribution).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} events`);
    });
    
    // Step 2: Update categories
    console.log('\n🔄 Updating categories...');
    let updatedCount = 0;
    
    for (const [oldCategory, newCategory] of Object.entries(categoryMapping)) {
      const { data, error } = await supabase
        .from('events')
        .update({ ai_event_type: newCategory })
        .eq('ai_event_type', oldCategory)
        .select('title');
      
      if (error) {
        console.error(`❌ Error updating ${oldCategory}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ ${oldCategory} → ${newCategory} (${data.length} events)`);
        updatedCount += data.length;
      }
    }
    
    // Step 3: Handle special cases for content-based categorization
    console.log('\n🎯 Handling special cases...');
    
    // Lunch & Learn events should be Social / Mixer
    const { data: lunchLearnEvents, error: lunchError } = await supabase
      .from('events')
      .update({ ai_event_type: 'Social / Mixer' })
      .ilike('title', '%lunch%learn%')
      .select('title');
    
    if (!lunchError && lunchLearnEvents?.length > 0) {
      console.log(`✅ Lunch & Learn → Social / Mixer (${lunchLearnEvents.length} events)`);
      updatedCount += lunchLearnEvents.length;
    }
    
    // Thinking Big Science should be Workshop / Discussion
    const { data: thinkingBigEvents, error: thinkingError } = await supabase
      .from('events')
      .update({ ai_event_type: 'Workshop / Discussion' })
      .ilike('title', '%thinking big science%')
      .select('title');
    
    if (!thinkingError && thinkingBigEvents?.length > 0) {
      console.log(`✅ Thinking Big Science → Workshop / Discussion (${thinkingBigEvents.length} events)`);
      updatedCount += thinkingBigEvents.length;
    }
    
    // Demo Night events should be Demo / Showcase
    const { data: demoEvents, error: demoError } = await supabase
      .from('events')
      .update({ ai_event_type: 'Demo / Showcase' })
      .ilike('title', '%demo%night%')
      .select('title');
    
    if (!demoError && demoEvents?.length > 0) {
      console.log(`✅ Demo Night → Demo / Showcase (${demoEvents.length} events)`);
      updatedCount += demoEvents.length;
    }
    
    // Academic conferences should stay as Research / Academic Conference
    const { data: academicEvents, error: academicError } = await supabase
      .from('events')
      .update({ ai_event_type: 'Research / Academic Conference' })
      .or('title.ilike.%society%conference%,title.ilike.%annual%conference%,title.ilike.%academic%conference%')
      .select('title');
    
    if (!academicError && academicEvents?.length > 0) {
      console.log(`✅ Academic Conferences → Research / Academic Conference (${academicEvents.length} events)`);
      updatedCount += academicEvents.length;
    }
    
    // Step 4: Verify results
    console.log('\n🔍 Verifying results...');
    const { data: finalEvents, error: finalError } = await supabase
      .from('events')
      .select('ai_event_type')
      .order('ai_event_type');
    
    if (finalError) throw finalError;
    
    const finalDistribution = {};
    finalEvents.forEach(event => {
      const type = event.ai_event_type || 'No Category';
      finalDistribution[type] = (finalDistribution[type] || 0) + 1;
    });
    
    console.log('\n📈 Final Categories:');
    Object.entries(finalDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} events`);
      });
    
    console.log(`\n✅ Successfully updated ${updatedCount} events`);
    console.log('🎉 Category rename completed!');
    console.log('\n📋 No database schema changes needed - just updated existing values');
    
  } catch (error) {
    console.error('❌ Category rename failed:', error);
  }
}

if (require.main === module) {
  simpleCategoryRename();
}

module.exports = { simpleCategoryRename, categoryMapping };
