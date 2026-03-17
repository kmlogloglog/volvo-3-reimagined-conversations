/**
 * Zustand store for the real-time agent user_state listener.
 *
 * Holds the latest state written by the Freja agent during a conversation
 * and exposes startListening / stopListening lifecycle actions.
 */

import { create } from 'zustand';
import { subscribeToUserState, type AgentUserState } from '@/services/liveStateService';

const APP_NAME = 'volvo_vaen';

interface LiveStateStore {
  /** Latest state from Firestore */
  state: AgentUserState | null;
  /** Whether the listener is active */
  isListening: boolean;
  /** Timestamp of the last update */
  lastUpdated: Date | null;
  /** Active user ID being listened to */
  userId: string | null;

  // ── Actions ──
  startListening: (userId: string) => void;
  stopListening: () => void;
}

let _unsubscribe: (() => void) | null = null;

export const useLiveStateStore = create<LiveStateStore>()((set, get) => ({
  state: null,
  isListening: false,
  lastUpdated: null,
  userId: null,

  startListening: (userId: string) => {
    // Stop any existing listener first
    if (_unsubscribe) {
      _unsubscribe();
      _unsubscribe = null;
    }

    // Skip if already listening to the same user
    if (get().isListening && get().userId === userId) return;

    set({ isListening: true, userId, state: null, lastUpdated: null });

    _unsubscribe = subscribeToUserState(userId, APP_NAME, (newState) => {
      set({ state: newState, lastUpdated: new Date() });
    });
  },

  stopListening: () => {
    if (_unsubscribe) {
      _unsubscribe();
      _unsubscribe = null;
    }
    set({ isListening: false, userId: null, state: null, lastUpdated: null });
  },
}));
