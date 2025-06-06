# ATLAS Events Website

A modern React/TypeScript events platform with real-time event scraping capabilities from Lu.ma and other platforms.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher) 
- **npm** or **yarn**

### 1. Clone & Install
```bash
git clone <repository-url>
cd "ATLAS Website"
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your Supabase credentials (optional)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Python Dependencies (for scraping)
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
# Terminal 1: Start the backend server (port 3001)
node server.js

# Terminal 2: Start the frontend (port 5173)
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🏗️ Technical Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js server with event scraping API
- **Database**: Dual storage (In-memory + Supabase PostgreSQL)
- **Scraping**: Python scripts + JavaScript scraper integration
- **Icons**: Lucide React
- **Styling**: Custom dark theme with `#131318` background

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── EventsList.tsx   # Main events grid
│   ├── EventDetails.tsx # Split-view event panel
│   ├── Header.tsx       # Navigation header
│   └── ...
├── data/               # Data management
│   ├── eventStore.ts   # In-memory storage
│   └── supabaseEventStore.ts # Database storage
├── utils/              # Utility functions
└── lib/                # Third-party integrations

Backend Files:
├── server.js           # Express server with scraping API
├── LumaScraper.js      # JavaScript event scraper
├── luma_scraper.py     # Python Lu.ma scraper
└── scrape_event.py     # Generic Python scraper
```

## 🎨 Key Features

### 1. **Dark Theme UI**
- Custom `#131318` background color
- Responsive design with Tailwind CSS
- Clean, borderless search interface

### 2. **Split View Layout**
- Events list on left, details panel on right
- Smooth animations and transitions
- Responsive header alignment

### 3. **Event Scraping**
- Supports Lu.ma URLs and other event platforms
- Real-time data extraction via API endpoints
- Review system before adding events

### 4. **Dual Storage System**
- **In-memory**: Default, immediate availability
- **Supabase**: Optional database storage with toggle
- Graceful fallback between storage types

### 5. **Search & Filtering**
- Real-time search across title, location, organizer
- Filter dropdown (cities)
- Responsive search bar sizing

## 🔧 Development Commands

```bash
# Frontend development
npm run dev              # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Backend
node server.js          # Start Express server

# Python scraping (standalone)
python luma_scraper.py  # Direct Lu.ma scraping
python scrape_event.py  # Generic event scraping
```

## 🗄️ Database Configuration

### Supabase Setup (Optional)
1. Create a Supabase project
2. Run the SQL schema: `supabase-schema.sql`
3. Add credentials to `.env` file
4. Use the database toggle in the header

### Schema Overview
```sql
events (
  id: uuid PRIMARY KEY
  title: text
  description: text
  location: text
  organizer: text
  presented_by: text
  date: date
  time: text
  categories: text[]
  url: text
  links: text[]
  created_at: timestamp
)
```

## 🎯 Current State & Working Features

✅ **Working:**
- Frontend running on localhost:5173
- Backend API on localhost:3001
- Event scraping from Lu.ma URLs
- Split-view responsive layout
- Dark theme with custom colors
- Search functionality
- Database storage toggle
- Smooth animations

✅ **Recently Completed:**
- Removed related links section from EventDetails
- Fixed header alignment between events list and detail panel
- Implemented responsive search bar sizing
- Added borderless, clean search interface
- Custom dark theme with `#131318` background

## 🐛 Known Issues & TODOs

- [ ] Filter dropdown functionality (currently UI-only)
- [ ] Map view implementation (placeholder)
- [ ] Database view implementation (placeholder)
- [ ] Category system refinement
- [ ] Error handling improvements

## 🚀 Deployment

The project includes:
- **Vercel configuration**: `vercel.json`
- **Deployment guide**: `DEPLOYMENT.md`
- **Environment examples**: `env.example`

## 📝 Making Changes

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Maintain responsive design patterns
- Keep dark theme consistency

### Testing Changes
1. Test both storage systems (in-memory + Supabase)
2. Verify responsive layout in split view
3. Test event scraping with Lu.ma URLs
4. Check search functionality

### Common File Locations
- **UI Components**: `src/components/`
- **Styling**: `src/index.css` + Tailwind classes
- **API Endpoints**: `server.js`
- **Data Management**: `src/data/`
- **Theme Config**: `tailwind.config.js`

## 🤝 Freelancer Notes

This codebase is well-structured and currently functional. The main areas for potential enhancement are:
1. Completing filter dropdown functionality
2. Implementing Map and Database views
3. Enhancing the event scraping for additional platforms
4. UI/UX improvements and animations

All major infrastructure is in place - focus can be on features and refinements rather than foundational work.
