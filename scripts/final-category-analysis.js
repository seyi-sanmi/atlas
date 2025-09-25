#!/usr/bin/env node

/**
 * Final Category Analysis Script
 * 
 * Based on user feedback, using the refined category structure:
 * 1. Information Session / Talk
 * 2. Workshop / Discussion  
 * 3. Social / Mixer
 * 4. Panel Discussion
 * 5. Research / Academic
 * 6. Competition / Hackathon
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Final refined keyword mapping
const finalEventTypeKeywords = {
  'Information Session / Talk': [
    'info session', 'information session', 'learn about', 'discover', 'find out about',
    'program overview', 'introduction to', 'about the program', 'activator program',
    'talk', 'presentation', 'speaker', 'lecture', 'seminar', 'keynote'
  ],
  'Workshop / Discussion': [
    'workshop', 'discussion', 'explore how', 'structured group', 'group rotations',
    'interactive', 'brainstorming', 'hands-on', 'practical', 'turning ideas into action',
    'ambitious thinkers', 'thought experiment', 'move from vision to reality',
    'cross-community conversations', 'practical next steps'
  ],
  'Social / Mixer': [
    'networking', 'connect', 'meet other', 'community', 'social', 'mixer', 'mingle',
    'lunch & learn', 'coffee chat', 'get together', 'bringing people together',
    'food and networking', 'social gathering', 'meet and greet'
  ],
  'Panel Discussion': [
    'panel', 'expert panel', 'roundtable', 'expert speakers', 'Q&A',
    'question and answer', 'moderated discussion', 'panel of experts'
  ],
  'Research / Academic': [
    'research', 'findings', 'study', 'analysis', 'results', 'data',
    'academic', 'scientific', 'research project', 'investigation', 'paper',
    'breakthrough science', 'meta-science', 'scientific discovery'
  ],
  'Competition / Hackathon': [
    'hackathon', 'competition', 'contest', 'challenge', 'pitch', 'demo day',
    'showcase', 'demo night', 'startup competition', 'innovation challenge'
  ]
};

function analyzeFinalEventContent(title, description) {
  const content = `${title} ${description}`.toLowerCase();
  const scores = {};
  
  // Score each event type based on keyword matches
  Object.entries(finalEventTypeKeywords).forEach(([type, keywords]) => {
    scores[type] = keywords.reduce((score, keyword) => {
      const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
      return score + matches;
    }, 0);
  });
  
  // Return the top scoring event types
  const sortedScores = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .filter(([,score]) => score > 0);
  
  return sortedScores.slice(0, 2).map(([type]) => type);
}

async function generateFinalAnalysis() {
  try {
    console.log('🎯 Generating FINAL category analysis...');
    
    // Get all events
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, title, description, url, platform, ai_event_type, ai_event_types,
        categories, organizer, date, location, city
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const analysis = {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      finalCategories: {},
      eventMappings: [],
      currentVsFinal: {},
      misalignments: []
    };

    // Analyze each event with final categories
    events.forEach(event => {
      const currentTypes = event.ai_event_types || (event.ai_event_type ? [event.ai_event_type] : []);
      const finalTypes = analyzeFinalEventContent(event.title, event.description);
      
      // Track final categories
      finalTypes.forEach(type => {
        analysis.finalCategories[type] = (analysis.finalCategories[type] || 0) + 1;
      });
      
      // Check alignment
      const hasAlignment = currentTypes.some(currentType => 
        finalTypes.some(finalType => 
          finalType.toLowerCase().includes(currentType.toLowerCase()) || 
          currentType.toLowerCase().includes(finalType.toLowerCase()) ||
          (currentType === 'Meetup / Mixer' && finalType === 'Social / Mixer') ||
          (currentType === 'Workshop' && finalType === 'Workshop / Discussion')
        )
      );
      
      const eventMapping = {
        id: event.id,
        title: event.title,
        currentTypes,
        finalTypes,
        aligned: hasAlignment,
        description: event.description?.substring(0, 200) + '...'
      };
      
      analysis.eventMappings.push(eventMapping);
      
      if (!hasAlignment && currentTypes.length > 0) {
        analysis.misalignments.push(eventMapping);
      }
    });

    // Generate current vs final mapping
    const currentCategories = ['Workshop', 'Conference', 'Meetup / Mixer', 'Panel Discussion', 'Other', 'Hackathon'];
    currentCategories.forEach(current => {
      const eventsWithCurrent = events.filter(e => 
        (e.ai_event_types && e.ai_event_types.includes(current)) || 
        e.ai_event_type === current
      );
      
      const suggestedMapping = {};
      eventsWithCurrent.forEach(event => {
        const finalTypes = analyzeFinalEventContent(event.title, event.description);
        finalTypes.forEach(type => {
          suggestedMapping[type] = (suggestedMapping[type] || 0) + 1;
        });
      });
      
      analysis.currentVsFinal[current] = {
        count: eventsWithCurrent.length,
        suggestedMapping: Object.entries(suggestedMapping)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2)
      };
    });

    const recommendations = {
      executiveSummary: {
        totalEvents: analysis.totalEvents,
        misalignmentRate: Math.round((analysis.misalignments.length / events.length) * 100),
        finalCategoryStructure: [
          'Information Session / Talk',
          'Workshop / Discussion', 
          'Social / Mixer',
          'Panel Discussion',
          'Research / Academic',
          'Competition / Hackathon'
        ]
      },

      categoryDistribution: analysis.finalCategories,

      categoryMappings: {
        'Workshop': {
          recommendedChange: 'Workshop / Discussion',
          reasoning: 'Captures both hands-on workshops and structured discussions',
          confidence: 'High'
        },
        'Conference': {
          recommendedChange: 'Information Session / Talk',
          reasoning: 'Most events labeled as conferences are actually info sessions or talks',
          confidence: 'High'
        },
        'Meetup / Mixer': {
          recommendedChange: 'Social / Mixer OR Workshop / Discussion',
          reasoning: 'Split based on purpose: networking vs structured activities',
          confidence: 'Medium - requires case-by-case evaluation'
        },
        'Panel Discussion': {
          recommendedChange: 'Panel Discussion',
          reasoning: 'Good alignment, keep as is',
          confidence: 'High'
        },
        'Hackathon': {
          recommendedChange: 'Competition / Hackathon',
          reasoning: 'More comprehensive to include other competitive formats',
          confidence: 'High'
        },
        'Other': {
          recommendedChange: 'Evaluate individually',
          reasoning: 'Distribute to specific categories based on content',
          confidence: 'Case-by-case'
        }
      },

      keyEventExamples: [
        {
          title: 'Thinking Big Science',
          currentCategory: 'Meetup / Mixer',
          finalCategory: 'Workshop / Discussion',
          reasoning: 'Structured discussion with group rotations, practical outcomes, and idea exploration - not just networking'
        },
        {
          title: 'Dundee Activator Info Session',
          currentCategory: 'Conference',
          finalCategory: 'Information Session / Talk',
          reasoning: 'Program information session, not a full conference'
        },
        {
          title: 'London AI Nexus Demo Night',
          currentCategory: 'Meetup / Mixer',
          finalCategory: 'Competition / Hackathon',
          reasoning: 'Technical showcase/demo event with competitive element'
        }
      ],

      implementationPlan: {
        immediate: [
          'Update category structure to use 6 final categories',
          'Create clear definitions for each category',
          'Test categorization on sample events'
        ],
        shortTerm: [
          'Re-categorize all existing events using new structure',
          'Update AI categorization logic and prompts',
          'Update user interface to show new categories'
        ],
        longTerm: [
          'Monitor categorization accuracy',
          'Gather user feedback on new categories',
          'Fine-tune based on usage patterns'
        ]
      }
    };

    // Save analysis
    const outputPath = path.join(__dirname, '../final-category-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify({ analysis, recommendations }, null, 2));

    // Print results
    console.log('\n📊 FINAL CATEGORY ANALYSIS RESULTS');
    console.log('==================================');
    console.log(`Total Events: ${analysis.totalEvents}`);
    console.log(`Misalignment Rate: ${recommendations.executiveSummary.misalignmentRate}%`);
    
    console.log('\n🏷️  FINAL CATEGORY DISTRIBUTION:');
    Object.entries(analysis.finalCategories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} events`);
      });

    console.log('\n🔄 CATEGORY MAPPINGS:');
    Object.entries(recommendations.categoryMappings).forEach(([current, mapping]) => {
      console.log(`\n  ${current} → ${mapping.recommendedChange}`);
      console.log(`    Reasoning: ${mapping.reasoning}`);
      console.log(`    Confidence: ${mapping.confidence}`);
    });

    console.log('\n📝 KEY EVENT EXAMPLES:');
    recommendations.keyEventExamples.forEach(example => {
      console.log(`\n  "${example.title}"`);
      console.log(`    Current: ${example.currentCategory}`);
      console.log(`    Final: ${example.finalCategory}`);
      console.log(`    Why: ${example.reasoning}`);
    });

    console.log('\n🎯 MISALIGNMENT EXAMPLES:');
    analysis.misalignments.slice(0, 5).forEach(event => {
      console.log(`\n  "${event.title}"`);
      console.log(`    Current: ${event.currentTypes.join(', ')}`);
      console.log(`    Suggested: ${event.finalTypes.join(', ')}`);
    });

    console.log(`\n💾 Full analysis saved to: ${outputPath}`);
    
    return { analysis, recommendations };

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  generateFinalAnalysis();
}

module.exports = { generateFinalAnalysis };
