import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import type { VanProfile, SegmentKey } from '@/types/profile';
import { SEGMENT_LABELS } from '@/types/profile';

interface SegmentRankingProps {
  readonly profile: VanProfile;
}

/** Ordered list of segment keys for rendering */
const SEGMENT_KEYS: readonly SegmentKey[] = [
  'affluentProgressive',
  'affluentSocialClimber',
  'establishedElite',
  'technocentricTrendsetter',
];

export default function SegmentRanking({
  profile,
}: SegmentRankingProps): React.JSX.Element | null {
  const { segmentRanking } = profile.analyticalScores;
  const { dominantSegment } = segmentRanking;

  // Calculate sum for validation
  const sum = SEGMENT_KEYS.reduce(
    (acc, key) => acc + segmentRanking[key],
    0,
  );

  // No data — don't render an empty card
  if (sum === 0) return null;

  const isValid = sum === 100;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Segment Ranking" />
        {!isValid && (
          <StatusBadge
            label={`Sum: ${sum}%`}
            variant="amber"
            showDot={false}
          />
        )}
      </div>

      {/* Validation warning */}
      {!isValid && (
        <div className="flex items-center gap-2 p-2 mb-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <Icon
            icon="solar:danger-triangle-linear"
            width={14}
            className="text-amber-400 shrink-0"
          />
          <p className="text-[10px] text-amber-200/70">
            Segment scores should total 100% (currently {sum}%)
          </p>
        </div>
      )}

      {/* Segment bars */}
      <div className="space-y-4">
        {SEGMENT_KEYS.map((key, index) => {
          const value = segmentRanking[key];
          const isDominant = key === dominantSegment;
          const label = SEGMENT_LABELS[key] ?? key;

          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white flex items-center gap-2">
                  {isDominant && (
                    <Icon
                      icon="solar:crown-minimalistic-linear"
                      width={14}
                      className="text-amber-400"
                    />
                  )}
                  {label}
                </span>
                <span className="text-neutral-400">
                  <NumberFlow value={value} suffix="%" />
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isDominant ? 'bg-neutral-200' : 'bg-neutral-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dominant segment callout */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Dominant</span>
        <StatusBadge
          label={SEGMENT_LABELS[dominantSegment] ?? dominantSegment}
          variant="amber"
        />
      </div>
    </GlassCard>
  );
}
