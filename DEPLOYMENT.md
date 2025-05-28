# ATLAS Events - Deployment Guide

## Step 1: Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new account
2. Create a new project
3. Go to the SQL Editor in your Supabase dashboard
4. Run the SQL from `supabase-schema.sql` to create the events table and set up the database structure
5. Go to Settings > API to get your project URL and anon key

## Step 2: Configure Environment Variables

1. Copy `env.example` to `.env`
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 3: Test Locally

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Test adding events to make sure Supabase connection works

## Step 4: Deploy to Vercel (Recommended)

### Option A: Deploy via GitHub (Recommended)

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. In the project settings, add your environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Add environment variables via the Vercel dashboard

## Step 5: Set up Backend API (Optional)

For the event scraping functionality, you'll need to deploy the backend:

1. Create a separate repository for your backend (server.js, LumaScraper.js)
2. Deploy it to a service like Railway, Render, or Heroku
3. Update the Vite proxy configuration in `vite.config.ts` to point to your deployed backend
4. Or use Vercel's API routes by moving your backend files to an `api/` directory

## Alternative Deployment Options

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Railway
1. Connect your GitHub repository to Railway
2. Railway will auto-detect and deploy your React app
3. Add environment variables in Railway dashboard

### Traditional Hosting
1. Run `npm run build`
2. Upload the `dist/` folder contents to your web hosting provider
3. Make sure to configure redirects for single-page application routing

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Security Notes

- The anon key is safe to expose in client-side code
- Row Level Security (RLS) is enabled on the events table
- Consider adding authentication later for admin features
- Review the public access policies in the SQL schema before production use 