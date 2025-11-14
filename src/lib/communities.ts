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
  researchAreas?: string[];
  starred?: boolean;
}): Promise<Community[]> {
  try {
    let queryBuilder = supabase.from(VIEW_NAME).select('*');

    // Apply simple boolean filter
    if (options.starred) {
      queryBuilder = queryBuilder.eq('starred_on_website', true);
    }

    // Community type filter
    if (options.communityType && options.communityType !== 'All Types') {
      // Use 'cs' (contains) operator with a correctly formatted JSONB array literal
      queryBuilder = queryBuilder.filter(
        'community_type',
        'cs',
        JSON.stringify([options.communityType])
      );
    }

    // Location filter  
    if (options.location && options.location !== 'All Locations') {
      // Use 'cs' (contains) operator with a correctly formatted JSONB array literal
      queryBuilder = queryBuilder.filter(
        'location_names',
        'cs',
        JSON.stringify([options.location])
      );
    }

    // Research areas filter
    if (options.researchAreas && options.researchAreas.length > 0) {
      // Use 'cs' (contains) for a single area or 'cd' (contained by) if we want to match all.
      // Since we want to match ANY of the selected areas, we should use 'ov' (overlaps).
      queryBuilder = queryBuilder.filter(
        'research_area_names',
        'cs',
        JSON.stringify(options.researchAreas)
      );
    }

    // Text search
    if (options.query && options.query.trim()) {
      const searchTerm = `%${options.query.trim()}%`;
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchTerm},purpose.ilike.${searchTerm},target_members.ilike.${searchTerm},community_information.ilike.${searchTerm}`
      );
    }
    
    queryBuilder = queryBuilder.order('name');

    const { data, error } = await queryBuilder;

    if (error) {
      console.error(`Error filtering communities from ${VIEW_NAME}:`, error);
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Error in searchAndFilterCommunities:', error);
    // Fallback to all communities if filtering fails
    return getAllCommunities();
  }
}

// Get unique community types for the filter dropdown
export async function getUniqueCommunityTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_unique_jsonb_array_text_values', {
      p_table_name: VIEW_NAME,
      p_column_name: 'community_type'
    });

    if (error) {
      console.warn('RPC call failed, using fallback method:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.log('Using fallback method to get unique community types');
    
    // Fallback: Get all communities and extract unique types manually
    const { data, error: fallbackError } = await supabase
      .from(VIEW_NAME)
      .select('community_type');

    if (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      return [];
    }

    const uniqueTypes = new Set<string>();
    data?.forEach((community) => {
      if (Array.isArray(community.community_type)) {
        community.community_type.forEach((type) => {
          if (type && typeof type === 'string') {
            uniqueTypes.add(type);
          }
        });
      } else if (community.community_type && typeof community.community_type === 'string') {
        uniqueTypes.add(community.community_type);
      }
    });

    return Array.from(uniqueTypes).sort();
  }
}

// Get unique locations for the filter dropdown
export async function getUniqueCommunityLocations(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_unique_jsonb_array_text_values', {
      p_table_name: VIEW_NAME,
      p_column_name: 'location_names'
    });

    if (error) {
      console.warn('RPC call failed, using fallback method:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.log('Using fallback method to get unique locations');
    
    // Fallback: Get all communities and extract unique locations manually
    const { data, error: fallbackError } = await supabase
      .from(VIEW_NAME)
      .select('location_names');

    if (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      return [];
    }

    const uniqueLocations = new Set<string>();
    data?.forEach((community) => {
      if (Array.isArray(community.location_names)) {
        community.location_names.forEach((location) => {
          if (location && typeof location === 'string') {
            uniqueLocations.add(location);
          }
        });
      } else if (community.location_names && typeof community.location_names === 'string') {
        uniqueLocations.add(community.location_names);
      }
    });

    return Array.from(uniqueLocations).sort();
  }
} 

// Get unique research areas for the filter dropdown
export async function getUniqueResearchAreas(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_unique_jsonb_array_text_values', {
      p_table_name: VIEW_NAME,
      p_column_name: 'research_area_names'
    });

    if (error) {
      console.warn('RPC call failed, using fallback method:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.log('Using fallback method to get unique research areas');
    
    // Fallback: Get all communities and extract unique research areas manually
    const { data, error: fallbackError } = await supabase
      .from(VIEW_NAME)
      .select('research_area_names');

    if (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      return [];
    }

    const uniqueResearchAreas = new Set<string>();
    data?.forEach((community) => {
      if (Array.isArray(community.research_area_names)) {
        community.research_area_names.forEach((area) => {
          if (area && typeof area === 'string') {
            uniqueResearchAreas.add(area);
          }
        });
      } else if (community.research_area_names && typeof community.research_area_names === 'string') {
        uniqueResearchAreas.add(community.research_area_names);
      }
    });

    return Array.from(uniqueResearchAreas).sort();
  }
} 