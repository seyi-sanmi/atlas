#!/usr/bin/env node

/**
 * Event Data Analysis Script
 * 
 * This script analyzes all events in the database to:
 * 1. Extract all event URLs and check what data is already stored
 * 2. Scrape missing event descriptions from live URLs
 * 3. Analyze content patterns to suggest better event categories
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllEvents() {
  console.log('🔍 Fetching all events from database...');
  
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      url,
      platform,
      ai_event_type,
      ai_event_types,
      categories,
      organizer,
      date,
      location,
      city
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  console.log(`✅ Found ${events?.length || 0} events in database`);
  return events || [];
}

async function analyzeEventData() {
  try {
    // Step 1: Get all events from database
    const events = await getAllEvents();
    
    if (events.length === 0) {
      console.log('❌ No events found in database');
      return;
    }

    // Step 2: Analyze what data we have vs what we need to scrape
    const analysis = {
      totalEvents: events.length,
      eventsWithDescriptions: 0,
      eventsWithUrls: 0,
      platformBreakdown: {},
      currentEventTypes: {},
      eventsNeedingScraping: []
    };

    events.forEach(event => {
      // Count platforms
      if (event.platform) {
        analysis.platformBreakdown[event.platform] = (analysis.platformBreakdown[event.platform] || 0) + 1;
      }

      // Count current event types
      if (event.ai_event_types && event.ai_event_types.length > 0) {
        event.ai_event_types.forEach(type => {
          analysis.currentEventTypes[type] = (analysis.currentEventTypes[type] || 0) + 1;
        });
      } else if (event.ai_event_type) {
        analysis.currentEventTypes[event.ai_event_type] = (analysis.currentEventTypes[event.ai_event_type] || 0) + 1;
      }

      // Check if we need to scrape more data
      if (event.url) {
        analysis.eventsWithUrls++;
      }

      if (event.description && event.description.trim().length > 50) {
        analysis.eventsWithDescriptions++;
      } else if (event.url) {
        // Event has URL but no/insufficient description - needs scraping
        analysis.eventsNeedingScraping.push(event);
      }
    });

    // Step 3: Generate analysis report
    const report = {
      timestamp: new Date().toISOString(),
      summary: analysis,
      eventsNeedingScraping: analysis.eventsNeedingScraping.map(e => ({
        id: e.id,
        title: e.title,
        url: e.url,
        platform: e.platform,
        currentDescription: e.description?.substring(0, 100) + '...' || 'No description'
      })),
      sampleEvents: events.slice(0, 5).map(e => ({
        id: e.id,
        title: e.title,
        description: e.description?.substring(0, 200) + '...' || 'No description',
        url: e.url,
        platform: e.platform,
        ai_event_types: e.ai_event_types,
        categories: e.categories
      }))
    };

    // Save analysis to file
    const outputPath = path.join(__dirname, '../event-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log('\n📊 ANALYSIS RESULTS:');
    console.log('==================');
    console.log(`Total Events: ${analysis.totalEvents}`);
    console.log(`Events with descriptions: ${analysis.eventsWithDescriptions}`);
    console.log(`Events with URLs: ${analysis.eventsWithUrls}`);
    console.log(`Events needing scraping: ${analysis.eventsNeedingScraping.length}`);
    
    console.log('\n📈 Platform Breakdown:');
    Object.entries(analysis.platformBreakdown).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count}`);
    });

    console.log('\n🏷️  Current Event Types:');
    Object.entries(analysis.currentEventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log(`\n💾 Full analysis saved to: ${outputPath}`);

    // Step 4: Show next steps
    if (analysis.eventsNeedingScraping.length > 0) {
      console.log(`\n🔄 NEXT STEPS:`);
      console.log(`1. Scrape descriptions for ${analysis.eventsNeedingScraping.length} events`);
      console.log(`2. Analyze all descriptions to identify patterns`);
      console.log(`3. Propose new event categories based on content analysis`);
    } else {
      console.log(`\n✅ All events have descriptions - ready for content analysis!`);
    }

    return report;

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeEventData();
}

module.exports = { analyzeEventData, getAllEvents };

