#!/usr/bin/env node

/**
 * Event Category Analysis Script
 * 
 * This script analyzes all event descriptions and titles to:
 * 1. Extract key themes and patterns from content
 * 2. Identify misalignments between current categories and actual content
 * 3. Propose new event categories that better reflect the actual content
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

// Keywords and patterns to identify event types
const eventTypeKeywords = {
  'Information Session': [
    'info session', 'information session', 'learn about', 'discover', 'find out about',
    'program overview', 'introduction to', 'about the program', 'activator program'
  ],
  'Networking Event': [
    'networking', 'connect', 'meet other', 'community', 'social', 'mixer', 'mingle',
    'lunch & learn', 'coffee chat', 'get together'
  ],
  'Educational Workshop': [
    'workshop', 'training', 'learn', 'skill', 'develop', 'build', 'create', 'hands-on',
    'practical', 'technique', 'methodology', 'tutorial'
  ],
  'Research Presentation': [
    'presentation', 'research', 'findings', 'study', 'analysis', 'results', 'data',
    'academic', 'scientific', 'research project', 'investigation'
  ],
  'Panel Discussion': [
    'panel', 'discussion', 'debate', 'roundtable', 'expert', 'speakers', 'Q&A',
    'question and answer', 'moderated', 'conversation'
  ],
  'Conference/Talk': [
    'conference', 'talk', 'keynote', 'speech', 'lecture', 'seminar', 'symposium',
    'summit', 'convention', 'meeting'
  ],
  'Hackathon/Competition': [
    'hackathon', 'competition', 'contest', 'challenge', 'build', 'create', 'develop',
    'innovation', 'startup', 'pitch', 'demo day'
  ],
  'Mentoring Session': [
    'mentor', 'mentoring', 'guidance', 'advice', 'support', 'coaching', 'consultation',
    'office hours', 'one-on-one'
  ],
  'Career Development': [
    'career', 'job', 'employment', 'opportunity', 'professional development',
    'career path', 'industry insights', 'career guidance'
  ],
  'Innovation/Entrepreneurship': [
    'entrepreneur', 'startup', 'innovation', 'business', 'venture', 'founder',
    'entrepreneurship', 'commercialization', 'spin-out'
  ]
};

function analyzeEventContent(title, description) {
  const content = `${title} ${description}`.toLowerCase();
  const scores = {};
  
  // Score each event type based on keyword matches
  Object.entries(eventTypeKeywords).forEach(([type, keywords]) => {
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

function extractThemes(content) {
  const themes = [];
  const contentLower = content.toLowerCase();
  
  // Research themes
  if (contentLower.includes('research') || contentLower.includes('academic') || contentLower.includes('scientific')) {
    themes.push('Research');
  }
  
  // Business themes
  if (contentLower.includes('business') || contentLower.includes('commercial') || contentLower.includes('industry')) {
    themes.push('Business');
  }
  
  // Technology themes
  if (contentLower.includes('technology') || contentLower.includes('tech') || contentLower.includes('digital') || contentLower.includes('ai') || contentLower.includes('data')) {
    themes.push('Technology');
  }
  
  // Health/Biotech themes
  if (contentLower.includes('health') || contentLower.includes('medical') || contentLower.includes('biotech') || contentLower.includes('life science')) {
    themes.push('Health/Biotech');
  }
  
  // Innovation themes
  if (contentLower.includes('innovation') || contentLower.includes('breakthrough') || contentLower.includes('disruptive')) {
    themes.push('Innovation');
  }
  
  // Career themes
  if (contentLower.includes('career') || contentLower.includes('professional') || contentLower.includes('job')) {
    themes.push('Career');
  }
  
  // Education themes
  if (contentLower.includes('learn') || contentLower.includes('education') || contentLower.includes('training') || contentLower.includes('skill')) {
    themes.push('Education');
  }
  
  // Networking themes
  if (contentLower.includes('network') || contentLower.includes('connect') || contentLower.includes('community')) {
    themes.push('Networking');
  }
  
  return themes;
}

async function analyzeEventCategories() {
  try {
    console.log('🔍 Fetching all events for category analysis...');
    
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

    console.log(`✅ Analyzing ${events?.length || 0} events...`);

    const analysis = {
      timestamp: new Date().toISOString(),
      totalEvents: events?.length || 0,
      currentCategoryIssues: [],
      proposedCategories: {},
      eventAnalysis: [],
      themeAnalysis: {},
      recommendations: {}
    };

    // Analyze each event
    events.forEach(event => {
      const currentTypes = event.ai_event_types || (event.ai_event_type ? [event.ai_event_type] : []);
      const proposedTypes = analyzeEventContent(event.title, event.description);
      const themes = extractThemes(`${event.title} ${event.description}`);
      
      // Track themes
      themes.forEach(theme => {
        analysis.themeAnalysis[theme] = (analysis.themeAnalysis[theme] || 0) + 1;
      });
      
      // Track proposed categories
      proposedTypes.forEach(type => {
        analysis.proposedCategories[type] = (analysis.proposedCategories[type] || 0) + 1;
      });
      
      // Identify misalignments
      const hasAlignment = currentTypes.some(currentType => 
        proposedTypes.some(proposedType => 
          proposedType.toLowerCase().includes(currentType.toLowerCase()) || 
          currentType.toLowerCase().includes(proposedType.toLowerCase())
        )
      );
      
      if (!hasAlignment && currentTypes.length > 0) {
        analysis.currentCategoryIssues.push({
          id: event.id,
          title: event.title,
          currentTypes,
          proposedTypes,
          themes,
          description: event.description?.substring(0, 200) + '...'
        });
      }
      
      analysis.eventAnalysis.push({
        id: event.id,
        title: event.title,
        currentTypes,
        proposedTypes,
        themes,
        alignment: hasAlignment
      });
    });

    // Generate recommendations
    analysis.recommendations = {
      topProposedCategories: Object.entries(analysis.proposedCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8),
      topThemes: Object.entries(analysis.themeAnalysis)
        .sort(([,a], [,b]) => b - a),
      misalignmentRate: Math.round((analysis.currentCategoryIssues.length / events.length) * 100),
      suggestedCategoryMapping: generateCategoryMapping(analysis)
    };

    // Save detailed analysis
    const outputPath = path.join(__dirname, '../event-category-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

    // Print summary
    console.log('\n📊 CATEGORY ANALYSIS RESULTS:');
    console.log('============================');
    console.log(`Total Events Analyzed: ${analysis.totalEvents}`);
    console.log(`Events with Category Misalignment: ${analysis.currentCategoryIssues.length} (${analysis.recommendations.misalignmentRate}%)`);
    
    console.log('\n🏷️  TOP PROPOSED CATEGORIES:');
    analysis.recommendations.topProposedCategories.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} events`);
    });
    
    console.log('\n🎯 TOP THEMES:');
    analysis.recommendations.topThemes.forEach(([theme, count]) => {
      console.log(`  ${theme}: ${count} events`);
    });

    console.log('\n⚠️  CATEGORY MISALIGNMENT EXAMPLES:');
    analysis.currentCategoryIssues.slice(0, 5).forEach(issue => {
      console.log(`\n  Title: ${issue.title}`);
      console.log(`  Current: ${issue.currentTypes.join(', ')}`);
      console.log(`  Proposed: ${issue.proposedTypes.join(', ')}`);
      console.log(`  Themes: ${issue.themes.join(', ')}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. Consider replacing current categories with more content-aligned ones');
    console.log('2. Use theme-based categorization to better reflect event content');
    console.log('3. Implement multi-category support for events that span multiple types');
    
    console.log(`\n💾 Full analysis saved to: ${outputPath}`);

    return analysis;

  } catch (error) {
    console.error('❌ Error during category analysis:', error);
  }
}

function generateCategoryMapping(analysis) {
  const mapping = {};
  
  // Map current categories to proposed ones based on content analysis
  const currentToProposed = {
    'Workshop': ['Educational Workshop', 'Information Session'],
    'Conference': ['Conference/Talk', 'Panel Discussion'],
    'Meetup / Mixer': ['Networking Event', 'Information Session'],
    'Panel Discussion': ['Panel Discussion', 'Research Presentation'],
    'Hackathon': ['Hackathon/Competition', 'Innovation/Entrepreneurship'],
    'Other': ['Information Session', 'Networking Event']
  };
  
  return currentToProposed;
}

// Run the analysis
if (require.main === module) {
  analyzeEventCategories();
}

module.exports = { analyzeEventCategories, analyzeEventContent, extractThemes };

