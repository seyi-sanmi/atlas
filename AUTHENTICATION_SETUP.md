# ATLAS Authentication System Setup Guide

## 🎉 Implementation Complete!

Your authentication system has been successfully implemented with the following features:

- ✅ **Email authentication** (sign in/sign up)
- ✅ **Google OAuth** (ready to configure)
- ✅ **LinkedIn OAuth** (ready to configure)
- ✅ **User profiles** with event tracking
- ✅ **Dedicated sign-in page** (`/auth/signin`)
- ✅ **Event personalization tracking**
- ✅ **Responsive design** matching your ATLAS theme

## 📋 Next Steps

### 1. Set Up Supabase Profiles Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table for user data and event tracking
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  
  -- Basic profile information
  full_name TEXT,
  avatar_url TEXT,
  
  -- Optional professional information
  organization TEXT,
  job_title TEXT,
  location TEXT,
  linkedin_url TEXT,
  
  -- Research interests for personalization
  research_interests TEXT[], -- Array of research areas
  
  -- Event tracking for personalization
  event_views JSONB DEFAULT '[]'::jsonb, -- Track events user has viewed
  event_clicks JSONB DEFAULT '[]'::jsonb, -- Track events user has clicked into
  community_interests JSONB DEFAULT '[]'::jsonb, -- Track communities user is interested in
  preferred_categories TEXT[], -- User's preferred event categories
  
  -- Personalization metadata
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX profiles_organization_idx ON profiles(organization);
CREATE INDEX profiles_location_idx ON profiles(location);
CREATE INDEX profiles_research_interests_idx ON profiles USING GIN(research_interests);
CREATE INDEX profiles_last_activity_idx ON profiles(last_activity_at);
```

### 2. Test Email Authentication

Your email authentication is ready to use immediately:

1. Visit `/auth/signin` 
2. Try creating an account with email
3. Check your email for confirmation
4. Sign in with your credentials

### 3. Configure OAuth Providers (Optional)

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. In Supabase Dashboard > Authentication > Providers:
   - Enable Google
   - Add your Client ID and Client Secret

#### LinkedIn OAuth Setup:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase Dashboard > Authentication > Providers:
   - Enable LinkedIn
   - Add your Client ID and Client Secret

## 🏗️ Implementation Details

### Files Created/Modified:

**Authentication Core:**
- `src/lib/auth.tsx` - Authentication context and hooks
- `src/app/auth/signin/page.tsx` - Dedicated sign-in page
- `src/app/auth/callback/route.ts` - OAuth callback handler

**Components:**
- `src/components/auth/SignInButton.tsx` - Sign-in button for header
- `src/components/auth/UserMenu.tsx` - User menu with profile options
- `src/components/auth/SignInModal.tsx` - Modal (if needed later)
- `src/components/auth/SignUpModal.tsx` - Modal (if needed later)
- `src/components/auth/AuthModal.tsx` - Modal container

**User Tracking:**
- `src/lib/user-tracking.ts` - Event tracking for personalization
- `supabase-profiles-setup.sql` - Database schema

**Integration:**
- `src/components/event/header.tsx` - Added auth to navigation
- `src/app/layout.tsx` - Added AuthProvider

### Features Available:

1. **User Authentication:**
   - Email sign-up/sign-in
   - OAuth with Google/LinkedIn (when configured)
   - Automatic profile creation
   - Session management

2. **User Profiles:**
   - Basic info (name, avatar, email)
   - Professional info (organization, job title, location, LinkedIn)
   - Research interests
   - Event tracking for personalization

3. **Event Tracking:**
   ```tsx
   import { trackEventView, trackEventClick } from '@/lib/user-tracking'
   
   // Track when user views an event
   trackEventView(event.id, event.title, event.categories)
   
   // Track when user clicks into an event 
   trackEventClick(event.id, event.title, event.categories)
   ```

4. **User Preferences:**
   ```tsx
   import { getUserPreferences } from '@/lib/user-tracking'
   
   const preferences = await getUserPreferences()
   // Returns: preferredCategories, researchInterests, trendingCategories, etc.
   ```

## 🎨 Design Integration

The authentication system perfectly matches your ATLAS design:

- **Color scheme:** Uses your gradient (`#AE3813` to `#D45E3C`)
- **Typography:** Matches your `font-display` and `font-sans`
- **Components:** Consistent with your modal and button patterns
- **Theme support:** Works with your dark/light mode
- **Responsive:** Mobile-first design like your existing components

## 🔧 Usage Examples

### Check Authentication Status:
```tsx
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Welcome, {user.email}!</div>
}
```

### Track User Events:
```tsx
import { trackEventClick } from '@/lib/user-tracking'

function EventCard({ event }) {
  const handleClick = () => {
    trackEventClick(event.id, event.title, event.categories)
    // Navigate to event details
  }
  
  return <button onClick={handleClick}>View Event</button>
}
```

### Update User Profile:
```tsx
import { updateUserProfile } from '@/lib/user-tracking'

const result = await updateUserProfile({
  full_name: "Dr. Jane Smith",
  organization: "Imperial College London",
  job_title: "Research Scientist",
  research_interests: ["AI", "Machine Learning", "Neuroscience"]
})
```

## 🚀 Future Enhancements

With this foundation, you can easily add:

1. **Personalized recommendations** based on user event history
2. **User onboarding flow** to collect preferences
3. **Profile settings page** for users to manage their info
4. **Event bookmarks/favorites** functionality
5. **Email notifications** for recommended events
6. **Community-based recommendations**

## 🎯 Ready to Use!

Your authentication system is now live and ready! Users can:

1. **Sign up** at `/auth/signin?mode=signup`
2. **Sign in** at `/auth/signin`
3. **Access** all features immediately
4. **Be tracked** for future personalization

The sign-in button is now visible in your header for non-authenticated users, and authenticated users will see their profile menu.

---

## 📞 Support

If you need any adjustments or have questions about the implementation, just let me know! 