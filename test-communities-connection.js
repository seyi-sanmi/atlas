const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCommunitiesConnection() {
  try {
    console.log('Testing communities connection with fallback mechanism...\n');
    
    // Test 1: Try atlas_public_view_in_public first
    console.log('1. Testing atlas_public_view_in_public...');
    const { data: viewData, error: viewError } = await supabase
      .from('atlas_public_view_in_public')
      .select('*')
      .limit(3);
      
    if (viewError) {
      console.log(`   ❌ Error: ${viewError.message} (Code: ${viewError.code})`);
      
      // Test 2: Fallback to atlas_communities_import
      console.log('\n2. Falling back to atlas_communities_import...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('atlas_communities_import')
        .select('*')
        .limit(3);
        
      if (fallbackError) {
        console.log(`   ❌ Fallback Error: ${fallbackError.message} (Code: ${fallbackError.code})`);
        console.log('\n❌ BOTH SOURCES FAILED - No community data available');
        return null;
      } else {
        console.log(`   ✅ Fallback Success: Found ${fallbackData?.length || 0} records`);
        if (fallbackData && fallbackData.length > 0) {
          console.log(`   Sample community: ${fallbackData[0].Name || fallbackData[0].name || 'Unknown'}`);
        }
        return { source: 'atlas_communities_import', data: fallbackData };
      }
    } else {
      console.log(`   ✅ Success: Found ${viewData?.length || 0} records`);
      if (viewData && viewData.length > 0) {
        console.log(`   Sample community: ${viewData[0].Name || viewData[0].name || 'Unknown'}`);
      }
      return { source: 'atlas_public_view_in_public', data: viewData };
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    return null;
  }
}

// Test the specific functions from our communities library
async function testCommunityFunctions() {
  console.log('\n3. Testing individual community functions...\n');
  
  // Simulate the getAllCommunities function logic
  try {
    console.log('Testing getAllCommunities logic:');
    
    // First try the view
    const { data: viewData, error: viewError } = await supabase
      .from('atlas_public_view_in_public')
      .select('*')
      .order('Name');
      
    if (viewError) {
      console.log(`   View failed: ${viewError.message}`);
      console.log('   Attempting fallback...');
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('atlas_communities_import')
        .select('*')
        .order('Name');
      
      if (fallbackError) {
        console.log(`   ❌ Fallback failed: ${fallbackError.message}`);
        throw new Error(`Unable to access community data. View error: ${viewError.message}, Fallback error: ${fallbackError.message}`);
      } else {
        console.log(`   ✅ Fallback success: ${fallbackData?.length || 0} communities`);
        return fallbackData;
      }
    } else {
      console.log(`   ✅ View success: ${viewData?.length || 0} communities`);
      return viewData;
    }
    
  } catch (error) {
    console.log(`   ❌ Function test failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  const result = await testCommunitiesConnection();
  
  if (result) {
    console.log(`\n✅ SUCCESS: Communities can be loaded from ${result.source}`);
    
    // Test the function logic
    try {
      const functionResult = await testCommunityFunctions();
      console.log(`✅ Function test passed: ${functionResult?.length || 0} communities loaded`);
    } catch (error) {
      console.log(`❌ Function test failed: ${error.message}`);
    }
  } else {
    console.log('\n❌ FAILURE: No community data source is accessible');
    console.log('\nPossible solutions:');
    console.log('1. Check Supabase permissions for atlas_public_view_in_public');
    console.log('2. Verify atlas_communities_import table access');
    console.log('3. Check environment variables (.env.local)');
    console.log('4. Verify Supabase project is running');
  }
}

main(); 