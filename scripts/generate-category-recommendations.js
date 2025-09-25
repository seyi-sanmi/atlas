#!/usr/bin/env node

/**
 * Generate Final Category Recommendations
 * 
 * This script creates a comprehensive report with specific recommendations
 * for improving event categorization based on content analysis
 */

const fs = require('fs');
const path = require('path');

async function generateRecommendations() {
  try {
    // Load the analysis data
    const analysisPath = path.join(__dirname, '../event-category-analysis.json');
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    console.log('📋 Generating comprehensive category recommendations...');

    // Create detailed recommendations
    const recommendations = {
      executiveSummary: {
        totalEvents: analysis.totalEvents,
        misalignmentRate: analysis.recommendations.misalignmentRate,
        keyFindings: [
          `${analysis.recommendations.misalignmentRate}% of events have misaligned categories`,
          'Most events are actually Information Sessions or Research Presentations',
          'Current categories don\'t reflect the academic/research focus of events',
          'Multi-theme events are common and need better categorization'
        ]
      },
      
      currentVsProposedCategories: {
        current: {
          'Workshop': 6,
          'Conference': 9,
          'Meetup / Mixer': 13,
          'Panel Discussion': 5,
          'Other': 1,
          'Hackathon': 3
        },
        proposed: {
          'Information Session': 15,
          'Research Presentation': 14,
          'Innovation/Entrepreneurship': 9,
          'Networking Event': 6,
          'Hackathon/Competition': 6,
          'Educational Workshop': 4,
          'Conference/Talk': 3,
          'Panel Discussion': 2
        }
      },

      categoryMapping: {
        'Workshop': {
          suggested: ['Educational Workshop', 'Information Session'],
          reasoning: 'Current "Workshop" events are mostly info sessions about programs/resources',
          examples: ['Dundee Lunch & Learn', 'Norwich Lunch & Learn']
        },
        'Conference': {
          suggested: ['Information Session', 'Research Presentation'],
          reasoning: 'Events labeled as "Conference" are actually program info sessions',
          examples: ['Dundee Activator Info Session', 'Norwich Activator Info Session']
        },
        'Meetup / Mixer': {
          suggested: ['Networking Event', 'Information Session'],
          reasoning: 'Mix of networking events and program information sessions',
          examples: ['Thinking Big Science', 'Various Activator sessions']
        },
        'Panel Discussion': {
          suggested: ['Panel Discussion', 'Research Presentation'],
          reasoning: 'Some are actual panels, others are research-focused presentations',
          examples: ['Research-focused discussions']
        },
        'Hackathon': {
          suggested: ['Hackathon/Competition', 'Innovation/Entrepreneurship'],
          reasoning: 'Good alignment, but could be more specific about innovation focus',
          examples: ['Innovation challenges', 'Startup competitions']
        }
      },

      newCategoryStructure: {
        primary: [
          'Information Session',
          'Research Presentation', 
          'Innovation/Entrepreneurship',
          'Networking Event',
          'Educational Workshop',
          'Hackathon/Competition',
          'Conference/Talk',
          'Panel Discussion'
        ],
        themes: [
          'Research',
          'Technology', 
          'Business',
          'Health/Biotech',
          'Innovation',
          'Education',
          'Networking',
          'Career'
        ],
        format: [
          'In-Person',
          'Online',
          'Hybrid'
        ]
      },

      implementationPlan: {
        phase1: [
          'Update category definitions to match content analysis',
          'Create new category structure with primary categories + themes',
          'Implement multi-category support (max 2 categories per event)'
        ],
        phase2: [
          'Re-categorize existing events based on content analysis',
          'Update AI categorization logic to use new categories',
          'Test and validate new categorization system'
        ],
        phase3: [
          'Monitor categorization accuracy',
          'Gather user feedback on new categories',
          'Fine-tune based on usage patterns'
        ]
      },

      specificRecommendations: {
        immediate: [
          'Replace "Conference" with "Information Session" for program info events',
          'Replace "Workshop" with "Educational Workshop" or "Information Session" based on content',
          'Split "Meetup / Mixer" into "Networking Event" and "Information Session"',
          'Keep "Panel Discussion" and "Hackathon" as they align well with content'
        ],
        longTerm: [
          'Implement theme-based tagging system (Research, Technology, Business, etc.)',
          'Add format indicators (In-Person, Online, Hybrid)',
          'Create category hierarchy (Primary + Secondary categories)',
          'Develop content-based auto-categorization using the new structure'
        ]
      },

      sampleRecategorizations: analysis.currentCategoryIssues.slice(0, 10).map(issue => ({
        title: issue.title,
        currentCategories: issue.currentTypes,
        suggestedCategories: issue.proposedTypes,
        themes: issue.themes,
        reasoning: generateReasoning(issue)
      }))
    };

    // Save comprehensive report
    const reportPath = path.join(__dirname, '../event-category-recommendations.json');
    fs.writeFileSync(reportPath, JSON.stringify(recommendations, null, 2));

    // Print executive summary
    console.log('\n📊 EXECUTIVE SUMMARY');
    console.log('===================');
    console.log(`Total Events Analyzed: ${recommendations.executiveSummary.totalEvents}`);
    console.log(`Category Misalignment Rate: ${recommendations.executiveSummary.misalignmentRate}%`);
    
    console.log('\n🔍 KEY FINDINGS:');
    recommendations.executiveSummary.keyFindings.forEach(finding => {
      console.log(`  • ${finding}`);
    });

    console.log('\n🏷️  PROPOSED NEW CATEGORY STRUCTURE:');
    console.log('=====================================');
    console.log('\nPrimary Categories:');
    recommendations.newCategoryStructure.primary.forEach(category => {
      const count = analysis.recommendations.topProposedCategories.find(([cat]) => cat === category)?.[1] || 0;
      console.log(`  • ${category} (${count} events)`);
    });

    console.log('\nThemes:');
    recommendations.newCategoryStructure.themes.forEach(theme => {
      const count = analysis.recommendations.topThemes.find(([t]) => t === theme)?.[1] || 0;
      console.log(`  • ${theme} (${count} events)`);
    });

    console.log('\n🔄 CATEGORY MAPPING RECOMMENDATIONS:');
    console.log('====================================');
    Object.entries(recommendations.categoryMapping).forEach(([current, mapping]) => {
      console.log(`\n${current} → ${mapping.suggested.join(' / ')}`);
      console.log(`  Reasoning: ${mapping.reasoning}`);
      console.log(`  Examples: ${mapping.examples.join(', ')}`);
    });

    console.log('\n📋 IMPLEMENTATION PLAN:');
    console.log('=======================');
    console.log('\nPhase 1 (Immediate):');
    recommendations.implementationPlan.phase1.forEach(step => {
      console.log(`  • ${step}`);
    });

    console.log('\nPhase 2 (Short-term):');
    recommendations.implementationPlan.phase2.forEach(step => {
      console.log(`  • ${step}`);
    });

    console.log('\nPhase 3 (Long-term):');
    recommendations.implementationPlan.phase3.forEach(step => {
      console.log(`  • ${step}`);
    });

    console.log(`\n💾 Full recommendations saved to: ${reportPath}`);

    return recommendations;

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
  }
}

function generateReasoning(issue) {
  const themes = issue.themes.join(', ');
  const currentTypes = issue.currentTypes.join(', ');
  const proposedTypes = issue.proposedTypes.join(', ');
  
  return `Content focuses on ${themes}. Current categorization (${currentTypes}) doesn't reflect the informational/educational nature. Suggested categories (${proposedTypes}) better align with the event's purpose and content.`;
}

// Run the recommendations generator
if (require.main === module) {
  generateRecommendations();
}

module.exports = { generateRecommendations };

