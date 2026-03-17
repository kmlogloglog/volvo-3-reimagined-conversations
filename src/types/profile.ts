/**
 * Complete TypeScript type definitions for the Vän Profile schema.
 *
 * Source of truth: Van_Profile_Schema.json
 * Every field, nested structure, and enum value is defined here.
 * No `any` types — strict mode compliant.
 */

// ────────────────────────────────────────────
//  Root profile
// ────────────────────────────────────────────

export interface VanProfile {
  readonly profileData: ProfileData;
  readonly analyticalScores: AnalyticalScores;
  readonly recommendations: Recommendations;
  readonly channelConsent: ChannelConsent;
  readonly meta: ProfileMeta;
}

/**
 * Extended profile type that includes the Firestore user ID.
 * Used in the profiles list where we need the document key.
 */
export interface VanProfileWithId extends VanProfile {
  readonly userId: string;
}

// ────────────────────────────────────────────
//  Profile Data (Left column)
// ────────────────────────────────────────────

export interface ProfileData {
  readonly demographics: Demographics;
  readonly psychographics: Psychographics;
  readonly mobilityNeeds: MobilityNeeds;
}

export interface Demographics {
  readonly name: string | null;
  readonly email: string | null;
  readonly city: string | null;
  readonly maritalStatus: MaritalStatus | null;
  readonly childrenCount: number | null;
  readonly affordability: Affordability;
}

export type MaritalStatus = 'married' | 'single' | 'divorced' | 'partner';
export type Affordability = 'high' | 'medium' | 'low';

export interface Psychographics {
  readonly familyLogistician: boolean;
  readonly styleConsciousCommuter: boolean;
  readonly highMileCruiser: boolean;
  readonly interests: readonly string[] | null;
  readonly values: readonly string[] | null;
}

export interface MobilityNeeds {
  readonly dailyUsage: DailyUsage | null;
  readonly weekendUsage: readonly WeekendActivity[] | null;
  readonly passengerCount: number | null;
  readonly cargoNeeds: CargoNeeds | null;
  readonly currentCar: string | null;
  readonly numberOfCars: number | null;
  readonly carRenewal: CarRenewal | null;
  readonly reasonForBuying: string | null;
}

export type DailyUsage = 'city' | 'highway' | 'mixed';
export type WeekendActivity = 'cabin' | 'sports' | 'errands' | 'family_activities';
export type CargoNeeds = 'high' | 'medium' | 'low';
export type CarRenewal = 'renew' | 'first_buy';

// ────────────────────────────────────────────
//  Analytical Scores (Center column)
// ────────────────────────────────────────────

export interface AnalyticalScores {
  readonly segmentRanking: SegmentRanking;
  readonly propensityToBuy: PropensityToBuy;
  readonly affinities: Affinities;
}

export interface SegmentRanking {
  readonly affluentProgressive: number;
  readonly affluentSocialClimber: number;
  readonly establishedElite: number;
  readonly technocentricTrendsetter: number;
  readonly dominantSegment: SegmentKey;
}

export type SegmentKey =
  | 'affluentProgressive'
  | 'affluentSocialClimber'
  | 'establishedElite'
  | 'technocentricTrendsetter';

export interface PropensityToBuy {
  readonly score: number;
  readonly stage: PropensityStage;
}

export type PropensityStage = 'awareness' | 'consideration' | 'decision';

export interface Affinities {
  readonly powertrain: readonly AffinityItem<PowertrainValue>[];
  readonly models: readonly AffinityItem<ModelValue>[];
  readonly personalDrivers: readonly AffinityItem<PersonalDriverValue>[];
  readonly productAttributes: readonly AffinityItem<ProductAttributeValue>[];
}

export interface AffinityItem<T extends string = string> {
  readonly value: T;
  readonly strength: AffinityStrength;
}

export type AffinityStrength = 'high' | 'medium' | 'low';

export type PowertrainValue = 'electric' | 'plugInHybrid' | 'mildHybrid';
export type ModelValue = 'EX90' | 'EX60' | 'EX30' | 'CX90' | 'CX60' | 'CX40';
export type PersonalDriverValue =
  | 'socialValidation'
  | 'responsibility'
  | 'fun'
  | 'security'
  | 'qualityOfLife';
export type ProductAttributeValue = 'performance' | 'luxury' | 'technology' | 'safety';

// ────────────────────────────────────────────
//  Recommendations (Right column)
// ────────────────────────────────────────────

export interface Recommendations {
  readonly engagementStrategy: string;
  readonly nextBestActions: readonly NextBestAction[];
  readonly contentRecommendations: readonly ContentRecommendation[];
}

export interface NextBestAction {
  readonly action: NextBestActionType;
  readonly likelihood: number;
  readonly reasoning: string;
}

export type NextBestActionType =
  | 'bookTestDrive'
  | 'completeConfiguration'
  | 'completeOrder'
  | 'contactDealer'
  | 'viewContent';

export interface ContentRecommendation {
  readonly topic: string;
  readonly relevanceScore: number;
}

// ────────────────────────────────────────────
//  Channel Consent
// ────────────────────────────────────────────

export interface ChannelConsent {
  readonly conversational: boolean;
  readonly email: boolean;
  readonly sms: boolean;
}

// ────────────────────────────────────────────
//  Profile Metadata
// ────────────────────────────────────────────

export interface ProfileMeta {
  readonly profileCompleteness: number;
  readonly confidenceScore: number;
  readonly lastUpdated: string;
  readonly sessionsAnalyzed: number;
  readonly profileCharacteristics: string | null;
}

// ────────────────────────────────────────────
//  Display helpers
// ────────────────────────────────────────────

/** Readable labels for segment keys */
export const SEGMENT_LABELS: Readonly<Record<SegmentKey, string>> = {
  affluentProgressive: 'Affluent Progressive',
  affluentSocialClimber: 'Affluent Social Climber',
  establishedElite: 'Established Elite',
  technocentricTrendsetter: 'Technocentric Trendsetter',
};

/** Readable labels for propensity stages */
export const STAGE_LABELS: Readonly<Record<PropensityStage, string>> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  decision: 'Decision',
};

/** Readable labels for next-best-action types */
export const ACTION_LABELS: Readonly<Record<NextBestActionType, string>> = {
  bookTestDrive: 'Book Test Drive',
  completeConfiguration: 'Complete Configuration',
  completeOrder: 'Complete Order',
  contactDealer: 'Contact Dealer',
  viewContent: 'View Content',
};
