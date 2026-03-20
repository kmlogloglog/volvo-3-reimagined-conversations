/**
 * Firestore service layer for Vän profile documents — (default) database.
 *
 * Users are discovered via collectionGroup('user_state') because the agent
 * only writes to subcollection paths (users/{userId}/user_state/{appName})
 * and never creates a root users/{userId} document.
 *
 * Each discovered user_state document is mapped to a VanProfileWithId so
 * the dashboard can display it. Full uploaded Van Profile JSONs (if any)
 * at users/{userId} with a profileData field are also included.
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureAuth } from '@/services/authService';
import type { VanProfile, VanProfileWithId } from '@/types/profile';
import type { AgentUserState } from '@/services/liveStateService';

const USERS_COLLECTION = 'users';

function castToProfile(data: DocumentData): VanProfile {
  return data as unknown as VanProfile;
}

/**
 * Maps agent user_state fields to a minimal VanProfileWithId.
 * Fields not yet captured by the agent use safe empty defaults.
 */
function mapAgentStateToProfile(
  userId: string,
  state: AgentUserState,
): VanProfileWithId {
  const models: VanProfile['analyticalScores']['affinities']['models'] =
    state.car_config?.model
      ? [{ value: state.car_config.model as 'EX90', strength: 'high' }]
      : [];

  // location can be a plain string or a map {city, nation, ...}
  const cityValue =
    typeof state.location === 'string'
      ? state.location
      : (state.location as { city?: string } | undefined)?.city ?? null;

  // profiling can be a string[] or a map {key: value, ...}
  const profilingText = Array.isArray(state.profiling)
    ? state.profiling.join(' · ')
    : state.profiling && typeof state.profiling === 'object'
      ? Object.entries(state.profiling)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')
      : null;

  return {
    userId,
    profileData: {
      demographics: {
        name: state.full_name ?? userId,
        email: state.email ?? null,
        city: cityValue,
        maritalStatus: null,
        childrenCount: null,
        affordability: 'medium',
      },
      psychographics: {
        familyLogistician: false,
        styleConsciousCommuter: false,
        highMileCruiser: false,
        interests: null,
        values: null,
      },
      mobilityNeeds: {
        dailyUsage: null,
        weekendUsage: null,
        passengerCount: null,
        cargoNeeds: null,
        currentCar: state.car_config?.model ?? null,
        numberOfCars: null,
        carRenewal: null,
        reasonForBuying: null,
      },
    },
    analyticalScores: {
      segmentRanking: {
        affluentProgressive: 0,
        affluentSocialClimber: 0,
        establishedElite: 0,
        technocentricTrendsetter: 0,
        dominantSegment: 'affluentProgressive',
      },
      propensityToBuy: { score: 0, stage: 'awareness' },
      affinities: {
        powertrain: [],
        models,
        personalDrivers: [],
        productAttributes: [],
      },
    },
    recommendations: {
      engagementStrategy: '',
      nextBestActions: [],
      contentRecommendations: [],
    },
    channelConsent: {
      conversational: true,
      email: false,
      sms: false,
      cookies: false,
    },
    meta: {
      profileCompleteness: 0,
      confidenceScore: 0,
      lastUpdated: new Date().toISOString(),
      sessionsAnalyzed: 0,
      profileCharacteristics: profilingText,
    },
  };
}

/**
 * Fetch a single profile by user ID.
 * Tries a full Van Profile document first, then falls back to user_state.
 */
export async function fetchProfileById(
  userId: string,
): Promise<VanProfileWithId | null> {
  await ensureAuth();

  // 1. Try full Van Profile doc at users/{userId}
  const docRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    if (data['profileData'] !== undefined) {
      return { userId, ...castToProfile(data) };
    }
  }

  // 2. Fall back to agent user_state
  const stateRef = doc(db, USERS_COLLECTION, userId, 'user_state', 'volvo_vaen');
  const stateSnap = await getDoc(stateRef);
  if (!stateSnap.exists()) return null;

  const stateData = stateSnap.data() as { state?: AgentUserState };
  return mapAgentStateToProfile(userId, stateData?.state ?? {});
}

/**
 * Fetch all profiles.
 *
 * Step 1: Full Van Profile docs at users/{userId} (profileData field present).
 * Step 2: collectionGroup('user_state') to discover agent users like manolo.
 */
// Known agent users to fall back to if collectionGroup query fails (missing Firestore rule)
const KNOWN_USER_IDS = ['manolo', 'demo-user'];

export async function fetchAllProfiles(): Promise<VanProfileWithId[]> {
  await ensureAuth();

  const profiles: VanProfileWithId[] = [];
  const seenIds = new Set<string>();

  // Step 1: uploaded Van Profile documents
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data['profileData'] !== undefined) {
        profiles.push({ userId: docSnap.id, ...castToProfile(data) });
        seenIds.add(docSnap.id);
      }
    }
  } catch {
    // collection may be empty — continue to step 2
  }

  // Step 2: agent users discovered via collectionGroup('user_state')
  // Requires a Firestore rule: match /{path=**}/user_state/{docId} { allow read: if request.auth != null; }
  try {
    const stateSnap = await getDocs(collectionGroup(db, 'user_state'));
    for (const docSnap of stateSnap.docs) {
      const userId = docSnap.ref.parent.parent?.id;
      if (!userId || seenIds.has(userId)) continue;

      const data = docSnap.data() as { state?: AgentUserState };
      profiles.push(mapAgentStateToProfile(userId, data?.state ?? {}));
      seenIds.add(userId);
    }
  } catch (err) {
    console.error(
      '[profileService] collectionGroup("user_state") failed — ' +
      'add the wildcard Firestore rule: ' +
      'match /{path=**}/user_state/{docId} { allow read: if request.auth != null; }',
      err,
    );

    // Fallback: direct reads for known user IDs so manolo always appears
    for (const uid of KNOWN_USER_IDS) {
      if (seenIds.has(uid)) continue;
      const stateRef = doc(db, USERS_COLLECTION, uid, 'user_state', 'volvo_vaen');
      try {
        const snap = await getDoc(stateRef);
        if (snap.exists()) {
          const data = snap.data() as { state?: AgentUserState };
          profiles.push(mapAgentStateToProfile(uid, data?.state ?? {}));
          seenIds.add(uid);
        }
      } catch {
        // user doesn't exist — skip silently
      }
    }
  }

  return profiles.filter((p) => {
    const id = p.userId.toLowerCase();
    const name = p.profileData.demographics.name?.toLowerCase() ?? '';
    return !id.includes('demo') && !name.includes('demo');
  });
}

/**
 * Upload (create or overwrite) a Van Profile document.
 */
export async function uploadProfile(
  userId: string,
  profile: VanProfile,
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(docRef, profile);
}
