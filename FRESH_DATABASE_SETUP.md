# Fresh Database Setup Instructions

This guide will help you set up a clean database for the AI Trip Planner with session-based authentication (no login required).

## Why Start Fresh?

Starting with a fresh database is cleaner and faster than migrating an existing one. The new schema is designed from the ground up for session-based lobbies with TEXT user IDs instead of UUIDs.

## Steps to Set Up

### 1. Open Supabase Dashboard
Go to: https://bigacmfaeiijscrblfjb.supabase.co

### 2. Navigate to SQL Editor
Click on **"SQL Editor"** in the left sidebar

### 3. Create New Query
Click **"+ New query"**

### 4. Run the Fresh Schema
1. Open `supabase-fresh-start.sql` in this project
2. Copy **ALL** the contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### 5. Verify Success
You should see:
```
Success. No rows returned
```

### 6. Check Tables
Go to **"Table Editor"** in the left sidebar. You should see:
- ✅ lobbies
- ✅ lobby_members
- ✅ trips
- ✅ itinerary_days
- ✅ itinerary_items
- ✅ trip_budgets
- ✅ chat_messages

## What This Schema Provides

### Tables Created:
1. **lobbies** - Collaborative spaces with invite codes
2. **lobby_members** - Track who's in each lobby
3. **trips** - Multi-day trip plans
4. **itinerary_days** - Individual days in trips
5. **itinerary_items** - Activities, restaurants, etc.
6. **trip_budgets** - Budget tracking with breakdowns
7. **chat_messages** - Real-time chat within lobbies

### Key Features:
- ✅ **Session-based** - No authentication required
- ✅ **TEXT user IDs** - Uses session IDs (e.g., "eLMZUNH_6AjXgcc2")
- ✅ **Open RLS policies** - Anyone can read/write for easy collaboration
- ✅ **Invite codes** - 8-character codes to join lobbies
- ✅ **Real-time ready** - Works with Supabase real-time subscriptions
- ✅ **Automatic timestamps** - created_at and updated_at managed automatically

## Differences from Old Schema

| Old (Auth-based) | New (Session-based) |
|------------------|---------------------|
| UUID user IDs    | TEXT session IDs    |
| Foreign keys to auth.users | No auth dependencies |
| Complex RLS policies | Simple open-access policies |
| Required authentication | No login needed |

## After Setup

Once the database is set up:
1. Refresh your app at http://localhost:3000
2. The app will automatically create a lobby
3. Share the invite code with friends to collaborate!

## Troubleshooting

**If you see errors:**
- Make sure you copied the ENTIRE `supabase-fresh-start.sql` file
- Check that you're running it in the correct Supabase project
- Try refreshing the SQL Editor page and running again

**If tables already exist:**
- The script drops existing tables first (CASCADE)
- Any existing data will be lost (this is a fresh start)
- Consider exporting important data first if needed

## Need the Old Data?

If you need to preserve existing data before starting fresh:
1. Go to Table Editor
2. Export each table to CSV
3. Run the fresh schema
4. Import the CSVs back (note: you'll need to convert UUID user IDs to TEXT session IDs)
