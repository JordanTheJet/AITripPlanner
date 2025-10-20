-- ============================================
-- FRESH DATABASE SCHEMA FOR AI TRIP PLANNER
-- Session-based (No Authentication Required)
-- ============================================
-- This schema is designed for code-based lobbies from the ground up
-- User IDs are TEXT (session IDs) instead of UUIDs
-- ============================================

-- STEP 1: Drop all existing tables (if any)
DROP TABLE IF EXISTS itinerary_items CASCADE;
DROP TABLE IF EXISTS itinerary_days CASCADE;
DROP TABLE IF EXISTS trip_budgets CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS lobby_members CASCADE;
DROP TABLE IF EXISTS lobbies CASCADE;

-- STEP 2: Create tables with TEXT user IDs

-- Lobbies: Collaborative spaces for trip planning
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,  -- Session ID (TEXT, not UUID)
  invite_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lobby Members: Track who's in each lobby
CREATE TABLE lobby_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Session ID (TEXT, not UUID)
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips: Main trip entities
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by TEXT NOT NULL,  -- Session ID (TEXT, not UUID)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itinerary Days: Individual days in a trip
CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- Itinerary Items: Activities, places, etc. for each day
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE,
  place_id TEXT,
  place_name TEXT NOT NULL,
  place_address TEXT,
  place_type TEXT CHECK (place_type IN ('restaurant', 'activity', 'accommodation', 'transport', 'other')),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  order_index INTEGER NOT NULL DEFAULT 0,
  grounding_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Budgets: Budget tracking
CREATE TABLE trip_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  total_budget NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  breakdown JSONB DEFAULT '{"accommodation": 0, "transportation": 0, "food": 0, "activities": 0, "other": 0}'::jsonb,
  actual_spent NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages: Real-time chat within lobbies
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Session ID (TEXT, not UUID)
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'ai')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create indexes for performance
CREATE INDEX idx_lobby_members_lobby_id ON lobby_members(lobby_id);
CREATE INDEX idx_lobby_members_user_id ON lobby_members(user_id);
CREATE INDEX idx_trips_lobby_id ON trips(lobby_id);
CREATE INDEX idx_itinerary_days_trip_id ON itinerary_days(trip_id);
CREATE INDEX idx_itinerary_items_day_id ON itinerary_items(day_id);
CREATE INDEX idx_chat_messages_lobby_id ON chat_messages(lobby_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- STEP 4: Enable Row Level Security (RLS)
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create open-access RLS policies
-- (Anyone can read/write for easy collaboration)

-- Lobbies
CREATE POLICY "Anyone can view active lobbies"
  ON lobbies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can create lobbies"
  ON lobbies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update lobbies"
  ON lobbies FOR UPDATE
  USING (true);

-- Lobby Members
CREATE POLICY "Anyone can manage lobby members"
  ON lobby_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trips
CREATE POLICY "Anyone can manage trips"
  ON trips FOR ALL
  USING (true)
  WITH CHECK (true);

-- Itinerary Days
CREATE POLICY "Anyone can manage itinerary days"
  ON itinerary_days FOR ALL
  USING (true)
  WITH CHECK (true);

-- Itinerary Items
CREATE POLICY "Anyone can manage itinerary items"
  ON itinerary_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trip Budgets
CREATE POLICY "Anyone can manage trip budgets"
  ON trip_budgets FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Messages
CREATE POLICY "Anyone can manage chat messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- STEP 6: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_lobbies_updated_at
  BEFORE UPDATE ON lobbies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_days_updated_at
  BEFORE UPDATE ON itinerary_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_budgets_updated_at
  BEFORE UPDATE ON trip_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success! Your database is ready for session-based trip planning
-- No authentication required - just invite codes!
