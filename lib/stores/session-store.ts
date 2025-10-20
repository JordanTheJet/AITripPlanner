import { create } from 'zustand';
import { nanoid } from 'nanoid';

/**
 * Simple session store for anonymous users
 * Generates a random session ID stored in localStorage
 */

interface SessionState {
  sessionId: string;
  displayName: string;
  setDisplayName: (name: string) => void;
}

// Generate or retrieve session ID
function getOrCreateSessionId(): string {
  const stored = localStorage.getItem('session_id');
  if (stored) return stored;

  const newId = nanoid(16);
  localStorage.setItem('session_id', newId);
  return newId;
}

// Get or create display name
function getOrCreateDisplayName(): string {
  const stored = localStorage.getItem('display_name');
  if (stored) return stored;

  const adjectives = ['Happy', 'Cool', 'Swift', 'Bright', 'Epic', 'Bold', 'Wise', 'Zen'];
  const nouns = ['Traveler', 'Explorer', 'Wanderer', 'Adventurer', 'Nomad', 'Voyager'];

  const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  localStorage.setItem('display_name', randomName);
  return randomName;
}

export const useSession = create<SessionState>((set) => ({
  sessionId: getOrCreateSessionId(),
  displayName: getOrCreateDisplayName(),
  setDisplayName: (name: string) => {
    localStorage.setItem('display_name', name);
    set({ displayName: name });
  }
}));
