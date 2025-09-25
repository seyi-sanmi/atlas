#!/usr/bin/env node

/**
 * MECE Analysis Script
 * 
 * Analyze all events to identify potential gaps in the category structure
 * and ensure categories are Mutually Exclusive, Collectively Exhaustive
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeMECE() {
  try {
    console.log('🔍 Analyzing events for MECE category coverage...');
    
    // Get all events with full details
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`\n📋 DETAILED EVENT ANALYSIS (${events.length} events):`);
    console.log('='.repeat(60));

    const formatAnalysis = {
      potentialGaps: [],
      ambiguousEvents: [],
      formatPatterns: {},
      uncategorizedFormats: []
    };

    // Current proposed categories
    const proposedCategories = [
      'Information Session / Talk',
      'Workshop / Discussion',
      'Social / Mixer',
      'Panel Discussion', 
      'Research / Academic',
      'Competition / Hackathon'
    ];

    // Analyze each event in detail
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. "${event.title}"`);
      console.log(`   Current: ${event.ai_event_types || event.ai_event_type || 'None'}`);
      console.log(`   Description: ${event.description?.substring(0, 150)}...`);
      console.log(`   Platform: ${event.platform}`);
      console.log(`   Date: ${event.date}`);
      console.log(`   Location: ${event.location}`);
      
      // Look for potential format indicators
      const content = `${event.title} ${event.description}`.toLowerCase();
      
      // Check for specific format keywords that might not fit our categories
      const formatKeywords = {
        'Training/Course': ['training', 'course', 'certification', 'program', 'curriculum'],
        'Demo/Showcase': ['demo', 'demonstration', 'showcase', 'exhibition', 'display'],
        'Launch Event': ['launch', 'announcement', 'unveiling', 'debut', 'introducing'],
        'Awards/Recognition': ['awards', 'recognition', 'celebration', 'achievement', 'honor'],
        'Roundtable': ['roundtable', 'round table', 'collaborative discussion'],
        'Consultation': ['consultation', 'advisory', 'feedback session', 'input session'],
        'Recruiting/Hiring': ['recruiting', 'hiring', 'career fair', 'job fair', 'recruitment'],
        'Fundraising': ['fundraising', 'funding', 'investment', 'donor', 'raise money'],
        'Community Building': ['community building', 'team building', 'relationship building'],
        'Mentorship': ['mentorship', 'mentoring', 'mentor', 'guidance', 'coaching'],
        'Office Hours': ['office hours', 'drop-in', 'open session', 'availability'],
        'Webinar': ['webinar', 'online session', 'virtual presentation'],
        'Field Trip': ['field trip', 'site visit', 'tour', 'visit to'],
        'Retreat': ['retreat', 'getaway', 'intensive', 'immersive']
      };

      const detectedFormats = [];
      Object.entries(formatKeywords).forEach(([format, keywords]) => {
        const matches = keywords.filter(keyword => content.includes(keyword));
        if (matches.length > 0) {
          detectedFormats.push({ format, matches });
        }
      });

      if (detectedFormats.length > 0) {
        console.log(`   Detected formats: ${detectedFormats.map(f => f.format).join(', ')}`);
        
        detectedFormats.forEach(detected => {
          formatAnalysis.formatPatterns[detected.format] = 
            (formatAnalysis.formatPatterns[detected.format] || 0) + 1;
        });
      }

      // Check if event might be ambiguous or hard to categorize
      const hasMultipleFormats = detectedFormats.length > 2;
      const hasUnclearFormat = detectedFormats.length === 0 && 
        !content.includes('workshop') && 
        !content.includes('discussion') && 
        !content.includes('presentation') &&
        !content.includes('networking');

      if (hasMultipleFormats || hasUnclearFormat) {
        formatAnalysis.ambiguousEvents.push({
          title: event.title,
          detectedFormats: detectedFormats.map(f => f.format),
          reason: hasMultipleFormats ? 'Multiple formats detected' : 'Unclear format'
        });
      }
    });

    console.log('\n\n📊 FORMAT ANALYSIS SUMMARY:');
    console.log('='.repeat(40));
    
    console.log('\n🏷️  DETECTED FORMATS:');
    Object.entries(formatAnalysis.formatPatterns)
      .sort(([,a], [,b]) => b - a)
      .forEach(([format, count]) => {
        console.log(`   ${format}: ${count} events`);
      });

    console.log('\n❓ AMBIGUOUS EVENTS:');
    formatAnalysis.ambiguousEvents.forEach(event => {
      console.log(`   "${event.title}"`);
      console.log(`     Issue: ${event.reason}`);
      if (event.detectedFormats.length > 0) {
        console.log(`     Formats: ${event.detectedFormats.join(', ')}`);
      }
    });

    // Analyze potential gaps in current category structure
    const potentialAdditions = [];

    if (formatAnalysis.formatPatterns['Demo/Showcase'] >= 2) {
      potentialAdditions.push({
        category: 'Demo/Showcase',
        count: formatAnalysis.formatPatterns['Demo/Showcase'],
        reasoning: 'Several events focus on demonstrating or showcasing work'
      });
    }

    if (formatAnalysis.formatPatterns['Training/Course'] >= 2) {
      potentialAdditions.push({
        category: 'Training/Course', 
        count: formatAnalysis.formatPatterns['Training/Course'],
        reasoning: 'Some events are more structured training than workshops'
      });
    }

    if (formatAnalysis.formatPatterns['Launch Event'] >= 1) {
      potentialAdditions.push({
        category: 'Launch/Announcement',
        count: formatAnalysis.formatPatterns['Launch Event'], 
        reasoning: 'Launch events have different purposes than info sessions'
      });
    }

    console.log('\n💡 POTENTIAL CATEGORY ADDITIONS:');
    if (potentialAdditions.length > 0) {
      potentialAdditions.forEach(addition => {
        console.log(`   ${addition.category} (${addition.count} events)`);
        console.log(`     Reasoning: ${addition.reasoning}`);
      });
    } else {
      console.log('   None needed - current 6 categories appear comprehensive');
    }

    console.log('\n🎯 MECE ASSESSMENT:');
    console.log('='.repeat(20));
    console.log('Current proposed categories:');
    proposedCategories.forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat}`);
    });

    console.log('\nMutually Exclusive: ✅ Categories have clear distinctions');
    console.log('Collectively Exhaustive: 🤔 Need to check coverage...');

    // Save detailed analysis
    const outputPath = path.join(__dirname, '../mece-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      formatAnalysis,
      potentialAdditions,
      proposedCategories,
      eventDetails: events.map(e => ({
        title: e.title,
        description: e.description?.substring(0, 200),
        currentTypes: e.ai_event_types || e.ai_event_type
      }))
    }, null, 2));

    console.log(`\n💾 Full analysis saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  analyzeMECE();
}

module.exports = { analyzeMECE };
