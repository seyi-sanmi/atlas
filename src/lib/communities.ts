import { supabase, Community } from './supabase'

const VIEW_NAME = 'atlas_public_view_in_public';

// Fetch all communities from the public view
export async function getAllCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from(VIEW_NAME)
    .select('*')
    .order('name');

  if (error) {
    console.error(`Error fetching communities from ${VIEW_NAME}:`, error);
    throw error;
  }

  return data || [];
}

// Get starred communities
export async function getStarredCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from(VIEW_NAME)
    .select('*')
    .eq('starred_on_website', true)
    .order('name');

  if (error) {
    console.error(`Error fetching starred communities from ${VIEW_NAME}:`, error);
    throw error;
  }

  return data || [];
}

// Search communities by name, type, or research areas
export async function searchCommunities(query: string): Promise<Community[]> {
  if (!query.trim()) {
    return getAllCommunities()
  }

  const { data, error } = await supabase
    .from('atlas_public_view_in_public')
    .select('*')
    .or(`name.ilike.%${query}%,community_type.ilike.%${query}%,research_area_names.ilike.%${query}%,location_names.ilike.%${query}%`)
    .order('name')

  if (error) {
    console.error('Error searching communities in atlas_public_view_in_public:', error)
    // Fallback to the import table
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('atlas_communities_import')
      .select('*')
      .or(`name.ilike.%${query}%,community_type.ilike.%${query}%,research_area_names.ilike.%${query}%,location_names.ilike.%${query}%`)
      .order('name')
    
    if (fallbackError) {
      console.error('Search fallback also failed:', fallbackError)
      throw fallbackError
    }
    
    return fallbackData || []
  }

  return data || []
}

// Search and filter communities
export async function searchAndFilterCommunities(options: {
  query?: string;
  communityType?: string;
  location?: string;
  starred?: boolean;
}): Promise<Community[]> {
  let queryBuilder = supabase.from(VIEW_NAME).select('*');

  // Full-text search for the query
  if (options.query && options.query.trim()) {
    // A more robust FTS would be ideal here, but for now we'll use ilike on relevant fields.
    const searchConditions = [
      `name.ilike.%${options.query}%`,
      `purpose.ilike.%${options.query}%`,
      `target_members.ilike.%${options.query}%`,
      `community_information.ilike.%${options.query}%`
    ].join(',');
    queryBuilder = queryBuilder.or(searchConditions);
  }

  // Filter for arrays that contain a specific value
  if (options.communityType && options.communityType !== 'All Types') {
    queryBuilder = queryBuilder.contains('community_type', [options.communityType]);
  }

  if (options.location && options.location !== 'All Locations') {
    queryBuilder = queryBuilder.contains('location_names', [options.location]);
  }

  // Apply starred filter
  if (options.starred) {
    queryBuilder = queryBuilder.eq('starred_on_website', true);
  }
  
  queryBuilder = queryBuilder.order('name');

  const { data, error } = await queryBuilder;

  if (error) {
    console.error(`Error filtering communities from ${VIEW_NAME}:`, error);
    throw error;
  }

  return data || [];
}

// Get unique community types for the filter dropdown
export async function getUniqueCommunityTypes(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_unique_jsonb_array_text_values', {
    p_table_name: VIEW_NAME,
    p_column_name: 'community_type'
  });

  if (error) {
    console.error('Error fetching unique community types with RPC:', error);
    return [];
  }
  return data || [];
}

// Get unique locations for the filter dropdown
export async function getUniqueCommunityLocations(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_unique_jsonb_array_text_values', {
    p_table_name: VIEW_NAME,
    p_column_name: 'location_names'
  });

  if (error) {
    console.error('Error fetching unique locations with RPC:', error);
    return [];
  }
  return data || [];
} 