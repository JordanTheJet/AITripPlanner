# Database Migration Instructions

Your database still has UUID columns that need to be converted to TEXT to support session-based IDs.

## Error You're Seeing
```
invalid input syntax for type uuid: "eLMZUNH_6AjXgcc2"
```

This happens because the database columns are still expecting UUID format, but we're sending text session IDs.

## How to Fix (REQUIRED STEP)

**You must run this SQL migration in your Supabase dashboard:**

1. **Open Supabase Dashboard**: https://bigacmfaeiijscrblfjb.supabase.co
2. **Go to SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Create New Query**: Click "+ New query"
4. **Copy Migration**: Open `supabase-no-auth.sql` in this project and copy ALL the contents
5. **Paste and Run**: Paste into the SQL Editor and click "Run"
6. **Verify Success**: You should see "Success. No rows returned"

**The app will NOT work until you complete this migration!**

## What This Migration Does

- Drops all RLS policies (they prevent column type changes)
- Removes foreign key constraints to auth.users
- Converts these columns from UUID to TEXT:
  - `lobbies.owner_id`
  - `lobby_members.user_id`
  - `trips.created_by`
  - `chat_messages.user_id`
- Creates new open-access RLS policies (anyone can read/write)

## After Running the Migration

The app will work with session-based lobbies. No authentication required!

## Alternative: Fresh Database

If you prefer to start fresh, you can:
1. Delete all existing tables in Supabase
2. Run the initial table creation SQL (if you have it)
3. Make sure all user ID columns are TEXT, not UUID
