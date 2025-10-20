import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { supabase, type Lobby, type Trip } from '../supabase';
import { useSession } from './session-store';

interface LobbyState {
  currentLobby: Lobby | null;
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;

  // Actions
  createLobby: (name: string, description?: string) => Promise<Lobby>;
  joinLobby: (inviteCode: string) => Promise<void>;
  loadLobby: (lobbyId: string) => Promise<void>;
  leaveLobby: () => void;
  setCurrentTrip: (trip: Trip | null) => void;
}

export const useLobby = create<LobbyState>((set, get) => ({
  currentLobby: null,
  currentTrip: null,
  loading: false,
  error: null,

  createLobby: async (name: string, description?: string) => {
    set({ loading: true, error: null });

    try {
      const { sessionId } = useSession.getState();
      const inviteCode = nanoid(8).toUpperCase();

      const { data: lobby, error } = await supabase
        .from('lobbies')
        .insert({
          name,
          description: description || null,
          owner_id: sessionId,
          invite_code: inviteCode,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as owner
      await supabase.from('lobby_members').insert({
        lobby_id: lobby.id,
        user_id: sessionId,
        role: 'owner'
      });

      // Store lobby ID in localStorage
      localStorage.setItem('current_lobby_id', lobby.id);

      set({ currentLobby: lobby, loading: false });
      return lobby;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  joinLobby: async (inviteCode: string) => {
    set({ loading: true, error: null });

    try {
      const { data: lobby, error } = await supabase
        .from('lobbies')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) throw new Error('Invalid invite code');
      if (!lobby) throw new Error('Lobby not found');

      localStorage.setItem('current_lobby_id', lobby.id);
      set({ currentLobby: lobby, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadLobby: async (lobbyId: string) => {
    set({ loading: true, error: null });

    try {
      const { data: lobby, error } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();

      if (error) throw error;

      set({ currentLobby: lobby, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  leaveLobby: () => {
    localStorage.removeItem('current_lobby_id');
    localStorage.removeItem('current_trip_id');
    set({ currentLobby: null, currentTrip: null });
  },

  setCurrentTrip: (trip: Trip | null) => {
    if (trip) {
      localStorage.setItem('current_trip_id', trip.id);
    } else {
      localStorage.removeItem('current_trip_id');
    }
    set({ currentTrip: trip });
  }
}));

// Auto-load or create lobby on init (wrapped in setTimeout to ensure Supabase is ready)
setTimeout(() => {
  const savedLobbyId = localStorage.getItem('current_lobby_id');
  if (savedLobbyId) {
    useLobby.getState().loadLobby(savedLobbyId).catch((error) => {
      console.warn('Failed to load saved lobby, creating new one:', error);
      // If loading fails, create a new lobby
      useLobby.getState().createLobby('My Trip Planning').catch((createError) => {
        console.error('Failed to create lobby:', createError);
      });
    });
  } else {
    // No saved lobby, create one automatically
    useLobby.getState().createLobby('My Trip Planning').catch((error) => {
      console.error('Failed to create initial lobby:', error);
    });
  }
}, 100);
