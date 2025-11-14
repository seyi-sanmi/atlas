#!/usr/bin/env tsx

/**
 * Migration Script: Categorize All Existing Events
 * 
 * This script fetches all events that haven't been AI categorized yet
 * and runs them through the AI categorization system.
 * 
 * Usage: npm run categorize-events
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file first
config({ path: join(process.cwd(), '.env.local') });

// Create Supabase client directly with loaded environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Import categorization function
import { categorizeEventWithRetry } from '../src/lib/event-categorizer';

interface Event {
  id: string;
  title: string;
  description: string;
  ai_categorized?: boolean;
  ai_event_type?: string;
  ai_interest_areas?: string[];
}

async function categorizeExistingEvents() {
  console.log('🚀 Starting AI categorization of existing events...\n');

  try {
    // Fetch all events that haven't been AI categorized
    console.log('📊 Fetching events that need categorization...');
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, title, description, ai_categorized, ai_event_type, ai_interest_areas')
      .or('ai_categorized.is.null,ai_categorized.eq.false');

    if (fetchError) {
      console.error('❌ Error fetching events:', fetchError);
      return;
    }

    if (!events || events.length === 0) {
      console.log('✅ All events are already categorized! No work needed.');
      return;
    }

    console.log(`📝 Found ${events.length} events to categorize:\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const progress = `[${i + 1}/${events.length}]`;
      
      console.log(`${progress} Processing: "${event.title?.substring(0, 50)}..."`);

      try {
        // Skip if already has AI categorization
        if (event.ai_categorized && event.ai_event_type) {
          console.log(`   ⏭️  Already categorized as "${event.ai_event_type}" - skipping`);
          continue;
        }

        // Run AI categorization
        const aiResult = await categorizeEventWithRetry({
          title: event.title || '',
          description: event.description || ''
        });

        // Update the event in database
        const { error: updateError } = await supabase
          .from('events')
          .update({
            ai_event_type: aiResult.event_type,
            ai_interest_areas: aiResult.event_interest_areas,
            ai_categorized: true,
            ai_categorized_at: new Date().toISOString()
          })
          .eq('id', event.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`   ✅ Categorized as "${aiResult.event_type}" with ${aiResult.event_interest_areas.length} interest areas`);
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Failed: ${error}`);
        errors.push(`${event.title}: ${error}`);
        errorCount++;
      }

      // Add a blank line every 5 events for readability
      if ((i + 1) % 5 === 0) {
        console.log('');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CATEGORIZATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully categorized: ${successCount} events`);
    console.log(`❌ Failed to categorize: ${errorCount} events`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n🎉 Migration complete! All events are now AI categorized.');

  } catch (error) {
    console.error('💥 Fatal error during categorization:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  categorizeExistingEvents()
    .then(() => {
      console.log('\n👋 Script finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { categorizeExistingEvents }; 