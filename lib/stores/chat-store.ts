import { create } from 'zustand';
import { supabase, type ChatMessage } from '../supabase';
import { useLobby } from './lobby-store';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;

  // Actions
  loadMessages: (lobbyId: string) => Promise<void>;
  subscribeToMessages: (lobbyId: string) => void;
  unsubscribe: () => void;
  clearMessages: () => void;
}

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  loadMessages: async (lobbyId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lobby_id', lobbyId)
        .order('created_at', { ascending: true })
        .limit(100); // Last 100 messages

      if (error) throw error;

      set({ messages: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to load messages:', error);
    }
  },

  subscribeToMessages: (lobbyId: string) => {
    // First, load existing messages
    get().loadMessages(lobbyId);

    // Then subscribe to new messages
    const channel = supabase
      .channel(`chat:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `lobby_id=eq.${lobbyId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          set((state) => ({
            messages: [...state.messages, newMessage]
          }));
        }
      )
      .subscribe();

    // Store channel for cleanup
    (window as any).__chatChannel = channel;
  },

  unsubscribe: () => {
    const channel = (window as any).__chatChannel;
    if (channel) {
      supabase.removeChannel(channel);
      delete (window as any).__chatChannel;
    }
  },

  clearMessages: () => {
    get().unsubscribe();
    set({ messages: [], error: null });
  }
}));

// Auto-subscribe when lobby changes
if (typeof window !== 'undefined') {
  useLobby.subscribe((state) => {
    const chatState = useChat.getState();

    if (state.currentLobby) {
      // Subscribe to new lobby's chat
      chatState.subscribeToMessages(state.currentLobby.id);
    } else {
      // Clear chat when leaving lobby
      chatState.clearMessages();
    }
  });
}
