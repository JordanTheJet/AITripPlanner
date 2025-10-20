-- ============================================
-- AI Trip Planner - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- LOBBIES TABLE
-- ============================================
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lobbies_invite_code ON lobbies(invite_code);

ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lobbies"
  ON lobbies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can update their lobbies"
  ON lobbies FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create lobbies"
  ON lobbies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- LOBBY MEMBERS TABLE
-- ============================================
CREATE TABLE lobby_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lobby_id, user_id)
);

ALTER TABLE lobby_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view lobby membership"
  ON lobby_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = lobby_members.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join lobbies"
  ON lobby_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can manage members"
  ON lobby_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lobbies l
      WHERE l.id = lobby_members.lobby_id
      AND l.owner_id = auth.uid()
    )
  );

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby members can view trips"
  ON trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = trips.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby members can create trips"
  ON trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = trips.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby members can update trips"
  ON trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = trips.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

-- ============================================
-- ITINERARY DAYS TABLE
-- ============================================
CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby members can view itinerary days"
  ON itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN lobby_members lm ON lm.lobby_id = t.lobby_id
      WHERE t.id = itinerary_days.trip_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby members can manage itinerary days"
  ON itinerary_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN lobby_members lm ON lm.lobby_id = t.lobby_id
      WHERE t.id = itinerary_days.trip_id
      AND lm.user_id = auth.uid()
    )
  );

-- ============================================
-- ITINERARY ITEMS TABLE
-- ============================================
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  place_id TEXT,
  place_name TEXT NOT NULL,
  place_address TEXT,
  place_type TEXT NOT NULL CHECK (place_type IN ('restaurant', 'activity', 'accommodation', 'transport', 'other')),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  order_index INTEGER NOT NULL,
  grounding_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_itinerary_items_day_id ON itinerary_items(day_id);
CREATE INDEX idx_itinerary_items_order ON itinerary_items(day_id, order_index);

ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby members can view itinerary items"
  ON itinerary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days id
      JOIN trips t ON t.id = id.trip_id
      JOIN lobby_members lm ON lm.lobby_id = t.lobby_id
      WHERE id.id = itinerary_items.day_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby members can manage itinerary items"
  ON itinerary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days id
      JOIN trips t ON t.id = id.trip_id
      JOIN lobby_members lm ON lm.lobby_id = t.lobby_id
      WHERE id.id = itinerary_items.day_id
      AND lm.user_id = auth.uid()
    )
  );

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'system', 'ai')) DEFAULT 'user',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_lobby ON chat_messages(lobby_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby members can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = chat_messages.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby members can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = chat_messages.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

-- ============================================
-- AI CONTEXTS TABLE
-- ============================================
CREATE TABLE ai_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('chat_log', 'user_profiles', 'itinerary', 'preferences')),
  content JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_contexts_lobby ON ai_contexts(lobby_id, created_at DESC);

ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby members can view AI contexts"
  ON ai_contexts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = ai_contexts.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Lobby members can create AI contexts"
  ON ai_contexts FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM lobby_members lm
      WHERE lm.lobby_id = ai_contexts.lobby_id
      AND lm.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lobbies_updated_at BEFORE UPDATE ON lobbies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_days_updated_at BEFORE UPDATE ON itinerary_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_items_updated_at BEFORE UPDATE ON itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME SETUP
-- ============================================
-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary_items;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_members;
