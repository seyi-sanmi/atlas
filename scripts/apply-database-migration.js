#!/usr/bin/env node

/**
 * Apply Database Migration to New 7-Category Structure
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// New 7-category mapping logic
function categorizeEvent(title, description) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Technical Talk / Presentation
  if (content.includes('info session') || content.includes('activator') || 
      content.includes('program overview') || content.includes('technical') ||
      content.includes('research') || content.includes('scientific') ||
      content.includes('innovation') || content.includes('talk') ||
      content.includes('presentation') || content.includes('flash talks') ||
      content.includes('seminar') || content.includes('lecture')) {
    
    // Check for multi-category cases
    if (title.toLowerCase().includes('lunch & learn') || 
        title.toLowerCase().includes('lunch and learn')) {
      return ['Technical Talk / Presentation', 'Social / Mixer'];
    }
    
    if (content.includes('networking') || content.includes('food and networking') || 
        content.includes('drinks') || content.includes('social')) {
      return ['Technical Talk / Presentation', 'Social / Mixer'];
    }
    
    return ['Technical Talk / Presentation'];
  }
  
  // Workshop / Discussion
  if (title.toLowerCase().includes('thinking big science') ||
      content.includes('workshop') || content.includes('discussion') ||
      content.includes('explore how') || content.includes('structured group') ||
      content.includes('group rotations') || content.includes('interactive') ||
      content.includes('brainstorming') || content.includes('hands-on') ||
      content.includes('practical') || content.includes('turning ideas into action') ||
      content.includes('ambitious thinkers') || content.includes('thought experiment')) {
    return ['Workshop / Discussion'];
  }
  
  // Demo / Showcase
  if (title.toLowerCase().includes('demo night') || title.toLowerCase().includes('demo') ||
      title.toLowerCase().includes('showcase') || content.includes('demo') ||
      content.includes('demonstration') || content.includes('showcase') ||
      content.includes('exhibition') || content.includes('technical showcase') ||
      content.includes('frontier ai demos')) {
    
    if (content.includes('networking') || content.includes('food')) {
      return ['Demo / Showcase', 'Technical Talk / Presentation'];
    }
    
    return ['Demo / Showcase'];
  }
  
  // Social / Mixer
  if (title.toLowerCase().includes('mixer') || title.toLowerCase().includes('networking') ||
      title.toLowerCase().includes('drinks') || title.toLowerCase().includes('chill') ||
      content.includes('networking') || content.includes('social') ||
      content.includes('meet other') || content.includes('community') ||
      content.includes('mixer') || content.includes('drinks') ||
      content.includes('get together') || content.includes('mingle') ||
      content.includes('afterwork')) {
    return ['Social / Mixer'];
  }
  
  // Panel Discussion
  if (title.toLowerCase().includes('panel') || content.includes('panel') ||
      content.includes('expert panel') || content.includes('roundtable') ||
      content.includes('panel discussion') || content.includes('moderated discussion') ||
      content.includes('q&a') || content.includes('experts')) {
    return ['Panel Discussion'];
  }
  
  // Research / Academic Conference
  if (title.toLowerCase().includes('conference') && 
      (title.toLowerCase().includes('society') || title.toLowerCase().includes('annual') ||
       title.toLowerCase().includes('academic') || content.includes('annual conference') ||
       content.includes('society conference') || content.includes('academic conference') ||
       content.includes('symposium') || content.includes('formal conference'))) {
    return ['Research / Academic Conference'];
  }
  
  // Competition / Hackathon
  if (title.toLowerCase().includes('hackathon') || title.toLowerCase().includes('hack') ||
      title.toLowerCase().includes('competition') || content.includes('hackathon') ||
      content.includes('competition') || content.includes('contest') ||
      content.includes('challenge') || content.includes('hack') ||
      content.includes('competitive')) {
    
    if (content.includes('talk') || content.includes('presentation') || content.includes('technical')) {
      return ['Competition / Hackathon', 'Technical Talk / Presentation'];
    }
    
    return ['Competition / Hackathon'];
  }
  
  // Default fallback
  return ['Technical Talk / Presentation'];
}

async function migrateEventCategories() {
  try {
    console.log('🚀 Starting migration to new 7-category structure...');
    
    // Step 1: Get all events
    console.log('📊 Fetching all events...');
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, title, description, ai_event_type, ai_event_types');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`✅ Found ${events.length} events to migrate`);
    
    // Step 2: Show current distribution
    const currentTypes = {};
    events.forEach(event => {
      if (event.ai_event_types && event.ai_event_types.length > 0) {
        event.ai_event_types.forEach(type => {
          currentTypes[type] = (currentTypes[type] || 0) + 1;
        });
      } else if (event.ai_event_type) {
        currentTypes[event.ai_event_type] = (currentTypes[event.ai_event_type] || 0) + 1;
      }
    });
    
    console.log('\n📈 Current Category Distribution:');
    Object.entries(currentTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} events`);
    });
    
    // Step 3: Migrate each event
    const migrationResults = {
      success: 0,
      errors: 0,
      newDistribution: {}
    };
    
    console.log('\n🔄 Migrating events...');
    
    for (const event of events) {
      try {
        const newCategories = categorizeEvent(event.title, event.description);
        
        // Track new distribution
        newCategories.forEach(category => {
          migrationResults.newDistribution[category] = (migrationResults.newDistribution[category] || 0) + 1;
        });
        
        // Update the event
        const { error: updateError } = await supabase
          .from('events')
          .update({ ai_event_types: newCategories })
          .eq('id', event.id);
        
        if (updateError) {
          console.error(`❌ Error updating event ${event.id}:`, updateError);
          migrationResults.errors++;
        } else {
          migrationResults.success++;
          console.log(`✅ "${event.title}" → [${newCategories.join(', ')}]`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error);
        migrationResults.errors++;
      }
    }
    
    // Step 4: Show results
    console.log('\n📊 MIGRATION RESULTS:');
    console.log('====================');
    console.log(`✅ Successfully migrated: ${migrationResults.success} events`);
    console.log(`❌ Errors: ${migrationResults.errors} events`);
    
    console.log('\n📈 New Category Distribution:');
    Object.entries(migrationResults.newDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} events`);
      });
    
    // Step 5: Verify migration
    console.log('\n🔍 Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('events')
      .select('id, title, ai_event_types')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Sample migrated events:');
      verifyData.forEach(event => {
        console.log(`  "${event.title}" → [${event.ai_event_types?.join(', ')}]`);
      });
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('  1. Test the filters on the events page');
    console.log('  2. Verify the admin panel shows new categories');
    console.log('  3. Check that multi-category events display correctly');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateEventCategories();
}

module.exports = { migrateEventCategories, categorizeEvent };
