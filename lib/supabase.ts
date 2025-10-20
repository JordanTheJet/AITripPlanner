import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Lobby {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LobbyMember {
  id: string;
  lobby_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Trip {
  id: string;
  lobby_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  place_id: string | null;
  place_name: string;
  place_address: string | null;
  place_type: 'restaurant' | 'activity' | 'accommodation' | 'transport' | 'other';
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
  grounding_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  lobby_id: string;
  user_id: string;
  message: string;
  message_type: 'user' | 'system' | 'ai';
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface TripBudget {
  id: string;
  trip_id: string;
  total_budget: number;
  currency: string;
  breakdown: {
    accommodation: number;
    transportation: number;
    food: number;
    activities: number;
    other: number;
  };
  actual_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  id: string;
  trip_id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'airbnb' | 'resort' | 'other';
  address: string | null;
  lat: number | null;
  lng: number | null;
  check_in: string;
  check_out: string;
  cost_per_night: number | null;
  total_cost: number | null;
  booking_url: string | null;
  confirmation_code: string | null;
  place_id: string | null;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transportation {
  id: string;
  trip_id: string;
  type: 'flight' | 'train' | 'bus' | 'car_rental' | 'rideshare' | 'ferry' | 'other';
  from_location: string;
  to_location: string;
  from_lat: number | null;
  from_lng: number | null;
  to_lat: number | null;
  to_lng: number | null;
  departure_time: string;
  arrival_time: string;
  cost: number | null;
  provider: string | null;
  booking_url: string | null;
  confirmation_code: string | null;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}
