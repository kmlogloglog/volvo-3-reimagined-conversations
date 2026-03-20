import { useEffect, useState, useRef } from 'react';
import { geminiGenerateJSON } from '@/lib/gemini';
import type { VanProfileWithId, VanProfile } from '@/types/profile';
import type { AgentUserState } from '@/services/liveStateService';

// In-memory cache keyed by userId so we don't re-call Gemini on re-renders
const enrichmentCache = new Map<string, Partial<AIEnrichment>>();

interface AIEnrichment {
  segmentRanking: VanProfile['analyticalScores']['segmentRanking'];
  propensityToBuy: VanProfile['analyticalScores']['propensityToBuy'];
  affinities: VanProfile['analyticalScores']['affinities'];
  recommendations: VanProfile['recommendations'];
  psychographics: VanProfile['profileData']['psychographics'];
  mobilityNeeds: VanProfile['profileData']['mobilityNeeds'];
}

function profileNeedsEnrichment(profile: VanProfileWithId): boolean {
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

function buildEnrichmentPrompt(
  profile: VanProfileWithId,
  agentState: AgentUserState | null,
): string {
  const name = profile.profileData.demographics.name ?? profile.userId;
  const city = profile.profileData.demographics.city ?? '';
  const email = profile.profileData.demographics.email ?? '';
  const carModel = agentState?.car_config?.model ?? profile.profileData.mobilityNeeds.currentCar ?? '';
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
- Selected car: ${carModel} ${carExterior ? `(exterior: ${carExterior})` : ''} ${carInterior ? `(interior: ${carInterior})` : ''} ${carWheels ? `(wheels: ${carWheels}")` : ''}
- Conversation insights: ${profilingLines || profilingText || 'none'}
- Preferences: ${preferences || 'none'}

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
    "currentCar": "${carModel || 'null'}",
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

function mergeEnrichment(
  profile: VanProfileWithId,
  enrichment: Partial<AIEnrichment>,
): VanProfileWithId {
  return {
    ...profile,
    profileData: {
      ...profile.profileData,
      psychographics: enrichment.psychographics ?? profile.profileData.psychographics,
      mobilityNeeds: {
        ...profile.profileData.mobilityNeeds,
        ...(enrichment.mobilityNeeds ?? {}),
        // Keep the real car model if we have one
        currentCar: profile.profileData.mobilityNeeds.currentCar ?? enrichment.mobilityNeeds?.currentCar ?? null,
      },
    },
    analyticalScores: {
      segmentRanking: enrichment.segmentRanking ?? profile.analyticalScores.segmentRanking,
      propensityToBuy: enrichment.propensityToBuy ?? profile.analyticalScores.propensityToBuy,
      affinities: enrichment.affinities ?? profile.analyticalScores.affinities,
    },
    recommendations: enrichment.recommendations ?? profile.recommendations,
  };
}

export function useAIEnrichedProfile(
  profile: VanProfileWithId | null,
  agentState: AgentUserState | null,
): { enrichedProfile: VanProfileWithId | null; isEnriching: boolean } {
  const [enrichment, setEnrichment] = useState<Partial<AIEnrichment> | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const requestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (!profileNeedsEnrichment(profile)) return;

    const uid = profile.userId;

    // Already cached
    const cached = enrichmentCache.get(uid);
    if (cached) {
      setEnrichment(cached);
      return;
    }

    // Already requested this uid
    if (requestedRef.current === uid) return;
    requestedRef.current = uid;

    setIsEnriching(true);
    geminiGenerateJSON<Partial<AIEnrichment>>(buildEnrichmentPrompt(profile, agentState))
      .then((result) => {
        enrichmentCache.set(uid, result);
        setEnrichment(result);
      })
      .catch((err) => {
        console.error('[useAIEnrichedProfile] enrichment failed:', err);
      })
      .finally(() => {
        setIsEnriching(false);
      });
  }, [profile, agentState]);

  if (!profile) return { enrichedProfile: null, isEnriching };

  if (!profileNeedsEnrichment(profile)) {
    return { enrichedProfile: profile, isEnriching: false };
  }

  if (!enrichment) {
    return { enrichedProfile: profile, isEnriching };
  }

  return { enrichedProfile: mergeEnrichment(profile, enrichment), isEnriching };
}
