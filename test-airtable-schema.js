const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a special client for the 'airtable' schema
const supabaseAirtable = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'airtable',
  },
});

async function testAirtableForeignTable() {
  console.log('Attempting to access airtable.atlas_public_view...');
  console.log('Using a dedicated client for the `airtable` schema.');

  try {
    const { data, error, count } = await supabaseAirtable
      .from('atlas_public_view')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ FAILED to access airtable.atlas_public_view');
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error Details: ${error.details}`);

      console.log('\\n🤔 Possible reasons for failure:');
      if (error.code === 'PGRST106' || error.message.includes('schema "airtable" is not in the search_path')) {
          console.log('   - The `airtable` schema was not exposed correctly in Supabase API settings.');
          console.log('     Please go to Project Settings > API > Exposed schemas and add `airtable`.');
      } else if (error.code === '42501') {
          console.log('   - Permissions on the foreign table itself are not set for the `anon` role.');
          console.log('     You may need to run: GRANT SELECT ON airtable.atlas_public_view TO anon;');
      }
      else {
        console.log('   - The foreign table name is incorrect.');
        console.log('   - The underlying foreign data wrapper (FDW) server connection has issues.');
      }

      return;
    }

    console.log('\\n✅ SUCCESS! Successfully accessed airtable.atlas_public_view');
    console.log(`   Found ${count} records.`);

    if (data && data.length > 0) {
      console.log('\\nSample Record:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\\nAvailable Columns:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('\\n⚠️  The view is accessible but returned no data.');
    }
  } catch (scriptError) {
    console.error('❌ An unexpected script error occurred:', scriptError);
  }
}

testAirtableForeignTable(); 