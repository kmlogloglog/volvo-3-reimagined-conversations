import { create } from 'zustand';
import type { AuthUser, AuthState } from '@/types/auth';

interface AuthStore {
  user: AuthUser | null;
  authState: AuthState;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: () => void;
  signInAsGuest: () => void;
}

const GUEST_USER: AuthUser = {
  uid: 'guest',
  displayName: 'Guest User',
  email: 'guest@local',
  photoURL: null,
};

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  authState: 'loading',

  setUser: (user: AuthUser): void => {
    set({ user, authState: 'authenticated' });
  },

  clearUser: (): void => {
    set({ user: null, authState: 'unauthenticated' });
  },

  setLoading: (): void => {
    set({ authState: 'loading' });
  },

  signInAsGuest: (): void => {
    set({ user: GUEST_USER, authState: 'authenticated' });
  },
}));
