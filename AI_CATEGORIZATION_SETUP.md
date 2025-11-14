# AI Event Categorization System

## Overview

The AI Event Categorization System automatically analyzes imported event descriptions and categorizes them using OpenAI's GPT-3.5-turbo model. The system provides suggested event types and interest areas that users can review and edit before saving.

## Features

### ✅ **Real-time AI Categorization**
- Automatically analyzes event title and description during import
- Uses GPT-3.5-turbo for accurate categorization
- Provides structured JSON output with validation
- Retry logic with exponential backoff for reliability

### ✅ **User Review Interface**
- Shows AI suggestions in an editable interface
- Visual indicators for successful/failed categorization
- Ability to edit event type and remove interest area tags
- Clear distinction between AI suggestions and manual edits

### ✅ **Comprehensive Categories**
- **Event Types**: 9 predefined types (Meetup/Mixer, Workshop, Conference, etc.)
- **Interest Areas**: 32 research areas matching the communities page
- **Fallback Handling**: Defaults to "Other" type and empty areas on failure

## Database Schema Updates

Add these columns to your `events` table in Supabase:

```sql
-- Add AI categorization columns
ALTER TABLE events 
ADD COLUMN ai_event_type TEXT,
ADD COLUMN ai_interest_areas TEXT[],
ADD COLUMN ai_categorized BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_categorized_at TIMESTAMP WITH TIME ZONE;

-- Add import/platform columns (if not already present)
ALTER TABLE events 
ADD COLUMN luma_id TEXT,
ADD COLUMN eventbrite_id TEXT,
ADD COLUMN imported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN platform TEXT;

-- Add indexes for better performance
CREATE INDEX idx_events_ai_event_type ON events(ai_event_type);
CREATE INDEX idx_events_ai_categorized ON events(ai_categorized);
CREATE INDEX idx_events_platform ON events(platform);
```

## Environment Configuration

Add the OpenAI API key to your `.env.local` file:

```bash
# Existing keys
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
LUMA_API_KEY=your_luma_api_key
EVENTBRITE_API_KEY=your_eventbrite_api_key

# New: OpenAI API key for AI categorization
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting an OpenAI API Key

1. Visit [OpenAI API Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Go to API Keys section
4. Create a new secret key
5. Add credits to your account (pay-as-you-go)

## Cost Estimation

### GPT-3.5-turbo Pricing (as of 2024):
- **Input**: ~$0.0005 per 1K tokens
- **Output**: ~$0.0015 per 1K tokens
- **Average cost per event**: ~$0.0006-0.001 (less than $0.001 each)

### Monthly cost examples:
- **100 events/month**: ~$0.06-0.10
- **500 events/month**: ~$0.30-0.50  
- **1000 events/month**: ~$0.60-1.00

Very affordable for most use cases!

## Implementation Details

### Categorization Flow

1. **Event Import**: User enters Luma/Eventbrite URL
2. **Data Extraction**: System scrapes/fetches event data
3. **AI Analysis**: GPT-3.5-turbo analyzes title + description
4. **User Review**: AI suggestions shown in modal for editing
5. **Save**: Final data (with user edits) saved to database

### Event Types

The system categorizes events into one of these types:

- `Meetup / Mixer` - Social networking events
- `Workshop` - Hands-on learning sessions  
- `Conference` - Large-scale professional gatherings
- `Lecture` - Educational presentations
- `Panel Discussion` - Multi-speaker discussions
- `Fireside Chat` - Informal conversational sessions
- `Webinar` - Online presentations
- `Hackathon` - Coding competitions/events
- `Other` - Fallback for unclassified events

### Interest Areas

32 research areas matching your communities page:

- Biotechnology & Synthetic Biology
- Genetics & Genomics
- Healthcare & Medicine
- Longevity & Aging
- Biosecurity & Biodefense
- Neuroscience
- Materials Science & Engineering
- Quantum Computing
- Robotics & AI
- Nanotechnology
- Space & Astronomy
- Neurotechnology
- Climate & Atmospheric Science
- Renewable Energy
- Ocean & Marine Science
- Conservation Biology
- Agriculture & Food Systems
- Environmental Health
- Artificial Intelligence
- Machine Learning
- Bioinformatics
- Chemoinformatics
- High-Performance Computing
- Data Analytics
- Natural Language Processing
- Biochemistry
- Chemistry
- Physics
- Biology
- Mathematics
- Photonics
- Computer Vision

## Error Handling

### Robust Failure Management

1. **API Failures**: Automatic retry with exponential backoff
2. **Network Issues**: Graceful degradation to default categories
3. **Invalid Responses**: JSON validation and filtering
4. **Rate Limiting**: Built-in retry logic respects OpenAI limits

### Fallback Behavior

When AI categorization fails:
- `ai_event_type` defaults to "Other"
- `ai_interest_areas` defaults to empty array `[]`
- `ai_categorized` set to `false`
- `ai_categorized_at` still recorded for debugging

## User Interface Features

### Visual Indicators

- **✓ Analyzed**: Green badge when AI categorization succeeds
- **✗ Failed**: Red badge when AI categorization fails  
- **🤖 AI categorization completed**: Success message in import modal
- **⚠️ AI categorization failed**: Warning message for failures

### Editing Interface

- **Event Type**: Dropdown selector with all 9 types
- **Interest Areas**: Tag-based interface with remove buttons
- **Real-time Updates**: Changes immediately reflected in preview
- **Clear Labels**: Visual distinction between AI suggestions and user fields

## Testing

### Test the System

1. **Import a Luma Event**: Use any `lu.ma` URL
2. **Import an Eventbrite Event**: Use any `eventbrite.com` URL  
3. **Check AI Results**: Review suggested categories in modal
4. **Edit Suggestions**: Modify event type and remove/add interest areas
5. **Verify Database**: Check `ai_categorized` and related fields

### Example Test Events

**Tech Event**: Should categorize as "Workshop" or "Conference" with areas like "Artificial Intelligence", "Machine Learning"

**Health Event**: Should categorize with areas like "Healthcare & Medicine", "Biotechnology & Synthetic Biology"

**Academic Event**: Should categorize as "Lecture" or "Conference" with relevant research areas

## Monitoring & Analytics

### Database Queries

Check AI categorization success rate:
```sql
SELECT 
  ai_categorized,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM events 
WHERE ai_categorized_at IS NOT NULL
GROUP BY ai_categorized;
```

View most common AI event types:
```sql
SELECT 
  ai_event_type,
  COUNT(*) as count
FROM events 
WHERE ai_categorized = true
GROUP BY ai_event_type
ORDER BY count DESC;
```

Most popular AI interest areas:
```sql
SELECT 
  unnest(ai_interest_areas) as interest_area,
  COUNT(*) as count
FROM events 
WHERE ai_categorized = true
GROUP BY interest_area
ORDER BY count DESC;
```

## Future Enhancements

### Potential Improvements

1. **Local Models**: Consider using local LLMs for cost reduction
2. **Fine-tuning**: Train on your specific event data for better accuracy
3. **Batch Processing**: Bulk categorize existing events
4. **Confidence Scores**: Add AI confidence levels to suggestions
5. **User Feedback**: Learn from user edits to improve prompts

### Advanced Features

- **Auto-categorization**: Option to auto-save AI suggestions without review
- **Category Analytics**: Track which categories are most common
- **Accuracy Metrics**: Measure how often users accept AI suggestions
- **Custom Categories**: Allow users to define custom event types/areas

---

## Quick Start

1. **Update Database**: Run the SQL commands above in Supabase
2. **Add API Key**: Set `OPENAI_API_KEY` in your `.env.local`
3. **Import Event**: Use the import modal with any Luma/Eventbrite URL
4. **Review**: Check the AI suggestions in the blue-highlighted section
5. **Save**: Confirm the event with your edits

The system is now ready to provide intelligent event categorization! 🚀 