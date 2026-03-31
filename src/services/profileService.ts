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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureAuth } from '@/services/authService';
import { geminiGenerateJSON } from '@/lib/gemini';
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
export function mapAgentStateToProfile(
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

  // Heuristic propensity score based on engagement signals
  let propensityScore = 10; // baseline for having a conversation
  if (state.full_name) propensityScore += 10;
  if (state.email) propensityScore += 15;
  if (state.location) propensityScore += 10;
  if (state.car_config?.model) propensityScore += 20;
  if (state.car_config?.exterior) propensityScore += 5;
  if (state.car_config?.interior) propensityScore += 5;
  if (state.car_config?.wheels) propensityScore += 5;
  if (state.profiling) propensityScore += 10;
  if (state.test_drive_appointment) propensityScore += 25;
  if (state.preferences) propensityScore += 5;
  propensityScore = Math.min(propensityScore, 100);

  const propensityStage: 'awareness' | 'consideration' | 'decision' =
    propensityScore >= 65 ? 'decision' : propensityScore >= 35 ? 'consideration' : 'awareness';

  // Profile completeness mirrors propensity (how much data we collected)
  const completeness = Math.min(propensityScore, 100);

  return {
    userId,
    profileData: {
      demographics: {
        name: state.full_name ?? null,
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
        currentCar: state.current_car ?? null,
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
      propensityToBuy: { score: propensityScore, stage: propensityStage },
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
      profileCompleteness: completeness,
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

  return profiles.filter((p) => p.userId !== 'demo-jon');
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

/**
 * Delete a profile from Firestore.
 * Removes both the full Van Profile doc (users/{userId}) and the agent
 * user_state subcollection doc (users/{userId}/user_state/volvo_vaen).
 */
export async function deleteProfile(userId: string): Promise<void> {
  await ensureAuth();

  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const stateDocRef = doc(db, USERS_COLLECTION, userId, 'user_state', 'volvo_vaen');

  // Delete both in parallel; ignore if they don't exist
  await Promise.allSettled([deleteDoc(userDocRef), deleteDoc(stateDocRef)]);
}

// ─── AI Enrichment + Persistence ────────────────────────────────

interface EnrichmentResult {
  segmentRanking: VanProfile['analyticalScores']['segmentRanking'];
  propensityToBuy: VanProfile['analyticalScores']['propensityToBuy'];
  affinities: VanProfile['analyticalScores']['affinities'];
  recommendations: VanProfile['recommendations'];
  psychographics: VanProfile['profileData']['psychographics'];
  mobilityNeeds: VanProfile['profileData']['mobilityNeeds'];
}

/**
 * Returns true if a profile is sparse (agent-generated) and needs AI enrichment.
 */
export function profileNeedsEnrichment(profile: VanProfileWithId): boolean {
  const { segmentRanking, affinities } = profile.analyticalScores;
  const segmentSum =
    segmentRanking.affluentProgressive +
    segmentRanking.affluentSocialClimber +
    segmentRanking.establishedElite +
    segmentRanking.technocentricTrendsetter;
  const totalAffinities =
    affinities.powertrain.length +
    affinities.models.length +
    affinities.personalDrivers.length +
    affinities.productAttributes.length;
  return (
    segmentSum === 0 &&
    totalAffinities <= 1 &&
    profile.recommendations.nextBestActions.length === 0
  );
}

async function readConversationSummary(userId: string): Promise<string> {
  try {
    const memRef = doc(db, USERS_COLLECTION, userId, 'memories', 'interactions_summary');
    const memSnap = await getDoc(memRef);
    if (!memSnap.exists()) return '';
    const data = memSnap.data();
    return typeof data?.value === 'string' ? data.value : '';
  } catch {
    return '';
  }
}

function buildEnrichmentPrompt(
  profile: VanProfileWithId,
  agentState: AgentUserState | null,
  conversationSummary: string,
): string {
  const name = profile.profileData.demographics.name ?? 'Unknown';
  const city = profile.profileData.demographics.city ?? '';
  const email = profile.profileData.demographics.email ?? '';
  const carModel = agentState?.car_config?.model ?? '';
  const carExterior = agentState?.car_config?.exterior ?? '';
  const carInterior = agentState?.car_config?.interior ?? '';
  const carWheels = agentState?.car_config?.wheels ?? '';
  const profilingText = profile.meta.profileCharacteristics ?? '';
  const preferences = agentState?.preferences ?? '';

  const profiling = agentState?.profiling;
  const profilingLines =
    profiling && typeof profiling === 'object' && !Array.isArray(profiling)
      ? Object.entries(profiling).map(([k, v]) => `${k}: ${v}`).join(', ')
      : Array.isArray(profiling)
        ? profiling.join(', ')
        : '';

  return `You are a Volvo automotive CRM analyst. Based on the customer data below, generate a complete analytical profile. Infer plausible values from the available data — be realistic and consistent with a premium Volvo buyer persona.

Customer data:
- Name: ${name}
- Location: ${city}
- Email: ${email}
- Volvo model of interest: ${carModel || 'unknown'} ${carExterior ? `(exterior: ${carExterior})` : ''} ${carInterior ? `(interior: ${carInterior})` : ''} ${carWheels ? `(wheels: ${carWheels})` : ''}
- Conversation insights: ${profilingLines || profilingText || 'none'}
- Preferences: ${preferences || 'none'}${conversationSummary ? `\n- Conversation summary: ${conversationSummary}` : ''}

Return a JSON object with exactly this structure:
{
  "segmentRanking": {
    "affluentProgressive": <number 0-100>,
    "affluentSocialClimber": <number 0-100>,
    "establishedElite": <number 0-100>,
    "technocentricTrendsetter": <number 0-100>,
    "dominantSegment": "<key of the highest>"
  },
  "propensityToBuy": {
    "score": <number 0-100>,
    "stage": "<awareness|consideration|decision>"
  },
  "affinities": {
    "powertrain": [{"value": "<electric|plugInHybrid|mildHybrid>", "strength": "<high|medium|low>"}],
    "models": [{"value": "<EX90|EX60|EX30|CX90|CX60|CX40>", "strength": "<high|medium|low>"}],
    "personalDrivers": [{"value": "<socialValidation|responsibility|fun|security|qualityOfLife>", "strength": "<high|medium|low>"}],
    "productAttributes": [{"value": "<performance|luxury|technology|safety>", "strength": "<high|medium|low>"}]
  },
  "recommendations": {
    "engagementStrategy": "<2-3 sentence strategy>",
    "nextBestActions": [
      {"action": "<bookTestDrive|completeConfiguration|completeOrder|contactDealer|viewContent>", "likelihood": <number 0-100>, "reasoning": "<1 sentence>"}
    ],
    "contentRecommendations": [
      {"topic": "<string>", "relevanceScore": <number 0-100>}
    ]
  },
  "psychographics": {
    "familyLogistician": <boolean>,
    "styleConsciousCommuter": <boolean>,
    "highMileCruiser": <boolean>,
    "interests": ["<string>", ...],
    "values": ["<string>", ...]
  },
  "mobilityNeeds": {
    "dailyUsage": "<city|highway|mixed>",
    "weekendUsage": ["<cabin|sports|errands|family_activities>"],
    "passengerCount": <number>,
    "cargoNeeds": "<high|medium|low>",
    "currentCar": "<infer the customer's CURRENT car if possible, otherwise null — NOT the Volvo model of interest>",
    "numberOfCars": <number>,
    "carRenewal": "<renew|first_buy>",
    "reasonForBuying": "<string>"
  }
}

Rules:
- segmentRanking values MUST total exactly 100
- Include 1-3 items per affinity category
- Include 2-3 nextBestActions
- Include 2-4 contentRecommendations
- Include 2-4 interests and 2-3 values
- Return ONLY valid JSON, no markdown`;
}

function mergeEnrichmentIntoProfile(
  profile: VanProfileWithId,
  enrichment: Partial<EnrichmentResult>,
): VanProfileWithId {
  return {
    ...profile,
    profileData: {
      ...profile.profileData,
      psychographics: enrichment.psychographics ?? profile.profileData.psychographics,
      mobilityNeeds: {
        ...profile.profileData.mobilityNeeds,
        ...(enrichment.mobilityNeeds ?? {}),
        currentCar: profile.profileData.mobilityNeeds.currentCar ?? enrichment.mobilityNeeds?.currentCar ?? null,
      },
    },
    analyticalScores: {
      segmentRanking: enrichment.segmentRanking ?? profile.analyticalScores.segmentRanking,
      propensityToBuy: enrichment.propensityToBuy ?? profile.analyticalScores.propensityToBuy,
      affinities: enrichment.affinities ?? profile.analyticalScores.affinities,
    },
    recommendations: enrichment.recommendations ?? profile.recommendations,
    meta: {
      ...profile.meta,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Enrich a sparse agent profile via Gemini and persist the full
 * Van Profile document to Firestore at users/{userId}.
 *
 * Reads the agent's user_state and conversation summary (memories)
 * to provide context for the enrichment prompt.
 */
export async function enrichAndPersistProfile(
  profile: VanProfileWithId,
): Promise<VanProfileWithId> {
  await ensureAuth();

  // Read agent state
  const stateRef = doc(db, USERS_COLLECTION, profile.userId, 'user_state', 'volvo_vaen');
  const stateSnap = await getDoc(stateRef);
  const agentState = stateSnap.exists()
    ? (stateSnap.data() as { state?: AgentUserState })?.state ?? null
    : null;

  // Read conversation summary from memories
  const conversationSummary = await readConversationSummary(profile.userId);

  // Call Gemini for enrichment
  const prompt = buildEnrichmentPrompt(profile, agentState, conversationSummary);
  const enrichment = await geminiGenerateJSON<Partial<EnrichmentResult>>(prompt);

  // Merge enrichment into profile
  const enrichedProfile = mergeEnrichmentIntoProfile(profile, enrichment);

  // Persist to Firestore as a full Van Profile doc
  const { userId, ...vanProfile } = enrichedProfile;
  await setDoc(doc(db, USERS_COLLECTION, userId), vanProfile);

  return enrichedProfile;
}
