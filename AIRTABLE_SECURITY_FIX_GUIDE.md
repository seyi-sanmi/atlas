# Airtable-Supabase Integration Security Fix Guide

## 🚨 Current Issues

Your communities page isn't working due to security issues with the Airtable-Supabase integration:

1. **SECURITY DEFINER View** - The view `public.atlas_public_view_in_public` bypasses Row Level Security (RLS)
2. **Foreign Table Exposed** - The foreign table `airtable.atlas_public_view` is accessible via APIs without RLS protection
3. **Data Access Issues** - The communities page can't fetch data properly

## 📊 Current Architecture

```
Airtable → Foreign Data Wrapper → Foreign Table (airtable.atlas_public_view)
                                        ↓
                            View (public.atlas_public_view_in_public) [SECURITY DEFINER ⚠️]
                                        ↓
                            Communities Page (queries the view)
```

## ✅ Solutions

### Option 1: Quick Security Fix (Recommended First Step)
**File:** `fix_airtable_security_issues.sql`

**What it does:**
- Removes SECURITY DEFINER from the view
- Ensures the foreign table stays in the `airtable` schema (not exposed via API)
- Grants proper permissions to the view
- Maintains backward compatibility with your existing code

**Pros:**
- ✅ Quick fix (5 minutes)
- ✅ No code changes needed
- ✅ Resolves security warnings
- ✅ Minimal disruption

**Cons:**
- ⚠️ Still relies on Foreign Data Wrapper
- ⚠️ Performance depends on Airtable connection
- ⚠️ Limited control over data structure

**How to apply:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `fix_airtable_security_issues.sql`
3. Run the script
4. Test your communities page

---

### Option 2: Migrate to Native Table (Best Long-term Solution)
**File:** `migrate_airtable_to_native_table.sql`

**What it does:**
- Creates a native `communities` table in Supabase
- Migrates existing data from Airtable
- Sets up proper RLS policies
- Creates a sync function to keep data updated
- Maintains backward compatibility with a view

**Pros:**
- ✅ Complete security control with RLS
- ✅ Better performance (native PostgreSQL)
- ✅ Full data control
- ✅ Can add custom features/fields
- ✅ Proper audit trail
- ✅ No code changes needed (uses view for compatibility)

**Cons:**
- ⚠️ Requires setting up data sync (manual or automated)
- ⚠️ Takes longer to implement (30 minutes)
- ⚠️ Need to manage two sources of truth (Airtable + Supabase)

**How to apply:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `migrate_airtable_to_native_table.sql`
3. Run the script
4. Choose a sync strategy (see below)
5. Test your communities page

---

## 🔄 Data Sync Options (For Option 2)

### 1. Manual Sync
Run this in Supabase SQL Editor whenever you update Airtable:
```sql
SELECT * FROM sync_communities_from_airtable();
```

### 2. Scheduled Sync (Requires pg_cron extension)
Uncomment the cron section in the migration script to sync every hour automatically.

### 3. Webhook-based Sync (Most Real-time)
1. Create a Supabase Edge Function to sync data
2. Set up an Airtable webhook to call the function when data changes
3. Most real-time but requires additional setup

### 4. Admin Panel Sync Button
Add a "Sync from Airtable" button to your admin panel that calls the sync function.

---

## 📝 Recommended Implementation Plan

### Phase 1: Immediate Fix (Today)
1. ✅ Run `fix_airtable_security_issues.sql` to resolve security warnings
2. ✅ Test communities page
3. ✅ Verify no security warnings in Supabase

### Phase 2: Long-term Solution (This Week)
1. ✅ Run `migrate_airtable_to_native_table.sql`
2. ✅ Set up manual sync process
3. ✅ Test thoroughly
4. ✅ Add sync button to admin panel (optional)

### Phase 3: Automation (Future)
1. ✅ Set up automatic sync (cron or webhook)
2. ✅ Consider phasing out Airtable for community management
3. ✅ Use Supabase as primary data source

---

## 🧪 Testing After Implementation

### Test Queries (Run in Supabase SQL Editor)

```sql
-- Test 1: Verify view exists
SELECT COUNT(*) FROM public.atlas_public_view_in_public;

-- Test 2: Check sample data
SELECT name, community_type, location_names 
FROM public.atlas_public_view_in_public 
LIMIT 5;

-- Test 3: Test filtering (like your app does)
SELECT * FROM public.atlas_public_view_in_public 
WHERE starred_on_website = true;

-- Test 4: Check no security definer (should return 0 rows)
SELECT * FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'atlas_public_view_in_public'
AND definition ILIKE '%security definer%';
```

### Test in Application

1. Navigate to `/communities`
2. Verify communities load
3. Test filters (location, community type, research areas)
4. Test search functionality
5. Check browser console for errors

---

## 🔍 Troubleshooting

### Issue: "relation does not exist"
**Solution:** The foreign table or view wasn't created properly. Check:
- Is the Airtable FDW extension installed?
- Does `airtable.atlas_public_view` exist?
- Run: `SELECT * FROM information_schema.foreign_tables;`

### Issue: "permission denied"
**Solution:** The anon role doesn't have SELECT permission. Run:
```sql
GRANT SELECT ON public.atlas_public_view_in_public TO anon;
GRANT SELECT ON public.atlas_public_view_in_public TO authenticated;
```

### Issue: Communities page is empty
**Solution:** Check:
1. Does the view have data? `SELECT COUNT(*) FROM public.atlas_public_view_in_public;`
2. Check browser console for API errors
3. Verify Supabase connection in `.env.local`
4. Check Airtable FDW connection is working

### Issue: Security warnings still appear
**Solution:** 
1. Verify the foreign table is in `airtable` schema, not `public`
2. Check no SECURITY DEFINER on the view:
```sql
SELECT definition FROM pg_views 
WHERE viewname = 'atlas_public_view_in_public';
```

---

## 📚 Additional Resources

### Understanding Foreign Data Wrappers
- [Supabase Foreign Data Wrappers](https://supabase.com/docs/guides/database/extensions/wrappers)
- [PostgreSQL FDW Documentation](https://www.postgresql.org/docs/current/postgres-fdw.html)

### Understanding SECURITY DEFINER
- Security definer views run with the creator's permissions, bypassing RLS
- This is a security risk when exposing data via APIs
- [PostgreSQL Security Definer](https://www.postgresql.org/docs/current/sql-createfunction.html)

### Row Level Security (RLS)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- RLS ensures data access is properly controlled
- Essential for API-exposed tables

---

## 🎯 Next Steps

1. **Immediate:** Run `fix_airtable_security_issues.sql`
2. **Test:** Verify communities page works
3. **Plan:** Decide if you want to migrate to native table (Option 2)
4. **Document:** Note any custom Airtable fields not in the migration script

---

## 💬 Need Help?

If you encounter issues:
1. Check Supabase logs (Project Settings → API → Logs)
2. Check browser console for errors
3. Verify Airtable connection in Supabase dashboard
4. Test queries directly in SQL Editor before blaming the app

---

## ⚠️ Important Notes

- **Backup First:** Export your Airtable data before major changes
- **Test Thoroughly:** Test in development before production
- **Monitor:** Watch for errors in Supabase logs after deployment
- **Document:** Keep track of what sync strategy you choose
- **Airtable FDW:** Make sure the Foreign Data Wrapper extension is properly configured in Supabase

---

**Created:** October 5, 2025  
**Purpose:** Fix Airtable-Supabase integration security issues  
**Status:** Ready to implement



