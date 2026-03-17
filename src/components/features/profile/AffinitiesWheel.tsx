import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import type { VanProfile, AffinityStrength } from '@/types/profile';

interface AffinitiesWheelProps {
  readonly profile: VanProfile;
}

// ── Readable label maps for affinity values ──

const POWERTRAIN_LABELS: Record<string, string> = {
  electric: 'Electric',
  plugInHybrid: 'Plug-in Hybrid',
  mildHybrid: 'Mild Hybrid',
};

const MODEL_LABELS: Record<string, string> = {
  EX90: 'EX90',
  EX60: 'EX60',
  EX30: 'EX30',
  CX90: 'CX90',
  CX60: 'CX60',
  CX40: 'CX40',
};

const DRIVER_LABELS: Record<string, string> = {
  socialValidation: 'Social Validation',
  responsibility: 'Responsibility',
  fun: 'Fun',
  security: 'Security',
  qualityOfLife: 'Quality of Life',
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  performance: 'Performance',
  luxury: 'Luxury',
  technology: 'Technology',
  safety: 'Safety',
};

// ── Strength visual styling ──

const STRENGTH_STYLES: Record<AffinityStrength, { text: string; bg: string; dot: string }> = {
  high: { text: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  medium: { text: 'text-neutral-300', bg: 'bg-white/5', dot: 'bg-neutral-300' },
  low: { text: 'text-neutral-500', bg: 'bg-white/[0.02]', dot: 'bg-neutral-500' },
};

const STRENGTH_ORDER: Record<AffinityStrength, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ── Quadrant config ──

interface QuadrantConfig {
  readonly key: 'powertrain' | 'models' | 'personalDrivers' | 'productAttributes';
  readonly title: string;
  readonly icon: string;
  readonly labels: Record<string, string>;
}

const QUADRANTS: readonly QuadrantConfig[] = [
  { key: 'powertrain', title: 'Powertrain', icon: 'solar:bolt-linear', labels: POWERTRAIN_LABELS },
  { key: 'models', title: 'Models', icon: 'solar:car-linear', labels: MODEL_LABELS },
  { key: 'personalDrivers', title: 'Personal Drivers', icon: 'solar:heart-linear', labels: DRIVER_LABELS },
  { key: 'productAttributes', title: 'Product Attributes', icon: 'solar:star-linear', labels: ATTRIBUTE_LABELS },
] as const;

/**
 * Displays a 2×2 grid of affinity quadrants with strength-colored items.
 *
 * Uses the grid fallback approach (per CLAUDE.md: start with 2×2 grid
 * if radial is too complex). Items are sorted by strength (high → low).
 */
export default function AffinitiesWheel({
  profile,
}: AffinitiesWheelProps): React.JSX.Element {
  const { affinities } = profile.analyticalScores;

  return (
    <GlassCard>
      <SectionHeader title="Affinities" className="mb-4" />

      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map((quadrant) => {
          const items = [...affinities[quadrant.key]].sort(
            (a, b) => STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength],
          );

          return (
            <div
              key={quadrant.key}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
            >
              {/* Quadrant header */}
              <div className="flex items-center gap-1.5 mb-3">
                <Icon
                  icon={quadrant.icon}
                  width={14}
                  className="text-neutral-500"
                />
                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                  {quadrant.title}
                </span>
              </div>

              {/* Items */}
              {items.length === 0 ? (
                <p className="text-[10px] text-neutral-600">No affinities</p>
              ) : (
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const style = STRENGTH_STYLES[item.strength];
                    const label =
                      quadrant.labels[item.value] ?? item.value;

                    return (
                      <div
                        key={item.value}
                        className={`flex items-center gap-2 px-2 py-1 rounded ${style.bg}`}
                        title={`${label} — ${item.strength} affinity`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}
                        />
                        <span
                          className={`text-xs ${style.text} truncate`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Strength legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        {(['high', 'medium', 'low'] as const).map((strength) => {
          const style = STRENGTH_STYLES[strength];
          return (
            <div key={strength} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              <span className="text-[10px] text-neutral-500 capitalize">
                {strength}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
