import { create } from 'zustand';
import type { VanProfile, VanProfileWithId } from '@/types/profile';
import {
  fetchAllProfiles,
  fetchProfileById,
  deleteProfile as deleteProfileFromDb,
  profileNeedsEnrichment,
  enrichAndPersistProfile,
  mapAgentStateToProfile,
} from '@/services/profileService';
import { subscribeToAllUserStates } from '@/services/liveStateService';
import demoData from '@/data/Van_Profile_Example_Jon.json';

const APP_NAME = 'volvo_vaen';

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

  /** User ID of a brand-new profile detected by live sync */
  newProfileUserId: string | null;

  // ── Actions ──
  loadProfiles: () => Promise<void>;
  loadDemoProfiles: () => void;
  loadProfile: (userId: string) => Promise<void>;
  setSelectedProfile: (profile: VanProfileWithId | null) => void;
  setSearchQuery: (query: string) => void;
  addProfile: (profile: VanProfileWithId) => void;
  deleteProfile: (userId: string) => Promise<void>;
  clearError: () => void;
  startLiveSync: () => void;
  stopLiveSync: () => void;
  clearNewProfileUserId: () => void;
}

let _liveSyncUnsub: (() => void) | null = null;
const _knownUserIds = new Set<string>();

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  profiles: [],
  selectedProfile: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  newProfileUserId: null,

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

  startLiveSync: (): void => {
    // Don't double-subscribe
    if (_liveSyncUnsub) return;

    // Seed knownUserIds from any profiles already loaded
    for (const p of get().profiles) {
      _knownUserIds.add(p.userId);
    }

    _liveSyncUnsub = subscribeToAllUserStates(APP_NAME, (states) => {
      const current = get().profiles;
      const updatedMap = new Map(current.map((p) => [p.userId, p]));

      // Detect new user IDs and update/insert profiles from live state
      let detectedNewUserId: string | null = null;
      for (const [userId, agentState] of states) {
        const liveProfile = mapAgentStateToProfile(userId, agentState);

        // Filter out demo users (matching existing fetchAllProfiles behavior)
        const name = liveProfile.profileData.demographics.name?.toLowerCase() ?? '';
        if (name.includes('demo')) continue;

        // Check if this is a brand-new user
        if (!_knownUserIds.has(userId)) {
          _knownUserIds.add(userId);
          detectedNewUserId = userId;
        }

        // Only overwrite if the existing profile was agent-generated (sparse).
        // Full uploaded Van Profile docs should not be overwritten by agent state.
        const existing = updatedMap.get(userId);
        if (!existing || profileNeedsEnrichment(existing)) {
          updatedMap.set(userId, liveProfile);
        }
      }

      const updatedProfiles = Array.from(updatedMap.values());
      const nextState: Partial<ProfileStore> = { profiles: updatedProfiles };
      if (detectedNewUserId) {
        nextState.newProfileUserId = detectedNewUserId;
      }
      set(nextState);

      // Background-enrich newly detected sparse profiles
      if (detectedNewUserId) {
        const newProfile = updatedMap.get(detectedNewUserId);
        if (newProfile && profileNeedsEnrichment(newProfile)) {
          enrichAndPersistProfile(newProfile)
            .then((enriched) => {
              set({
                profiles: get().profiles.map((p) =>
                  p.userId === enriched.userId ? enriched : p,
                ),
              });
            })
            .catch((err) => {
              console.error(`[profileStore] enrichment failed for ${detectedNewUserId}:`, err);
            });
        }
      }
    });
  },

  stopLiveSync: (): void => {
    if (_liveSyncUnsub) {
      _liveSyncUnsub();
      _liveSyncUnsub = null;
    }
  },

  clearNewProfileUserId: (): void => {
    set({ newProfileUserId: null });
  },
}));
