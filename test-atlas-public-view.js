const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAtlasPublicView() {
  try {
    console.log('Testing access to atlas_public_view_in_public...');
    
    // Test the specific view the user created
    console.log('\n1. Testing atlas_public_view_in_public (user\'s public view)...');
    const { data: viewData, error: viewError, count: viewCount } = await supabase
      .from('atlas_public_view_in_public')
      .select('*', { count: 'exact' })
      .limit(5);
      
    if (viewError) {
      console.log(`  Error accessing atlas_public_view_in_public: ${viewError.message}`);
      console.log(`  Error code: ${viewError.code}`);
      console.log(`  Error details: ${viewError.details}`);
      
      // If there's a permission issue, let's try some alternatives
      if (viewError.code === '42501') {
        console.log('\n  This appears to be a permission issue. Let me try some alternatives...');
        
        // Try without schema prefix
        const { data: altData, error: altError } = await supabase
          .from('atlas_public_view_in_public')
          .select('*')
          .limit(3);
          
        if (altError) {
          console.log(`  Alternative approach also failed: ${altError.message}`);
        } else {
          console.log('  Alternative approach worked!');
          console.log(`  Found ${altData?.length || 0} records`);
          if (altData && altData.length > 0) {
            console.log('  Sample record:');
            console.log(JSON.stringify(altData[0], null, 2));
          }
        }
      }
    } else {
      console.log(`  SUCCESS! atlas_public_view_in_public is accessible`);
      console.log(`  Total records: ${viewCount}`);
      
      if (viewData && viewData.length > 0) {
        console.log('  Sample record:');
        console.log(JSON.stringify(viewData[0], null, 2));
        console.log('  Available columns:');
        console.log(Object.keys(viewData[0]));
        
        console.log('\n  All records:');
        viewData.forEach((record, index) => {
          const name = record.name || record.Name || record.community_name || 'Unknown';
          const type = record.communityType || record.community_type || record['Community Type'] || record.type || 'Unknown type';
          console.log(`    ${index + 1}. ${name} - ${type}`);
        });
        
        return { tableName: 'atlas_public_view_in_public', data: viewData, count: viewCount };
      } else {
        console.log('  View exists but is empty - needs to be populated');
      }
    }
    
    console.log('\n2. Summary:');
    if (viewError) {
      console.log('❌ The atlas_public_view_in_public view is not accessible');
      console.log('   Possible issues:');
      console.log('   - View permissions need to be set for the anon role');
      console.log('   - View might be in a different schema');
      console.log('   - View definition might have issues');
      console.log('\n   Please check your Supabase dashboard to:');
      console.log('   1. Verify the view exists');
      console.log('   2. Check RLS policies and permissions');
      console.log('   3. Ensure the anon role can access it');
    } else if (viewCount === 0) {
      console.log('⚠️  The atlas_public_view_in_public view is accessible but empty');
      console.log('   → You need to populate the view with data or check the view definition');
    } else {
      console.log('✅ The atlas_public_view_in_public view is working perfectly!');
      console.log(`   → Found ${viewCount} records ready to use`);
    }
    
    return null;
    
  } catch (error) {
    console.error('Script error:', error);
    return null;
  }
}

testAtlasPublicView(); 