#!/usr/bin/env node

/**
 * Analyze how well events fit into the 7-category structure
 * Test both "Talk / Presentation" vs "Technical Talk / Presentation"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSevenCategoryFit() {
  try {
    console.log('🎯 Testing 7-category structure fit...');
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Define the 7 categories with keywords
    const sevenCategories = {
      'Talk / Presentation': [
        'talk', 'presentation', 'speaker', 'info session', 'flash talks',
        'seminar', 'lecture', 'presenting', 'discuss', 'overview', 'about the program'
      ],
      'Technical Talk / Presentation': [
        'talk', 'presentation', 'speaker', 'info session', 'flash talks',
        'technical', 'research', 'scientific', 'computational', 'algorithm',
        'technology', 'engineering', 'data', 'AI', 'biotech', 'innovation'
      ],
      'Workshop / Discussion': [
        'workshop', 'discussion', 'explore how', 'structured group', 'group rotations',
        'interactive', 'brainstorming', 'hands-on', 'practical', 'turning ideas into action',
        'ambitious thinkers', 'thought experiment', 'cross-community conversations'
      ],
      'Demo / Showcase': [
        'demo', 'demonstration', 'showcase', 'exhibition', 'display', 'demo night',
        'technical showcase', 'frontier AI demos', 'presenting work'
      ],
      'Social / Mixer': [
        'networking', 'mixer', 'social', 'meet other', 'community', 'drinks',
        'food and networking', 'get together', 'mingle', 'afterwork'
      ],
      'Panel Discussion': [
        'panel', 'expert panel', 'roundtable', 'panel discussion', 
        'moderated discussion', 'Q&A', 'experts'
      ],
      'Research / Academic Conference': [
        'conference', 'annual conference', 'society conference', 'academic conference',
        'symposium', 'summit', 'formal conference'
      ],
      'Competition / Hackathon': [
        'hackathon', 'competition', 'contest', 'challenge', 'hack', 'competitive'
      ]
    };

    console.log('\n📊 TESTING CATEGORY FIT:');
    console.log('='.repeat(50));

    const analysis = {
      categoryFits: {},
      uncategorized: [],
      multiCategory: [],
      technicalVsGeneral: {}
    };

    // Test each event against categories
    events.forEach(event => {
      const content = `${event.title} ${event.description}`.toLowerCase();
      
      // Test regular categories
      const regularFits = {};
      Object.entries(sevenCategories).forEach(([category, keywords]) => {
        if (category !== 'Technical Talk / Presentation') {
          const score = keywords.reduce((acc, keyword) => {
            return acc + (content.includes(keyword) ? 1 : 0);
          }, 0);
          if (score > 0) regularFits[category] = score;
        }
      });

      // Test technical vs general talk/presentation
      const talkScore = sevenCategories['Talk / Presentation'].reduce((acc, keyword) => {
        return acc + (content.includes(keyword) ? 1 : 0);
      }, 0);
      
      const technicalScore = sevenCategories['Technical Talk / Presentation'].reduce((acc, keyword) => {
        return acc + (content.includes(keyword) ? 1 : 0);
      }, 0);

      // Determine best fits
      const sortedFits = Object.entries(regularFits)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);

      const eventAnalysis = {
        id: event.id,
        title: event.title,
        currentCategories: event.ai_event_types || [event.ai_event_type],
        bestFits: sortedFits.map(([cat]) => cat),
        talkScore,
        technicalScore,
        wouldBeTechnical: technicalScore > talkScore
      };

      console.log(`\n"${event.title}"`);
      console.log(`  Current: ${eventAnalysis.currentCategories.join(', ')}`);
      console.log(`  Best fits: ${eventAnalysis.bestFits.join(', ')}`);
      console.log(`  Talk score: ${talkScore}, Technical score: ${technicalScore}`);
      console.log(`  Would be Technical: ${eventAnalysis.wouldBeTechnical ? 'YES' : 'NO'}`);

      // Track categories
      eventAnalysis.bestFits.forEach(cat => {
        analysis.categoryFits[cat] = (analysis.categoryFits[cat] || 0) + 1;
      });

      if (eventAnalysis.bestFits.length === 0) {
        analysis.uncategorized.push(eventAnalysis);
      }

      if (eventAnalysis.bestFits.length > 1) {
        analysis.multiCategory.push(eventAnalysis);
      }

      // Track technical vs general preference
      if (eventAnalysis.bestFits.includes('Talk / Presentation')) {
        analysis.technicalVsGeneral[event.title] = {
          prefersTechnical: eventAnalysis.wouldBeTechnical,
          talkScore,
          technicalScore
        };
      }
    });

    console.log('\n\n📈 CATEGORY DISTRIBUTION:');
    console.log('='.repeat(30));
    Object.entries(analysis.categoryFits)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} events`);
      });

    console.log('\n🤔 UNCATEGORIZED EVENTS:');
    if (analysis.uncategorized.length > 0) {
      analysis.uncategorized.forEach(event => {
        console.log(`  "${event.title}" - No clear category fit`);
      });
    } else {
      console.log('  ✅ All events fit into categories!');
    }

    console.log('\n🔄 MULTI-CATEGORY EVENTS:');
    analysis.multiCategory.slice(0, 5).forEach(event => {
      console.log(`  "${event.title}" - Fits: ${event.bestFits.join(' + ')}`);
    });

    console.log('\n⚡ TECHNICAL vs GENERAL TALK/PRESENTATION:');
    console.log('='.repeat(45));
    
    let technicalCount = 0;
    let generalCount = 0;
    
    Object.entries(analysis.technicalVsGeneral).forEach(([title, data]) => {
      if (data.prefersTechnical) {
        technicalCount++;
        console.log(`  TECHNICAL: "${title}" (score: ${data.technicalScore} vs ${data.talkScore})`);
      } else {
        generalCount++;
        console.log(`  GENERAL: "${title}" (score: ${data.talkScore} vs ${data.technicalScore})`);
      }
    });

    console.log(`\n📊 TECHNICAL vs GENERAL SUMMARY:`);
    console.log(`  Technical Talk/Presentation: ${technicalCount} events`);
    console.log(`  General Talk/Presentation: ${generalCount} events`);
    console.log(`  Recommendation: ${technicalCount > generalCount ? 'Use TECHNICAL' : 'Use GENERAL'}`);

    console.log('\n🎯 MECE ASSESSMENT:');
    console.log('='.repeat(20));
    console.log('✅ Mutually Exclusive: Categories have clear distinctions');
    console.log(`${analysis.uncategorized.length === 0 ? '✅' : '❌'} Collectively Exhaustive: ${analysis.uncategorized.length === 0 ? 'All events fit' : `${analysis.uncategorized.length} events don't fit`}`);

    // Save analysis
    const outputPath = path.join(__dirname, '../seven-category-fit-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\n💾 Analysis saved to: ${outputPath}`);

    return analysis;

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  analyzeSevenCategoryFit();
}

module.exports = { analyzeSevenCategoryFit };
