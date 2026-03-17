import { create } from 'zustand';
import type { VanProfile, VanProfileWithId } from '@/types/profile';
import { fetchAllProfiles, fetchProfileById } from '@/services/profileService';
import demoData from '@/data/Van_Profile_Example_Jon.json';

interface ProfileStore {
  /** All loaded profiles */
  profiles: readonly VanProfileWithId[];
  /** Currently selected profile (detail page) */
  selectedProfile: VanProfileWithId | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Search query for the profiles list */
  searchQuery: string;

  // ── Actions ──
  loadProfiles: () => Promise<void>;
  loadDemoProfiles: () => void;
  loadProfile: (userId: string) => Promise<void>;
  setSelectedProfile: (profile: VanProfileWithId | null) => void;
  setSearchQuery: (query: string) => void;
  addProfile: (profile: VanProfileWithId) => void;
  clearError: () => void;
}

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  profiles: [],
  selectedProfile: null,
  isLoading: false,
  error: null,
  searchQuery: '',

  loadProfiles: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await fetchAllProfiles();
      set({ profiles, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load profiles';
      set({ error: message, isLoading: false });
    }
  },

  loadDemoProfiles: (): void => {
    const demoProfile: VanProfileWithId = {
      userId: 'demo-jon',
      ...(demoData as unknown as VanProfile),
    };
    set({ profiles: [demoProfile], isLoading: false, error: null });
  },

  loadProfile: async (userId: string): Promise<void> => {
    // Check in-memory profiles first (supports guest/demo mode)
    const cached = get().profiles.find((p) => p.userId === userId);
    if (cached) {
      set({ selectedProfile: cached, isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null, selectedProfile: null });
    try {
      const profile = await fetchProfileById(userId);
      if (profile === null) {
        set({ error: 'Profile not found', isLoading: false });
      } else {
        set({ selectedProfile: profile, isLoading: false });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load profile';
      set({ error: message, isLoading: false });
    }
  },

  setSelectedProfile: (profile: VanProfileWithId | null): void => {
    set({ selectedProfile: profile });
  },

  setSearchQuery: (query: string): void => {
    set({ searchQuery: query });
  },

  addProfile: (profile: VanProfileWithId): void => {
    const current = get().profiles;
    // Replace if already exists, append if new
    const exists = current.some((p) => p.userId === profile.userId);
    const updated = exists
      ? current.map((p) => (p.userId === profile.userId ? profile : p))
      : [...current, profile];
    set({ profiles: updated });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
