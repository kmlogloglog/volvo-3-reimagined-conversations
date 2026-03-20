import { Icon } from '@iconify/react';
import NumberFlow from '@number-flow/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import type { VanProfile } from '@/types/profile';
import { STAGE_LABELS } from '@/types/profile';
import type { BadgeVariant } from '@/constants/designTokens';

interface PropensityGaugeProps {
  readonly profile: VanProfile;
}

/** Map propensity stage -> badge variant */
const STAGE_BADGE: Record<string, BadgeVariant> = {
  awareness: 'purple',
  consideration: 'blue',
  decision: 'green',
};

export default function PropensityGauge({
  profile,
}: PropensityGaugeProps): React.JSX.Element | null {
  const { score, stage } = profile.analyticalScores.propensityToBuy;

  // No score data yet
  if (score === 0 && stage === 'awareness') return null;
  const stageLabel = STAGE_LABELS[stage] ?? stage;
  const badgeVariant = STAGE_BADGE[stage] ?? 'neutral';

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Gradient corner overlay */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Icon
            icon="solar:stars-minimalistic-linear"
            width={20}
            className="text-yellow-500 animate-pulse-glow"
          />
          <SectionHeader title="Propensity to Buy" />
        </div>

        {/* Centered score circle with spinning border + pulsing glow */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative mb-4 animate-pulse-glow">
            {/* Spinning accent border */}
            <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full animate-[spin_8s_linear_infinite]" />
            <span className="text-2xl font-heading font-medium text-white">
              <NumberFlow value={score} trend={1} />
            </span>
          </div>

          {/* Stage badge */}
          <StatusBadge label={stageLabel} variant={badgeVariant} />

          {/* Score context */}
          <p className="text-[11px] text-white/40 leading-relaxed mt-3 max-w-[200px]">
            {score <= 33
              ? 'Early-stage interest -- awareness building recommended'
              : score <= 66
                ? 'Active consideration -- engagement opportunities available'
                : 'High intent -- conversion-focused actions recommended'}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
