-- ============================================
-- Remove Auth Requirements (Code-Only Lobbies)
-- ============================================
-- This makes lobbies work with just invite codes
-- No authentication required - anyone with a code can join
-- ============================================

-- IMPORTANT: Drop ALL policies first before changing column types
-- Policies can depend on column types and will cause errors otherwise

-- 1. Drop ALL existing policies on ALL tables
DROP POLICY IF EXISTS "Authenticated users can view lobbies" ON lobbies;
DROP POLICY IF EXISTS "Authenticated users can create lobbies" ON lobbies;
DROP POLICY IF EXISTS "Owners can update their lobbies" ON lobbies;
DROP POLICY IF EXISTS "Anyone can view active lobbies" ON lobbies;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Authenticated users can view lobby members" ON lobby_members;
DROP POLICY IF EXISTS "Authenticated users can join lobbies" ON lobby_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON lobby_members;
DROP POLICY IF EXISTS "Users can join lobbies" ON lobby_members;
DROP POLICY IF EXISTS "Owners can manage members" ON lobby_members;

DROP POLICY IF EXISTS "Authenticated users can view trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can update trips" ON trips;
DROP POLICY IF EXISTS "Lobby members can view trips" ON trips;
DROP POLICY IF EXISTS "Lobby members can create trips" ON trips;
DROP POLICY IF EXISTS "Lobby members can update trips" ON trips;

DROP POLICY IF EXISTS "Authenticated users can manage itinerary days" ON itinerary_days;
DROP POLICY IF EXISTS "Lobby members can view itinerary days" ON itinerary_days;
DROP POLICY IF EXISTS "Lobby members can manage itinerary days" ON itinerary_days;

DROP POLICY IF EXISTS "Authenticated users can manage itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "Lobby members can view itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "Lobby members can manage itinerary items" ON itinerary_items;

DROP POLICY IF EXISTS "Authenticated users can manage chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Lobby members can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Lobby members can send messages" ON chat_messages;

-- Drop policies for ai_contexts table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_contexts') THEN
    DROP POLICY IF EXISTS "Lobby members can view AI contexts" ON ai_contexts;
    DROP POLICY IF EXISTS "Lobby members can create AI contexts" ON ai_contexts;
    DROP POLICY IF EXISTS "Lobby members can update AI contexts" ON ai_contexts;
    DROP POLICY IF EXISTS "Lobby members can delete AI contexts" ON ai_contexts;
    DROP POLICY IF EXISTS "Anyone can manage AI contexts" ON ai_contexts;
  END IF;
END $$;

-- Drop policies for accommodations table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accommodations') THEN
    DROP POLICY IF EXISTS "Lobby members can view accommodations" ON accommodations;
    DROP POLICY IF EXISTS "Lobby members can manage accommodations" ON accommodations;
    DROP POLICY IF EXISTS "Anyone can manage accommodations" ON accommodations;
  END IF;
END $$;

-- Drop policies for transportation table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transportation') THEN
    DROP POLICY IF EXISTS "Lobby members can view transportation" ON transportation;
    DROP POLICY IF EXISTS "Lobby members can manage transportation" ON transportation;
    DROP POLICY IF EXISTS "Anyone can manage transportation" ON transportation;
  END IF;
END $$;

-- Drop policies for trip_budgets if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_budgets') THEN
    DROP POLICY IF EXISTS "Authenticated users can manage trip budgets" ON trip_budgets;
    DROP POLICY IF EXISTS "Lobby members can view budgets" ON trip_budgets;
    DROP POLICY IF EXISTS "Lobby members can manage budgets" ON trip_budgets;
  END IF;
END $$;

-- 2. Drop all foreign key constraints
ALTER TABLE lobbies DROP CONSTRAINT IF EXISTS lobbies_owner_id_fkey;
ALTER TABLE lobby_members DROP CONSTRAINT IF EXISTS lobby_members_user_id_fkey;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_created_by_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- Drop constraints for ai_contexts if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_contexts') THEN
    EXECUTE 'ALTER TABLE ai_contexts DROP CONSTRAINT IF EXISTS ai_contexts_user_id_fkey';
  END IF;
END $$;

-- Drop profiles table foreign key if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey';
  END IF;
END $$;

-- 3. Now we can safely change column types from UUID to TEXT
ALTER TABLE lobbies ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE lobby_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE trips ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE chat_messages ALTER COLUMN user_id TYPE TEXT;

-- Change ai_contexts table user_id if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_contexts') THEN
    EXECUTE 'ALTER TABLE ai_contexts ALTER COLUMN user_id TYPE TEXT';
  END IF;
END $$;

-- Change profiles table ID if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE 'ALTER TABLE profiles ALTER COLUMN id TYPE TEXT';
  END IF;
END $$;

-- 4. Create new simple policies (no auth required)

-- Lobbies: Anyone can view and create

CREATE POLICY "Anyone can view active lobbies"
  ON lobbies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can create lobbies"
  ON lobbies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update lobbies"
  ON lobbies FOR UPDATE
  USING (true);

-- Lobby Members: Open access
CREATE POLICY "Anyone can manage lobby members"
  ON lobby_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trips: Open access
CREATE POLICY "Anyone can manage trips"
  ON trips FOR ALL
  USING (true)
  WITH CHECK (true);

-- Itinerary Days: Open access
CREATE POLICY "Anyone can manage itinerary days"
  ON itinerary_days FOR ALL
  USING (true)
  WITH CHECK (true);

-- Itinerary Items: Open access
CREATE POLICY "Anyone can manage itinerary items"
  ON itinerary_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Messages: Open access
CREATE POLICY "Anyone can manage chat messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trip Budgets: Open access (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_budgets') THEN
    EXECUTE 'CREATE POLICY "Anyone can manage trip budgets" ON trip_budgets FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Profiles: Open access (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE 'CREATE POLICY "Anyone can manage profiles" ON profiles FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- AI Contexts: Open access (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_contexts') THEN
    EXECUTE 'CREATE POLICY "Anyone can manage AI contexts" ON ai_contexts FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Accommodations: Open access (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accommodations') THEN
    EXECUTE 'CREATE POLICY "Anyone can manage accommodations" ON accommodations FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Transportation: Open access (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transportation') THEN
    EXECUTE 'CREATE POLICY "Anyone can manage transportation" ON transportation FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- NOTE: This is simplified for easy collaboration
-- Anyone with a lobby code can join and contribute
-- Perfect for friends planning trips together!
