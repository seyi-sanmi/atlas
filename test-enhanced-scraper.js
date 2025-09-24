// Test script for the enhanced Luma scraper with city extraction from title
import { scrapeEvent } from './src/lib/luma-scraper';

async function testNucleateManchester() {
  console.log('🧪 Testing enhanced Luma scraper with Nucleate Manchester event...');
  
  const testUrl = 'https://luma.com/cp6qnikp';
  
  try {
    const result = await scrapeEvent(testUrl);
    
    if ('error' in result) {
      console.error('❌ Scraping failed:', result.userMessage);
      return;
    }
    
    console.log('\n✅ Scraping successful!');
    console.log('📊 Event Data:');
    console.log(`Title: ${result.title}`);
    console.log(`Location: ${result.location}`);
    console.log(`City: ${result.city}`);
    console.log(`Description: ${result.description.substring(0, 200)}...`);
    console.log(`Date: ${result.date}`);
    console.log(`Time: ${result.time}`);
    console.log(`Organizer: ${result.organizer}`);
    
    // Check if our enhancement worked
    if (result.title.includes('Manchester') && result.city === 'Manchester') {
      console.log('\n🎯 SUCCESS: AI correctly extracted "Manchester" from the title!');
      console.log(`📍 Location remains as: "${result.location}" (for display)`);
      console.log(`🏷️  City tag set to: "${result.city}" (for filtering)`);
    } else if (result.title.includes('Manchester')) {
      console.log('\n⚠️  WARNING: Title contains Manchester but city was not extracted correctly');
      console.log(`Expected city: Manchester, Got: ${result.city}`);
    } else {
      console.log('\n📝 Note: Title might not contain Manchester in this test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNucleateManchester();
