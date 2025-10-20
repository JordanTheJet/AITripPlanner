import { create } from 'zustand';
import {
  supabase,
  type Trip,
  type ItineraryDay,
  type ItineraryItem,
  type TripBudget
} from '../supabase';
import { useSession } from './session-store';
import { useLobby } from './lobby-store';

interface TripState {
  currentTrip: Trip | null;
  days: ItineraryDay[];
  items: Record<string, ItineraryItem[]>; // Keyed by day_id
  budget: TripBudget | null;
  loading: boolean;
  error: string | null;

  // Actions
  createTrip: (data: CreateTripInput) => Promise<Trip>;
  loadTrip: (tripId: string) => Promise<void>;
  addDay: (dayData: Omit<ItineraryDay, 'id' | 'trip_id' | 'created_at' | 'updated_at'>) => Promise<ItineraryDay>;
  addItem: (dayId: string, itemData: Partial<ItineraryItem>) => Promise<ItineraryItem>;
  updateItem: (itemId: string, updates: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (itemId: string, dayId: string) => Promise<void>;
  updateBudget: (updates: Partial<TripBudget>) => Promise<void>;
  clearTrip: () => void;
}

interface CreateTripInput {
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number;
}

export const useTrip = create<TripState>((set, get) => ({
  currentTrip: null,
  days: [],
  items: {},
  budget: null,
  loading: false,
  error: null,

  createTrip: async (data: CreateTripInput) => {
    set({ loading: true, error: null });

    try {
      const lobby = useLobby.getState().currentLobby;
      const { sessionId } = useSession.getState();

      if (!lobby) {
        throw new Error('Must be in a lobby to create a trip');
      }

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          lobby_id: lobby.id,
          created_by: sessionId,
          name: data.name,
          destination: data.destination,
          start_date: data.start_date,
          end_date: data.end_date
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Create budget if provided (only if table exists)
      if (data.budget) {
        try {
          await supabase.from('trip_budgets').insert({
            trip_id: trip.id,
            total_budget: data.budget,
            currency: 'USD',
            breakdown: {
              accommodation: 0,
              transportation: 0,
              food: 0,
              activities: 0,
              other: 0
            },
            actual_spent: 0
          });
        } catch (budgetError) {
          // If trip_budgets table doesn't exist, just skip budget creation
          console.warn('Could not create budget (table may not exist):', budgetError);
        }
      }

      // Load the full trip
      await get().loadTrip(trip.id);
      useLobby.getState().setCurrentTrip(trip);

      set({ loading: false });
      return trip;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadTrip: async (tripId: string) => {
    set({ loading: true, error: null });

    try {
      // Load trip and days
      const [tripRes, daysRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId).single(),
        supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', tripId)
          .order('day_number')
      ]);

      if (tripRes.error) throw tripRes.error;

      const trip = tripRes.data;
      const days = daysRes.data || [];

      // Try to load budget, but don't fail if table doesn't exist
      let budget = null;
      try {
        const budgetRes = await supabase.from('trip_budgets').select('*').eq('trip_id', tripId).single();
        budget = budgetRes.data || null;
      } catch (budgetError) {
        console.warn('Could not load budget (table may not exist):', budgetError);
      }

      // Load items for each day
      const items: Record<string, ItineraryItem[]> = {};
      for (const day of days) {
        const { data } = await supabase
          .from('itinerary_items')
          .select('*')
          .eq('day_id', day.id)
          .order('order_index');
        items[day.id] = data || [];
      }

      set({
        currentTrip: trip,
        days,
        items,
        budget,
        loading: false
      });

      // Subscribe to realtime updates for itinerary items
      const channel = supabase
        .channel(`trip:${tripId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'itinerary_items'
          },
          () => {
            // Reload trip on any change
            get().loadTrip(tripId);
          }
        )
        .subscribe();

      // Store channel for cleanup
      (window as any).__tripChannel = channel;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addDay: async (dayData) => {
    const tripId = get().currentTrip?.id;
    if (!tripId) throw new Error('No active trip');

    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({
        trip_id: tripId,
        ...dayData
      })
      .select()
      .single();

    if (error) throw error;

    // Update local state
    set((state) => ({
      days: [...state.days, data].sort((a, b) => a.day_number - b.day_number),
      items: { ...state.items, [data.id]: [] }
    }));

    return data;
  },

  addItem: async (dayId: string, itemData) => {
    const items = get().items[dayId] || [];
    const nextOrderIndex = items.length;

    const { data, error } = await supabase
      .from('itinerary_items')
      .insert({
        day_id: dayId,
        order_index: nextOrderIndex,
        place_name: itemData.place_name || 'Unnamed Place',
        place_type: itemData.place_type || 'other',
        ...itemData
      })
      .select()
      .single();

    if (error) throw error;

    // Update local state
    set((state) => ({
      items: {
        ...state.items,
        [dayId]: [...(state.items[dayId] || []), data]
      }
    }));

    return data;
  },

  updateItem: async (itemId: string, updates) => {
    const { error } = await supabase
      .from('itinerary_items')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;

    // Realtime will handle the update
  },

  deleteItem: async (itemId: string, dayId: string) => {
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Update local state
    set((state) => ({
      items: {
        ...state.items,
        [dayId]: (state.items[dayId] || []).filter((item) => item.id !== itemId)
      }
    }));
  },

  updateBudget: async (updates) => {
    const tripId = get().currentTrip?.id;
    if (!tripId) throw new Error('No active trip');

    const { data, error } = await supabase
      .from('trip_budgets')
      .update(updates)
      .eq('trip_id', tripId)
      .select()
      .single();

    if (error) throw error;

    set({ budget: data });
  },

  clearTrip: () => {
    // Unsubscribe from realtime
    const channel = (window as any).__tripChannel;
    if (channel) {
      supabase.removeChannel(channel);
      delete (window as any).__tripChannel;
    }

    set({
      currentTrip: null,
      days: [],
      items: {},
      budget: null
    });
  }
}));

// Auto-load trip on init
const savedTripId = localStorage.getItem('current_trip_id');
if (savedTripId) {
  useTrip.getState().loadTrip(savedTripId);
}
