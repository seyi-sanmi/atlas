# ATLAS Website

A modern event discovery platform built with Next.js 15, TypeScript, and Supabase.

## Features

- **Event Discovery**: Browse and filter events by location, category, and date
- **Multi-Platform Import**: Import events from Luma and Eventbrite
- **Responsive Design**: Mobile-first design with floating filter button
- **Real-time Updates**: Live event data with caching optimization
- **Analytics**: Vercel Analytics integration

## Event Import Support

The platform supports importing events from multiple sources:

### Supported Platforms

1. **Luma (lu.ma)**
   - URL format: `https://lu.ma/event-slug`
   - API: Luma Public API v1

2. **Eventbrite**
   - URL format: `https://www.eventbrite.com/e/event-name-tickets-123456789`
   - API: Eventbrite API v3

### Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys for Event Import
LUMA_API_KEY=your_luma_api_key_here
EVENTBRITE_API_KEY=your_eventbrite_oauth_token_here

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS=true
```

### Getting API Keys

**Luma API Key:**
1. Sign in to your Luma account
2. Go to Developer Settings
3. Generate a new API key

**Eventbrite API Key:**
1. Sign in to your Eventbrite account
2. Go to Account Settings > Developer Links > API Keys
3. Create a new app and get your OAuth token

### Database Schema Updates

The following columns should be added to your `events` table in Supabase:

```sql
-- Add columns for imported events
ALTER TABLE events 
ADD COLUMN luma_id TEXT,
ADD COLUMN eventbrite_id TEXT,
ADD COLUMN imported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN platform TEXT;

-- Add indexes for better performance
CREATE INDEX idx_events_luma_id ON events(luma_id);
CREATE INDEX idx_events_eventbrite_id ON events(eventbrite_id);
CREATE INDEX idx_events_platform ON events(platform);
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## API Rate Limits

- **Luma API**: 1000 calls per hour per token
- **Eventbrite API**: 1000 calls per hour, 48,000 calls per day per token

## Architecture

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
