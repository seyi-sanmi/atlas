# ATLAS Admin Panel - Complete Guide

## 🎉 Admin Panel Successfully Built!

Your comprehensive admin panel is now live and ready to use. This guide covers all features and how to use them.

## 🚀 Getting Started

### 1. Database Setup (REQUIRED)
First, run the SQL setup in your Supabase SQL Editor:

```sql
-- Run the complete ADMIN_SETUP.sql file
-- This creates all necessary tables, policies, and default data
```

**Important**: Update your admin role after running the SQL:
```sql
UPDATE profiles SET role = 'super_admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'seyi@renphil.org');
```

### 2. Access the Admin Panel
- Navigate to `/admin` or `/admin/dashboard`
- Only users with `admin` or `super_admin` roles can access
- Non-admin users are redirected to sign-in with an access denied message

---

## 📊 Dashboard Overview

**Path**: `/admin/dashboard`

### Key Metrics
- **Total Users**: All registered platform users
- **Total Events**: All events in the database
- **Upcoming Events**: Events scheduled for future dates  
- **Research Areas**: Active research interest areas
- **Hero Locations**: Cities featured in hero sections
- **Weekly Activity**: New events + new users this week

### Quick Actions
- Direct links to manage events, view users, and edit hero content
- Real-time statistics updated from database

---

## 📅 Event Management

**Path**: `/admin/events`

### Features
- **Search & Filter**: By title, description, organizer, city, platform, category
- **Bulk Operations**: Select multiple events for bulk deletion
- **Event Analytics**: Simple view/click counters for each event
- **Re-scraping**: Fetch fresh data from original Luma/Eventbrite URLs
- **Individual Actions**: Edit, delete, or re-scrape individual events

### Re-scraping Events
- Click the refresh icon next to any event with a URL
- Automatically fetches latest data from Luma/Eventbrite
- Updates title, description, date, time, location, categories
- Preserves analytics data and original event ID
- Logs all scraping attempts (success/failure)

### Bulk Delete Process
1. Select events using checkboxes
2. Click "Delete Selected" 
3. Type "DELETE" to confirm (security measure)
4. Bulk operation is logged for audit trail

### Event Analytics
- **Views**: How many times users viewed the event
- **Clicks**: How many times users clicked into the event URL
- Simple counters for basic engagement tracking

---

## 👥 User Management 

**Path**: `/admin/users`

### Features
- **View All Users**: Comprehensive list with profile information
- **Search & Filter**: By name, email, organization, location, role, activity
- **Activity Tracking**: Last activity, onboarding status
- **Engagement Metrics**: Event views and clicks per user
- **Role Display**: Visual badges for admin/super_admin roles

### User Information Displayed
- Profile details (name, email, avatar, location)
- Professional info (organization, job title)
- Research interests count
- Activity status (active/inactive periods)
- Engagement statistics
- Account creation date

### Activity Filters
- **Active (7 days)**: Users active in last week
- **Active (30 days)**: Users active in last month  
- **Inactive (30+ days)**: Users inactive for over a month

---

## 🏢 Community Management

**Path**: `/admin/communities`

### Airtable Integration
- **Embedded Interface**: Full Airtable view within admin panel
- **Direct Management**: Add, edit, delete communities in Airtable
- **Real-time Sync**: Changes automatically reflected on website
- **Starred Control**: Toggle `starred_on_website` field for prominence

### How to Use
1. Use embedded Airtable interface to manage community data
2. Toggle starred status to control website visibility
3. Fill research areas and locations for better filtering
4. Changes sync automatically - no manual refresh needed

### External Access
- Click "Open in new tab" for full Airtable experience
- All community data managed through Airtable integration

---

## 🌟 Hero Content Management

**Path**: `/admin/hero`

### Two Content Types

#### Research Areas
- Text-only items that appear in typewriter effect
- Examples: "Artificial Intelligence", "Biotechnology & Synthetic Biology"
- Control display order and active/inactive status

#### Locations  
- Cities with background images for hero sections
- Includes name, image URL, display order
- Examples: London, Oxford, Cambridge with scenic images

### Management Features
- **Add New**: Create research areas or locations
- **Edit Existing**: Update names, images, display order
- **Toggle Visibility**: Show/hide items without deleting
- **Reorder**: Set display order for proper sequencing
- **Delete**: Remove items completely (with confirmation)

### Location Image URLs
- Use high-quality Unsplash images (1200px width recommended)
- Example format: `https://images.unsplash.com/photo-...?w=1200&q=70`
- Images should be scenic/representative of the city

---

## 📝 Audit Logs

**Path**: `/admin/logs`

### What's Tracked
- **Event Management**: Create, update, delete, bulk delete, re-scrape
- **Hero Content**: Create, update, delete, toggle active status
- **User Actions**: Admin role changes, significant actions
- **System Events**: Failed operations, errors

### Log Information
- **Action**: Type of operation performed
- **Admin**: Email of admin who performed action
- **Details**: JSON data about what changed
- **Timestamp**: Exact date and time
- **Expandable Details**: Click to view full action metadata

### Filtering Options
- **Search**: Filter by admin email, action type, or details
- **Action Type**: Filter by specific actions (create, update, delete, etc.)
- **Admin**: Filter by specific admin user
- **Date Range**: Today, this week, this month, or all time

### Security Features
- **Immutable Logs**: Once created, logs cannot be modified
- **Detailed Tracking**: Complete audit trail of all admin actions
- **Performance Limit**: Shows recent 500 logs for optimal performance

---

## 🔐 Security & Access Control

### Role System
- **Super Admin**: Full access to all admin features
- **Admin**: Standard admin access (same as super admin currently)
- **User**: No admin access, redirected to sign-in

### Authentication Flow
1. User must be signed in with Supabase Auth
2. System checks user's `role` in profiles table
3. Non-admin users are redirected with access message
4. Admin navigation only visible to authorized users

### Row Level Security (RLS)
- All admin tables protected with RLS policies
- Only admin/super_admin roles can access admin data
- Audit logs require admin access to view
- Hero content has public read, admin write permissions

---

## 💡 Key Features Summary

### ✅ What's Built
1. **Complete Admin Dashboard** - Metrics and quick actions
2. **Event Management** - CRUD operations, re-scraping, bulk operations
3. **User Management** - View profiles, activity, engagement
4. **Community Management** - Embedded Airtable interface  
5. **Hero Content Management** - Research areas and locations
6. **Audit Logging** - Complete action tracking and history
7. **Role-based Access** - Secure admin-only access
8. **Simple Analytics** - Basic view/click tracking

### 🔄 Event Re-scraping
- **Source**: Uses original Luma/Eventbrite URLs
- **Data Updated**: Title, description, date, time, location, categories, AI categorization
- **Preserved**: Analytics data, event ID, user interactions
- **Logging**: All attempts logged (success/failure) in audit logs

### 📊 Analytics (Simple Counters)
- **Event Views**: Count of event page views
- **Event Clicks**: Count of clicks to external URLs
- **User Engagement**: Views/clicks per user in user management
- **Future**: Ready for Google Analytics integration when needed

### 🗑️ Bulk Delete Confirmation
- **Security**: Requires typing "DELETE" to confirm
- **Multi-select**: Checkbox selection of multiple events
- **Audit Trail**: All bulk operations logged with details
- **User Feedback**: Success/error messages for all operations

---

## 🚀 Next Steps

### Immediate Use
1. Run the `ADMIN_SETUP.sql` in Supabase
2. Set your role to `super_admin` using the SQL command
3. Navigate to `/admin` to access the admin panel
4. Start managing events, users, and content

### Future Enhancements
- **Analytics Integration**: Add Google Analytics for detailed tracking
- **Slack Integration**: Notifications for admin actions
- **Advanced Permissions**: Granular role permissions
- **Data Export**: CSV export functionality
- **Advanced Filtering**: Date ranges, custom filters

### Analytics Setup (Future)
The admin panel is ready for analytics integration. To add Google Analytics:
1. Set up Google Analytics property
2. Add tracking code to Next.js app
3. Update dashboard to show GA metrics
4. Replace simple counters with detailed analytics

---

## 🎯 Summary

You now have a **production-ready admin panel** with:

- **Professional Interface**: Clean, responsive design with dark mode
- **Complete CRUD Operations**: Full event and content management
- **Security**: Role-based access with audit logging
- **User Management**: Comprehensive user overview and analytics
- **Content Management**: Hero sections and community integration
- **Operational Tools**: Re-scraping, bulk operations, search/filter

The admin panel is **ready for immediate use** and provides all the functionality you requested for managing your ATLAS platform efficiently.

**Access the admin panel at**: `https://your-domain.com/admin` 