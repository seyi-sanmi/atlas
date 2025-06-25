const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverAvailableTables() {
  console.log('Discovering available tables and views...\n');
  
  // List of possible table/view names to try
  const possibleNames = [
    'atlas_public_view_in_public',
    'atlas_public_view',
    'atlas_communities_import',
    'atlas_communities',
    'communities',
    'community_data',
    'events', // We know this one works
    'atlas_events',
    'public_communities',
    'atlas_data'
  ];
  
  const accessibleTables = [];
  const inaccessibleTables = [];
  
  for (const tableName of possibleNames) {
    try {
      console.log(`Testing: ${tableName}`);
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        console.log(`  ❌ ${error.message} (${error.code})`);
        inaccessibleTables.push({ name: tableName, error: error.message, code: error.code });
      } else {
        console.log(`  ✅ Accessible - ${count} total records`);
        if (data && data.length > 0) {
          console.log(`     Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`);
        }
        accessibleTables.push({ name: tableName, count, sampleData: data?.[0] });
      }
    } catch (error) {
      console.log(`  ❌ Script error: ${error.message}`);
      inaccessibleTables.push({ name: tableName, error: error.message, code: 'SCRIPT_ERROR' });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  
  if (accessibleTables.length > 0) {
    console.log('\n✅ ACCESSIBLE TABLES/VIEWS:');
    accessibleTables.forEach(table => {
      console.log(`  • ${table.name} (${table.count} records)`);
      if (table.sampleData) {
        // Check if it looks like community data
        const hasName = table.sampleData.Name || table.sampleData.name;
        const hasType = table.sampleData['Community Type'] || table.sampleData.communityType || table.sampleData.type;
        if (hasName && hasType) {
          console.log(`    → Looks like COMMUNITY data! Name: "${hasName}", Type: "${hasType}"`);
        } else if (table.sampleData.title && table.sampleData.organizer) {
          console.log(`    → Looks like EVENT data! Title: "${table.sampleData.title}"`);
        }
      }
    });
  } else {
    console.log('\n❌ NO ACCESSIBLE TABLES FOUND');
  }
  
  if (inaccessibleTables.length > 0) {
    console.log('\n❌ INACCESSIBLE TABLES/VIEWS:');
    inaccessibleTables.forEach(table => {
      console.log(`  • ${table.name}: ${table.error} (${table.code})`);
    });
  }
  
  // Recommendations
  console.log('\n' + '='.repeat(50));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  const communityTables = accessibleTables.filter(table => 
    table.sampleData && (
      table.sampleData.Name || table.sampleData.name || 
      table.sampleData['Community Type'] || table.sampleData.communityType
    )
  );
  
  if (communityTables.length > 0) {
    console.log(`\n✅ Use "${communityTables[0].name}" for community data`);
    console.log(`   This table has ${communityTables[0].count} community records`);
  } else {
    console.log('\n⚠️  No community data found in accessible tables');
    console.log('   You may need to:');
    console.log('   1. Create the community data table/view');
    console.log('   2. Fix permissions for atlas_public_view_in_public');
    console.log('   3. Import community data');
  }
  
  return { accessible: accessibleTables, inaccessible: inaccessibleTables };
}

discoverAvailableTables(); 