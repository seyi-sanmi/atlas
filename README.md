# ATLAS Events

A modern events website built with React, TypeScript, and Tailwind CSS, featuring event scraping capabilities and Supabase integration.

## Features

- 🎯 Clean, modern UI with dark/light theme support
- 📅 Event listing with date-based organization
- 🔍 Real-time search functionality
- 🌐 Event scraping from Lu.ma and other platforms
- 💾 Persistent data storage with Supabase
- 📱 Responsive design
- 🎨 Sticky navigation and date headers

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase (see DEPLOYMENT.md)
4. Copy `env.example` to `.env` and add your Supabase credentials
5. Start development server: `npm run dev`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
- **Vercel**: Connect GitHub repo, add environment variables, deploy
- **Netlify**: Connect GitHub repo, set build command to `npm run build`
- **Railway**: Connect GitHub repo, auto-deploy

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)
- **Scraping**: Node.js backend with Cheerio
