const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exploreAirtableStructure() {
  try {
    console.log('Getting airtable.atlas_public_view structure...\n');
    
    // First, get the table structure
    const { data: structure, error: structError } = await supabase
      .rpc('get_airtable_atlas_structure');
    
    if (structError) {
      console.error('Error getting structure:', structError);
      return;
    }
    
    if (structure && structure.length > 0) {
      console.log('Table structure:');
      console.table(structure);
    }
    
    // Then get a sample record
    console.log('\nGetting sample data...');
    const { data: sample, error: sampleError } = await supabase
      .rpc('get_airtable_atlas_sample');
    
    if (sampleError) {
      console.error('Error getting sample:', sampleError);
      return;
    }
    
    if (sample) {
      console.log('Sample record:');
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log('No sample data available (table might be empty)');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

exploreAirtableStructure(); 