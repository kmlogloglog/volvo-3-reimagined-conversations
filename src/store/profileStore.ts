import { create } from 'zustand';
import type { VanProfile, VanProfileWithId } from '@/types/profile';
import {
  fetchAllProfiles,
  fetchProfileById,
  deleteProfile as deleteProfileFromDb,
  profileNeedsEnrichment,
  enrichAndPersistProfile,
} from '@/services/profileService';
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
  deleteProfile: (userId: string) => Promise<void>;
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

      // Background: enrich sparse agent profiles via Gemini and persist to Firestore.
      // Once persisted, future loads pull the full Van Profile directly.
      const sparseProfiles = profiles.filter(profileNeedsEnrichment);
      for (const sparse of sparseProfiles) {
        enrichAndPersistProfile(sparse)
          .then((enriched) => {
            const current = get().profiles;
            set({
              profiles: current.map((p) =>
                p.userId === enriched.userId ? enriched : p,
              ),
            });
          })
          .catch((err) => {
            console.error(`[profileStore] enrichment failed for ${sparse.userId}:`, err);
          });
      }
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

  deleteProfile: async (userId: string): Promise<void> => {
    await deleteProfileFromDb(userId);
    set({ profiles: get().profiles.filter((p) => p.userId !== userId) });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
