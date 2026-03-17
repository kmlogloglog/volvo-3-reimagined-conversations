/**
 * Runtime validation for Vän Profile JSON.
 *
 * Validates required fields, types, enum values, and constraints
 * (e.g. segment scores must sum to 100). Returns a typed result
 * with either the validated profile or an array of error strings.
 */

import type { VanProfile } from '@/types/profile';

// ── Result type ──

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly profile: VanProfile | null;
}

// ── Valid enum sets ──

const VALID_MARITAL = new Set(['married', 'single', 'divorced', 'partner']);
const VALID_AFFORDABILITY = new Set(['high', 'medium', 'low']);
const VALID_DAILY_USAGE = new Set(['city', 'highway', 'mixed']);
const VALID_WEEKEND = new Set(['cabin', 'sports', 'errands', 'family_activities']);
const VALID_CARGO = new Set(['high', 'medium', 'low']);
const VALID_RENEWAL = new Set(['renew', 'first_buy']);
const VALID_SEGMENTS = new Set([
  'affluentProgressive',
  'affluentSocialClimber',
  'establishedElite',
  'technocentricTrendsetter',
]);
const VALID_STAGES = new Set(['awareness', 'consideration', 'decision']);
const VALID_STRENGTH = new Set(['high', 'medium', 'low']);
const VALID_ACTIONS = new Set([
  'bookTestDrive',
  'completeConfiguration',
  'completeOrder',
  'contactDealer',
  'viewContent',
]);

// ── Helpers ──

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function checkEnum(
  value: unknown,
  allowed: Set<string>,
  fieldPath: string,
  errors: string[],
): void {
  if (value === null || value === undefined) return;
  if (typeof value !== 'string' || !allowed.has(value)) {
    errors.push(`${fieldPath}: invalid value "${String(value)}". Expected one of: ${[...allowed].join(', ')}`);
  }
}

function checkNumber(
  value: unknown,
  fieldPath: string,
  errors: string[],
  min?: number,
  max?: number,
): void {
  if (typeof value !== 'number') {
    errors.push(`${fieldPath}: expected number, got ${typeof value}`);
    return;
  }
  if (min !== undefined && value < min) {
    errors.push(`${fieldPath}: value ${value} is below minimum ${min}`);
  }
  if (max !== undefined && value > max) {
    errors.push(`${fieldPath}: value ${value} exceeds maximum ${max}`);
  }
}

// ── Main validator ──

export function validateVanProfile(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, errors: ['Root value must be an object'], profile: null };
  }

  // ── Required top-level sections ──
  const required = ['profileData', 'analyticalScores', 'recommendations', 'channelConsent', 'meta'] as const;
  for (const key of required) {
    if (!isObject(data[key])) {
      errors.push(`Missing or invalid required section: "${key}"`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, profile: null };
  }

  const pd = data['profileData'] as Record<string, unknown>;
  const as = data['analyticalScores'] as Record<string, unknown>;
  const rec = data['recommendations'] as Record<string, unknown>;
  const cc = data['channelConsent'] as Record<string, unknown>;
  const meta = data['meta'] as Record<string, unknown>;

  // ── profileData ──
  if (isObject(pd['demographics'])) {
    const d = pd['demographics'] as Record<string, unknown>;
    if (d['maritalStatus'] !== null && d['maritalStatus'] !== undefined) {
      checkEnum(d['maritalStatus'], VALID_MARITAL, 'demographics.maritalStatus', errors);
    }
    checkEnum(d['affordability'], VALID_AFFORDABILITY, 'demographics.affordability', errors);
  } else {
    errors.push('profileData.demographics is required');
  }

  if (isObject(pd['psychographics'])) {
    // booleans are flexible — just need to be present
  } else {
    errors.push('profileData.psychographics is required');
  }

  if (isObject(pd['mobilityNeeds'])) {
    const m = pd['mobilityNeeds'] as Record<string, unknown>;
    if (m['dailyUsage'] !== null && m['dailyUsage'] !== undefined) {
      checkEnum(m['dailyUsage'], VALID_DAILY_USAGE, 'mobilityNeeds.dailyUsage', errors);
    }
    if (Array.isArray(m['weekendUsage'])) {
      for (const item of m['weekendUsage'] as unknown[]) {
        checkEnum(item, VALID_WEEKEND, 'mobilityNeeds.weekendUsage[]', errors);
      }
    }
    if (m['cargoNeeds'] !== null && m['cargoNeeds'] !== undefined) {
      checkEnum(m['cargoNeeds'], VALID_CARGO, 'mobilityNeeds.cargoNeeds', errors);
    }
    if (m['carRenewal'] !== null && m['carRenewal'] !== undefined) {
      checkEnum(m['carRenewal'], VALID_RENEWAL, 'mobilityNeeds.carRenewal', errors);
    }
  } else {
    errors.push('profileData.mobilityNeeds is required');
  }

  // ── analyticalScores ──
  if (isObject(as['segmentRanking'])) {
    const sr = as['segmentRanking'] as Record<string, unknown>;
    const segmentKeys = ['affluentProgressive', 'affluentSocialClimber', 'establishedElite', 'technocentricTrendsetter'] as const;

    let sum = 0;
    for (const key of segmentKeys) {
      checkNumber(sr[key], `segmentRanking.${key}`, errors, 0, 100);
      if (typeof sr[key] === 'number') {
        sum += sr[key] as number;
      }
    }

    if (sum !== 100) {
      errors.push(`segmentRanking: scores sum to ${sum}, expected 100`);
    }

    checkEnum(sr['dominantSegment'], VALID_SEGMENTS, 'segmentRanking.dominantSegment', errors);
  } else {
    errors.push('analyticalScores.segmentRanking is required');
  }

  if (isObject(as['propensityToBuy'])) {
    const ptb = as['propensityToBuy'] as Record<string, unknown>;
    checkNumber(ptb['score'], 'propensityToBuy.score', errors, 0, 100);
    checkEnum(ptb['stage'], VALID_STAGES, 'propensityToBuy.stage', errors);
  } else {
    errors.push('analyticalScores.propensityToBuy is required');
  }

  if (isObject(as['affinities'])) {
    const aff = as['affinities'] as Record<string, unknown>;
    const quadrants = ['powertrain', 'models', 'personalDrivers', 'productAttributes'] as const;

    for (const q of quadrants) {
      if (Array.isArray(aff[q])) {
        for (const item of aff[q] as unknown[]) {
          if (isObject(item)) {
            checkEnum(
              (item as Record<string, unknown>)['strength'],
              VALID_STRENGTH,
              `affinities.${q}[].strength`,
              errors,
            );
          }
        }
      }
    }
  } else {
    errors.push('analyticalScores.affinities is required');
  }

  // ── recommendations ──
  if (typeof rec['engagementStrategy'] !== 'string') {
    errors.push('recommendations.engagementStrategy must be a string');
  }

  if (Array.isArray(rec['nextBestActions'])) {
    for (const nba of rec['nextBestActions'] as unknown[]) {
      if (isObject(nba)) {
        checkEnum(
          (nba as Record<string, unknown>)['action'],
          VALID_ACTIONS,
          'nextBestActions[].action',
          errors,
        );
        checkNumber(
          (nba as Record<string, unknown>)['likelihood'],
          'nextBestActions[].likelihood',
          errors,
          0,
          100,
        );
      }
    }
  } else {
    errors.push('recommendations.nextBestActions must be an array');
  }

  if (!Array.isArray(rec['contentRecommendations'])) {
    errors.push('recommendations.contentRecommendations must be an array');
  }

  // ── channelConsent ──
  if (typeof cc['conversational'] !== 'boolean') {
    errors.push('channelConsent.conversational must be a boolean');
  }
  if (typeof cc['email'] !== 'boolean') {
    errors.push('channelConsent.email must be a boolean');
  }
  if (typeof cc['sms'] !== 'boolean') {
    errors.push('channelConsent.sms must be a boolean');
  }

  // ── meta ──
  checkNumber(meta['profileCompleteness'], 'meta.profileCompleteness', errors, 0, 100);
  checkNumber(meta['confidenceScore'], 'meta.confidenceScore', errors, 0, 100);
  checkNumber(meta['sessionsAnalyzed'], 'meta.sessionsAnalyzed', errors, 1);

  if (typeof meta['lastUpdated'] !== 'string') {
    errors.push('meta.lastUpdated must be an ISO 8601 string');
  }

  // ── Result ──
  if (errors.length > 0) {
    return { valid: false, errors, profile: null };
  }

  return { valid: true, errors: [], profile: data as unknown as VanProfile };
}
