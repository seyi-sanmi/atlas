#!/usr/bin/env node

/**
 * Revised Category Recommendations
 * Based on user feedback and analysis of "Thinking Big Science" event
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Revised keyword mapping based on feedback
const revisedEventTypeKeywords = {
  'Information Session / Talk': [
    'info session', 'information session', 'learn about', 'discover', 'find out about',
    'program overview', 'introduction to', 'about the program', 'activator program',
    'talk', 'presentation', 'speaker', 'lecture', 'seminar'
  ],
  'Social / Mixer': [
    'networking', 'connect', 'meet other', 'community', 'social', 'mixer', 'mingle',
    'lunch & learn', 'coffee chat', 'get together', 'conversations', 'group rotations',
    'cross-community', 'bringing together', 'evening for', 'meet', 'structured group'
  ],
  'Workshop': [
    'workshop', 'training', 'hands-on', 'practical', 'technique', 'methodology', 
    'tutorial', 'skill building', 'learn how to', 'build', 'create'
  ],
  'Research / Academic': [
    'research', 'findings', 'study', 'analysis', 'results', 'data',
    'academic', 'scientific', 'research project', 'investigation', 'paper',
    'breakthrough science', 'meta-science'
  ],
  'Panel Discussion': [
    'panel', 'discussion', 'debate', 'roundtable', 'expert', 'speakers', 'Q&A',
    'question and answer', 'moderated', 'conversation'
  ],
  'Competition / Hackathon': [
    'hackathon', 'competition', 'contest', 'challenge', 'pitch', 'demo day',
    'showcase', 'demo night'
  ]
};

function analyzeEventContentRevised(title, description) {
  const content = `${title} ${description}`.toLowerCase();
  const scores = {};
  
  // Score each event type based on keyword matches
  Object.entries(revisedEventTypeKeywords).forEach(([type, keywords]) => {
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

async function generateRevisedRecommendations() {
  try {
    console.log('🔄 Generating revised category recommendations...');
    
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
      totalEvents: events.length,
      revisedCategories: {},
      eventAnalysis: [],
      exampleMappings: {}
    };

    // Analyze each event with revised categories
    events.forEach(event => {
      const currentTypes = event.ai_event_types || (event.ai_event_type ? [event.ai_event_type] : []);
      const revisedTypes = analyzeEventContentRevised(event.title, event.description);
      
      // Track revised categories
      revisedTypes.forEach(type => {
        analysis.revisedCategories[type] = (analysis.revisedCategories[type] || 0) + 1;
      });
      
      analysis.eventAnalysis.push({
        id: event.id,
        title: event.title,
        currentTypes,
        revisedTypes,
        description: event.description?.substring(0, 150) + '...'
      });
    });

    // Create specific mappings for key events
    const keyEvents = {
      'Thinking Big Science': {
        current: ['Meetup / Mixer'],
        revised: ['Social / Mixer'],
        reasoning: 'Networking event with structured group rotations and cross-community conversations'
      },
      'Dundee Activator Info Session': {
        current: ['Conference'],
        revised: ['Information Session / Talk'],
        reasoning: 'Program information session about the Activator Program'
      },
      'London AI Nexus Demo Night': {
        current: ['Meetup / Mixer'],
        revised: ['Competition / Hackathon', 'Social / Mixer'],
        reasoning: 'Technical showcase/demo with networking component'
      }
    };

    const recommendations = {
      executiveSummary: {
        totalEvents: analysis.totalEvents,
        keyChanges: [
          'Combine Information Session + Talk into single category',
          'Create dedicated Social / Mixer category',
          'Remove Innovation/Entrepreneurship as standalone category',
          'Focus on event format/purpose rather than subject matter'
        ]
      },

      revisedCategoryStructure: {
        primary: [
          'Information Session / Talk',
          'Social / Mixer', 
          'Workshop',
          'Research / Academic',
          'Panel Discussion',
          'Competition / Hackathon'
        ],
        description: {
          'Information Session / Talk': 'Program info sessions, presentations, seminars, talks',
          'Social / Mixer': 'Networking events, community building, social gatherings',
          'Workshop': 'Hands-on learning experiences, skill building sessions',
          'Research / Academic': 'Research presentations, academic discussions, scientific findings',
          'Panel Discussion': 'Expert panels, moderated discussions, Q&A sessions',
          'Competition / Hackathon': 'Competitions, hackathons, demo nights, showcases'
        }
      },

      specificMappings: {
        'Workshop': {
          keep: 'Workshop',
          reasoning: 'Good for hands-on learning events'
        },
        'Conference': {
          changeTo: 'Information Session / Talk',
          reasoning: 'Most are actually info sessions or talks, not full conferences'
        },
        'Meetup / Mixer': {
          changeTo: 'Social / Mixer',
          reasoning: 'Better reflects the networking/social nature'
        },
        'Panel Discussion': {
          keep: 'Panel Discussion', 
          reasoning: 'Clear format that works well'
        },
        'Hackathon': {
          changeTo: 'Competition / Hackathon',
          reasoning: 'More specific and includes other competitive formats'
        },
        'Other': {
          evaluate: 'Case by case basis using revised categories',
          reasoning: 'Distribute to appropriate specific categories'
        }
      },

      exampleRecategorizations: [
        {
          title: 'Thinking Big Science',
          currentCategory: 'Meetup / Mixer',
          newCategory: 'Social / Mixer',
          reasoning: 'Evening networking event with structured group conversations'
        },
        {
          title: 'Dundee Activator Info Session', 
          currentCategory: 'Conference',
          newCategory: 'Information Session / Talk',
          reasoning: 'Program information session, not a full conference'
        },
        {
          title: 'London AI Nexus Demo Night',
          currentCategory: 'Meetup / Mixer',
          newCategory: 'Competition / Hackathon + Social / Mixer',
          reasoning: 'Technical showcase with networking component'
        },
        {
          title: 'Norwich Lunch & Learn',
          currentCategory: 'Workshop + Meetup / Mixer',
          newCategory: 'Information Session / Talk + Social / Mixer',
          reasoning: 'Lunchtime info session with networking over food'
        }
      ],

      distributionAnalysis: analysis.revisedCategories,

      implementationSteps: [
        '1. Update category definitions to use new 6-category structure',
        '2. Re-categorize existing events using revised logic',
        '3. Update UI to show new category names', 
        '4. Test categorization accuracy with sample events',
        '5. Update AI categorization prompts to use new categories'
      ]
    };

    // Save recommendations
    const outputPath = path.join(__dirname, '../revised-category-recommendations.json');
    fs.writeFileSync(outputPath, JSON.stringify(recommendations, null, 2));

    // Print summary
    console.log('\n📊 REVISED CATEGORY RECOMMENDATIONS');
    console.log('===================================');
    
    console.log('\n🏷️  NEW CATEGORY STRUCTURE:');
    recommendations.revisedCategoryStructure.primary.forEach(category => {
      const count = analysis.revisedCategories[category] || 0;
      console.log(`  • ${category}: ${count} events`);
      console.log(`    ${recommendations.revisedCategoryStructure.description[category]}`);
    });

    console.log('\n🔄 CATEGORY MAPPINGS:');
    Object.entries(recommendations.specificMappings).forEach(([old, mapping]) => {
      if (mapping.keep) {
        console.log(`  ${old} → Keep as "${mapping.keep}"`);
      } else if (mapping.changeTo) {
        console.log(`  ${old} → Change to "${mapping.changeTo}"`);
      } else {
        console.log(`  ${old} → ${mapping.evaluate}`);
      }
      console.log(`    Reasoning: ${mapping.reasoning}`);
    });

    console.log('\n📝 EXAMPLE RECATEGORIZATIONS:');
    recommendations.exampleRecategorizations.forEach(example => {
      console.log(`\n  "${example.title}"`);
      console.log(`  Current: ${example.currentCategory}`);
      console.log(`  New: ${example.newCategory}`);
      console.log(`  Why: ${example.reasoning}`);
    });

    console.log(`\n💾 Full recommendations saved to: ${outputPath}`);

    return recommendations;

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  generateRevisedRecommendations();
}

module.exports = { generateRevisedRecommendations };

