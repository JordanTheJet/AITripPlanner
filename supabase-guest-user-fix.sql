-- ============================================
-- Fix for Guest User Support (No Auth)
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This removes foreign key constraints that require auth.users
-- ============================================

-- 1. Drop foreign key constraints that reference profiles
ALTER TABLE lobbies DROP CONSTRAINT IF EXISTS lobbies_owner_id_fkey;
ALTER TABLE lobby_members DROP CONSTRAINT IF EXISTS lobby_members_user_id_fkey;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_created_by_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE ai_contexts DROP CONSTRAINT IF EXISTS ai_contexts_created_by_fkey;

-- 2. Change columns from UUID to TEXT to support guest user IDs
ALTER TABLE lobbies ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE lobby_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE trips ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE chat_messages ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE ai_contexts ALTER COLUMN created_by TYPE TEXT;

-- 3. Also update bookings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booked_by_fkey;
    ALTER TABLE bookings ALTER COLUMN booked_by TYPE TEXT;
  END IF;
END $$;

-- 4. Update RLS policies to work with guest users (TEXT IDs)
-- Since we don't have real auth, we'll make policies more permissive for demo purposes

-- Lobbies: Anyone can create/view/update
DROP POLICY IF EXISTS "Anyone can view active lobbies" ON lobbies;
DROP POLICY IF EXISTS "Owners can update their lobbies" ON lobbies;
DROP POLICY IF EXISTS "Authenticated users can create lobbies" ON lobbies;

CREATE POLICY "Anyone can manage lobbies"
  ON lobbies FOR ALL
  USING (true)
  WITH CHECK (true);

-- Lobby Members: Open access for demo
DROP POLICY IF EXISTS "Users can view their own memberships" ON lobby_members;
DROP POLICY IF EXISTS "Users can join lobbies" ON lobby_members;
DROP POLICY IF EXISTS "Owners can manage members" ON lobby_members;

CREATE POLICY "Anyone can manage lobby members"
  ON lobby_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trips: Open access for demo
DROP POLICY IF EXISTS "Lobby members can view trips" ON trips;
DROP POLICY IF EXISTS "Lobby members can create trips" ON trips;
DROP POLICY IF EXISTS "Lobby members can update trips" ON trips;

CREATE POLICY "Anyone can manage trips"
  ON trips FOR ALL
  USING (true)
  WITH CHECK (true);

-- Itinerary Days: Open access
DROP POLICY IF EXISTS "Lobby members can view itinerary days" ON itinerary_days;
DROP POLICY IF EXISTS "Lobby members can manage itinerary days" ON itinerary_days;

CREATE POLICY "Anyone can manage itinerary days"
  ON itinerary_days FOR ALL
  USING (true)
  WITH CHECK (true);

-- Itinerary Items: Open access
DROP POLICY IF EXISTS "Lobby members can view itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "Lobby members can manage itinerary items" ON itinerary_items;

CREATE POLICY "Anyone can manage itinerary items"
  ON itinerary_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Messages: Open access
DROP POLICY IF EXISTS "Lobby members can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Lobby members can send messages" ON chat_messages;

CREATE POLICY "Anyone can manage chat messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- AI Contexts: Open access
DROP POLICY IF EXISTS "Lobby members can view AI contexts" ON ai_contexts;
DROP POLICY IF EXISTS "Lobby members can create AI contexts" ON ai_contexts;

CREATE POLICY "Anyone can manage AI contexts"
  ON ai_contexts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trip Budgets: Open access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_budgets') THEN
    DROP POLICY IF EXISTS "Lobby members can view budgets" ON trip_budgets;
    DROP POLICY IF EXISTS "Lobby members can manage budgets" ON trip_budgets;

    CREATE POLICY "Anyone can manage trip budgets"
      ON trip_budgets FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Accommodations: Open access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accommodations') THEN
    DROP POLICY IF EXISTS "Lobby members can view accommodations" ON accommodations;
    DROP POLICY IF EXISTS "Lobby members can manage accommodations" ON accommodations;

    CREATE POLICY "Anyone can manage accommodations"
      ON accommodations FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Transportation: Open access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transportation') THEN
    DROP POLICY IF EXISTS "Lobby members can view transportation" ON transportation;
    DROP POLICY IF EXISTS "Lobby members can manage transportation" ON transportation;

    CREATE POLICY "Anyone can manage transportation"
      ON transportation FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Bookings: Open access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    DROP POLICY IF EXISTS "Lobby members can view bookings" ON bookings;
    DROP POLICY IF EXISTS "Lobby members can manage bookings" ON bookings;

    CREATE POLICY "Anyone can manage bookings"
      ON bookings FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Optimization Logs: Open access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'optimization_logs') THEN
    DROP POLICY IF EXISTS "Lobby members can view optimization logs" ON optimization_logs;
    DROP POLICY IF EXISTS "Lobby members can create optimization logs" ON optimization_logs;

    CREATE POLICY "Anyone can manage optimization logs"
      ON optimization_logs FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Exports: Open access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exports') THEN
    DROP POLICY IF EXISTS "Lobby members can view exports" ON exports;
    DROP POLICY IF EXISTS "Lobby members can create exports" ON exports;

    CREATE POLICY "Anyone can manage exports"
      ON exports FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- NOTE: For production, you would want proper auth and stricter RLS policies
-- This is simplified for demo/development purposes
