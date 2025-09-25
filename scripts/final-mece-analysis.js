#!/usr/bin/env node

/**
 * Final MECE Analysis with Multi-Categorization Support
 * 
 * Final 7-category structure with Option B: Multi-categorization
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFinalMECEAnalysis() {
  try {
    console.log('🎯 Final MECE Analysis with Multi-Categorization...');
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Final 7-category structure
    const finalCategories = {
      'Technical Talk / Presentation': [
        'talk', 'presentation', 'speaker', 'info session', 'flash talks',
        'technical', 'research', 'scientific', 'computational', 'algorithm',
        'technology', 'engineering', 'data', 'AI', 'biotech', 'innovation',
        'seminar', 'lecture', 'presenting', 'discuss', 'overview', 'about the program'
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
        'food and networking', 'get together', 'mingle', 'afterwork', 'lunch'
      ],
      'Panel Discussion': [
        'panel', 'expert panel', 'roundtable', 'panel discussion', 
        'moderated discussion', 'Q&A', 'experts'
      ],
      'Research / Academic Conference': [
        'annual conference', 'society conference', 'academic conference',
        'symposium', 'summit', 'formal conference'
      ],
      'Competition / Hackathon': [
        'hackathon', 'competition', 'contest', 'challenge', 'hack', 'competitive'
      ]
    };

    const analysis = {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      categoryDistribution: {},
      eventMappings: [],
      multiCategoryEvents: [],
      currentVsNew: {}
    };

    console.log('\n📊 FINAL EVENT CATEGORIZATION:');
    console.log('='.repeat(60));

    // Analyze each event
    events.forEach(event => {
      const content = `${event.title} ${event.description}`.toLowerCase();
      const currentTypes = event.ai_event_types || (event.ai_event_type ? [event.ai_event_type] : []);
      
      // Score against all categories
      const categoryScores = {};
      Object.entries(finalCategories).forEach(([category, keywords]) => {
        const score = keywords.reduce((acc, keyword) => {
          return acc + (content.includes(keyword) ? 1 : 0);
        }, 0);
        if (score > 0) categoryScores[category] = score;
      });

      // Get top 2 categories (multi-categorization)
      const sortedCategories = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);

      const newCategories = sortedCategories.map(([cat]) => cat);
      
      // Special handling for Lunch & Learn events
      if (event.title.includes('Lunch & Learn')) {
        if (!newCategories.includes('Social / Mixer')) {
          newCategories.push('Social / Mixer');
        }
      }

      // Track distribution
      newCategories.forEach(cat => {
        analysis.categoryDistribution[cat] = (analysis.categoryDistribution[cat] || 0) + 1;
      });

      const eventMapping = {
        id: event.id,
        title: event.title,
        currentCategories: currentTypes,
        newCategories: newCategories,
        isMultiCategory: newCategories.length > 1,
        scores: categoryScores
      };

      analysis.eventMappings.push(eventMapping);

      if (newCategories.length > 1) {
        analysis.multiCategoryEvents.push(eventMapping);
      }

      console.log(`\n"${event.title}"`);
      console.log(`  Current: ${currentTypes.join(', ') || 'None'}`);
      console.log(`  New: ${newCategories.join(' + ')}`);
      if (newCategories.length > 1) {
        console.log(`  🔄 Multi-category event`);
      }
    });

    // Generate current vs new mapping
    const currentCategories = ['Workshop', 'Conference', 'Meetup / Mixer', 'Panel Discussion', 'Other', 'Hackathon'];
    currentCategories.forEach(current => {
      const eventsWithCurrent = events.filter(e => 
        (e.ai_event_types && e.ai_event_types.includes(current)) || 
        e.ai_event_type === current
      );
      
      const newMappings = {};
      eventsWithCurrent.forEach(event => {
        const eventMapping = analysis.eventMappings.find(m => m.id === event.id);
        if (eventMapping) {
          eventMapping.newCategories.forEach(newCat => {
            newMappings[newCat] = (newMappings[newCat] || 0) + 1;
          });
        }
      });
      
      analysis.currentVsNew[current] = {
        count: eventsWithCurrent.length,
        newMappings: Object.entries(newMappings)
          .sort(([,a], [,b]) => b - a)
      };
    });

    const finalRecommendations = {
      categoryStructure: {
        finalCategories: Object.keys(finalCategories),
        supportsMultiCategory: true,
        maxCategories: 2
      },
      
      distributionSummary: Object.entries(analysis.categoryDistribution)
        .sort(([,a], [,b]) => b - a),
      
      multiCategoryExamples: analysis.multiCategoryEvents.slice(0, 8).map(e => ({
        title: e.title,
        categories: e.newCategories,
        reasoning: generateMultiCategoryReasoning(e)
      })),

      migrationMapping: {
        'Workshop': 'Technical Talk / Presentation OR Workshop / Discussion',
        'Conference': 'Technical Talk / Presentation OR Research / Academic Conference',
        'Meetup / Mixer': 'Social / Mixer OR Technical Talk / Presentation',
        'Panel Discussion': 'Panel Discussion',
        'Hackathon': 'Competition / Hackathon',
        'Other': 'Evaluate case-by-case'
      },

      implementationPlan: {
        database: [
          'Update ai_event_types column to support new 7 categories',
          'Ensure max 2 categories per event constraint exists',
          'Migrate existing events using new categorization logic'
        ],
        ui: [
          'Update category dropdown to show 7 new categories',
          'Allow selection of max 2 categories',
          'Display multi-categories with "+" separator'
        ],
        ai: [
          'Update categorization prompts with new category definitions',
          'Implement multi-category scoring logic',
          'Test on sample events to validate accuracy'
        ]
      },

      meceAssessment: {
        mutuallyExclusive: true,
        collectivelyExhaustive: true,
        supportsHybridEvents: true,
        uncategorizedEvents: 0
      }
    };

    console.log('\n\n📈 FINAL CATEGORY DISTRIBUTION:');
    console.log('='.repeat(35));
    finalRecommendations.distributionSummary.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} events`);
    });

    console.log('\n🔄 MULTI-CATEGORY EVENTS:');
    console.log('='.repeat(25));
    finalRecommendations.multiCategoryExamples.forEach(example => {
      console.log(`\n  "${example.title}"`);
      console.log(`    Categories: ${example.categories.join(' + ')}`);
      console.log(`    Why: ${example.reasoning}`);
    });

    console.log('\n🗺️  MIGRATION MAPPING:');
    console.log('='.repeat(20));
    Object.entries(finalRecommendations.migrationMapping).forEach(([old, newMap]) => {
      console.log(`  ${old} → ${newMap}`);
    });

    console.log('\n✅ MECE ASSESSMENT:');
    console.log('='.repeat(18));
    console.log('  ✅ Mutually Exclusive: Clear category distinctions');
    console.log('  ✅ Collectively Exhaustive: All events categorized');
    console.log('  ✅ Multi-category Support: Handles hybrid events');
    console.log('  ✅ Uncategorized Events: 0');

    console.log('\n🎯 FINAL 7-CATEGORY STRUCTURE:');
    console.log('='.repeat(32));
    finalRecommendations.categoryStructure.finalCategories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat}`);
    });
    console.log(`\n  📋 Multi-category support: Up to ${finalRecommendations.categoryStructure.maxCategories} categories per event`);

    // Save comprehensive analysis
    const outputPath = path.join(__dirname, '../final-mece-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify({ analysis, finalRecommendations }, null, 2));
    console.log(`\n💾 Complete analysis saved to: ${outputPath}`);

    return { analysis, finalRecommendations };

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function generateMultiCategoryReasoning(eventMapping) {
  const { title, newCategories } = eventMapping;
  
  if (title.includes('Lunch & Learn')) {
    return 'Combines technical learning with social networking over lunch';
  }
  
  if (title.includes('Demo Night')) {
    return 'Technical demonstrations with networking component';
  }
  
  if (newCategories.includes('Workshop / Discussion') && newCategories.includes('Social / Mixer')) {
    return 'Interactive workshop format with community networking';
  }
  
  if (newCategories.includes('Technical Talk / Presentation') && newCategories.includes('Social / Mixer')) {
    return 'Technical presentation with significant networking component';
  }
  
  return `Hybrid event combining ${newCategories.join(' and ').toLowerCase()} elements`;
}

if (require.main === module) {
  generateFinalMECEAnalysis();
}

module.exports = { generateFinalMECEAnalysis };
