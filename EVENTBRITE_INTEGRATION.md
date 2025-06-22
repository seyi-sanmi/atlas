# Multi-Platform Event Import Integration

## Overview

The ATLAS website now supports importing events from both **Luma** and **Eventbrite** platforms through a unified import system, with city-based location filtering.

## Implementation Details

### 1. Platform Detection

The system automatically detects the platform based on the URL:

- **Luma**: `lu.ma` domain
- **Eventbrite**: `eventbrite.com` or `www.eventbrite.com` domain

### 2. URL Parsing

**Luma URLs:**
```
https://lu.ma/event-slug
https://lu.ma/xyz123
```

**Eventbrite URLs:**
```
https://www.eventbrite.com/e/event-name-tickets-123456789
https://eventbrite.com/e/event-name-tickets-123456789
```

### 3. API Integration

**Luma API:**
- Endpoint: `https://api.lu.ma/public/v1/event/{eventId}`
- Authentication: `x-luma-api-key` header
- City extraction: Multiple fallback strategies for location parsing

**Eventbrite API:**
- Endpoint: `https://www.eventbriteapi.com/v3/events/{eventId}/?expand=venue,organizer`
- Authentication: `Bearer {token}` in Authorization header
- City extraction: `venue.address.city` field

### 4. Data Extraction

**Common Fields:**
- Title, Description, Date, Time
- Location (venue name)
- **City** (for filtering purposes)
- Organizer, Categories
- Platform-specific IDs

**City Extraction Logic:**
- **Eventbrite**: Uses `venue.address.city` (e.g., "Glasgow")
- **Luma**: Multiple fallback strategies:
  - `location.city`
  - `location.address.city` 
  - Parse from location string patterns
- **Online Events**: Marked as "Online"
- **Fallback**: "TBD" if city cannot be determined

## Database Schema Updates

### Required SQL Commands

Add the city column to your events table:

```sql
-- Add city column for location filtering
ALTER TABLE events ADD COLUMN city VARCHAR(100);

-- Add index for better filtering performance
CREATE INDEX idx_events_city ON events(city);

-- Update existing events (optional - set to TBD for existing records)
UPDATE events SET city = 'TBD' WHERE city IS NULL;
```

### Updated Event Schema

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE,
  time VARCHAR(50),
  location VARCHAR(255),
  city VARCHAR(100),  -- NEW: For city-based filtering
  categories TEXT[],
  organizer VARCHAR(255),
  url VARCHAR(500),
  
  -- Platform-specific fields
  luma_id VARCHAR(100),
  eventbrite_id VARCHAR(100),
  imported_at TIMESTAMP,
  platform VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Configuration

Add these environment variables to your `.env.local`:

```bash
# API Keys for Event Import
LUMA_API_KEY=your_luma_api_key_here
EVENTBRITE_API_KEY=your_eventbrite_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Filter Logic Updates

The location filter now uses city-based filtering instead of full venue names:

- **Before**: Filter by full venue name (e.g., "University of Glasgow")
- **After**: Filter by city (e.g., "Glasgow")
- **Benefits**: 
  - Groups events from the same city together
  - More intuitive filtering for users
  - Better performance with indexed city column

## Testing

### Test Eventbrite Import:
1. Use URL: `https://www.eventbrite.com/e/event-name-tickets-123456789`
2. Expected city extraction: From `venue.address.city`
3. Example: "Glasgow" from University of Glasgow events

### Test Luma Import:
1. Use URL: `https://lu.ma/event-slug`
2. Expected city extraction: Multiple fallback strategies
3. Handles various Luma location formats

## Error Handling

- **Invalid URLs**: Clear error messages for unsupported platforms
- **API Failures**: Specific error codes (404, 401, rate limits)
- **Missing Data**: Graceful fallbacks for missing city information
- **Duplicate Events**: Prevents importing the same event twice

## Performance Considerations

- **API Caching**: Implement caching for frequently accessed events
- **Database Indexing**: City column is indexed for fast filtering
- **Rate Limiting**: Respect API rate limits for both platforms
- **Batch Processing**: Consider batch imports for large datasets

## Key Features

### 1. Unified Import Function

```typescript
// Single function handles both platforms
const result = await importEvent(eventUrl);
```

### 2. Duplicate Detection

The system checks for existing events using:
- Original URL
- Platform-specific ID (luma_id or eventbrite_id)

### 3. Error Handling

Comprehensive error handling for:
- Invalid URLs
- API authentication errors
- Network timeouts
- Event not found (404)
- Rate limiting

### 4. Platform-Specific Features

**Luma Integration:**
- Extracts event slug from URL path
- Handles location data from venue object
- Supports organizer information

**Eventbrite Integration:**
- Extracts numeric event ID from URL
- Handles complex venue/address data
- Supports online events
- Processes HTML descriptions

## Database Schema

New columns added to the `events` table:

```sql
ALTER TABLE events 
ADD COLUMN luma_id TEXT,
ADD COLUMN eventbrite_id TEXT,
ADD COLUMN imported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN platform TEXT;

-- Indexes for performance
CREATE INDEX idx_events_luma_id ON events(luma_id);
CREATE INDEX idx_events_eventbrite_id ON events(eventbrite_id);
CREATE INDEX idx_events_platform ON events(platform);
```

## User Interface Updates

### Import Modal Changes

1. **Title**: Changed from "Import Event from Luma" to "Import Event"
2. **Label**: Changed from "Luma Event URL" to "Event URL"
3. **Help Text**: Added "Supports Luma (lu.ma) and Eventbrite events"
4. **Placeholder**: Updated to show both URL formats
5. **Error Messages**: Generic platform-agnostic messages

### Success Messages

Dynamic success messages indicate the source platform:
- "Event details imported successfully from Luma. Please review and save."
- "Event details imported successfully from Eventbrite. Please review and save."

## Testing

### Test URLs

**Luma (if you have access):**
```
https://lu.ma/your-test-event
```

**Eventbrite (public events):**
```
https://www.eventbrite.com/e/sample-event-tickets-123456789
```

### Error Scenarios

1. **Invalid URL format**
2. **Unsupported platform**
3. **Missing API keys**
4. **Event not found**
5. **Duplicate import**
6. **API rate limiting**

## Benefits

1. **Unified Experience**: Single import flow for multiple platforms
2. **Extensible**: Easy to add more platforms in the future
3. **Robust**: Comprehensive error handling and validation
4. **Performance**: Efficient duplicate detection
5. **User-Friendly**: Clear feedback and guidance

## Future Enhancements

1. **Additional Platforms**: Facebook Events, Meetup, etc.
2. **Batch Import**: Import multiple events at once
3. **Auto-Sync**: Periodic updates from source platforms
4. **Enhanced Mapping**: More sophisticated category mapping
5. **Image Import**: Import event images from platforms

## API Documentation References

- [Luma API Documentation](https://lu.ma/api-docs)
- [Eventbrite API Documentation](https://www.eventbrite.com/platform/api) 