import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import type { VanProfileWithId, SegmentKey } from '@/types/profile';
import { SEGMENT_LABELS, STAGE_LABELS } from '@/types/profile';
import type { BadgeVariant } from '@/constants/designTokens';

interface ProfileCardProps {
  readonly profile: VanProfileWithId;
  readonly onQuickView: () => void;
  readonly onAdvancedView: () => void;
}

const stageBadgeVariant: Record<string, BadgeVariant> = {
  awareness: 'purple',
  consideration: 'blue',
  decision: 'green',
};

const STAGE_GLOW: Record<string, string> = {
  awareness: 'shadow-[0_0_12px_rgba(192,132,252,0.3)]',
  consideration: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]',
  decision: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]',
};

const SEGMENT_COLORS: Record<string, string> = {
  affluentProgressive: '#FBBF24',
  affluentSocialClimber: '#C084FC',
  establishedElite: '#38BDF8',
  technocentricTrendsetter: '#34D399',
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/20' },
  { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/20' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/20' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/20' },
] as const;

function getAvatarColor(name: string | null): (typeof AVATAR_COLORS)[number] {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index]!;
}

export default function ProfileCard({
  profile,
  onQuickView,
  onAdvancedView,
}: ProfileCardProps): React.JSX.Element {
  const { profileData, analyticalScores, meta } = profile;
  const { demographics } = profileData;
  const { segmentRanking, propensityToBuy } = analyticalScores;

  const name = demographics.name ?? 'Unknown';
  const city = demographics.city ?? 'Unknown city';
  const stageLabel =
    STAGE_LABELS[propensityToBuy.stage] ?? propensityToBuy.stage;
  const stageVariant =
    stageBadgeVariant[propensityToBuy.stage] ?? 'neutral';
  const stageGlow = STAGE_GLOW[propensityToBuy.stage] ?? '';
  const avatarColor = getAvatarColor(demographics.name);

  // Mini donut data
  const donutData = [
    { name: 'score', value: propensityToBuy.score },
    { name: 'remainder', value: 100 - propensityToBuy.score },
  ];

  // Segment bar data
  const segmentEntries: Array<{ key: SegmentKey; value: number; color: string }> = [
    { key: 'affluentProgressive' as const, value: segmentRanking.affluentProgressive, color: SEGMENT_COLORS['affluentProgressive'] ?? '#FBBF24' },
    { key: 'affluentSocialClimber' as const, value: segmentRanking.affluentSocialClimber, color: SEGMENT_COLORS['affluentSocialClimber'] ?? '#C084FC' },
    { key: 'establishedElite' as const, value: segmentRanking.establishedElite, color: SEGMENT_COLORS['establishedElite'] ?? '#38BDF8' },
    { key: 'technocentricTrendsetter' as const, value: segmentRanking.technocentricTrendsetter, color: SEGMENT_COLORS['technocentricTrendsetter'] ?? '#34D399' },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="group/card">
      {/* Clickable card body -> Quick View */}
      <button
        type="button"
        onClick={onQuickView}
        className="w-full text-left"
      >
        <GlassCard className="transition-all duration-300 pb-3">
          {/* Top: avatar + name + city — translateZ for parallax depth inside tilt */}
          <div className="flex items-center gap-3 mb-5" style={{ transform: 'translateZ(20px)' }}>
            <div
              className={`w-12 h-12 rounded-full ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} border flex items-center justify-center font-medium text-sm shrink-0`}
            >
              {getInitials(demographics.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base text-white font-medium truncate">{name}</div>
              <div className="text-xs text-neutral-500 truncate">{city}</div>
            </div>
            <Icon
              icon="solar:bolt-circle-linear"
              width={16}
              className="text-neutral-600 group-hover/card:text-amber-400 transition-colors shrink-0"
            />
          </div>

          {/* Center: Mini propensity donut — translateZ for depth */}
          <div className="flex items-center justify-center mb-4" style={{ transform: 'translateZ(20px)' }}>
            <div className="relative" style={{ width: 120, height: 120, filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.2))' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={50}
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    <Cell fill="#FBBF24" />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-heading font-bold text-white">
                  <NumberFlow value={propensityToBuy.score} />
                </span>
                <span className="text-[9px] text-neutral-500">Propensity</span>
              </div>
            </div>
          </div>

          {/* Stage badge */}
          <div className={`flex justify-center mb-4 ${stageGlow}`}>
            <StatusBadge label={stageLabel} variant={stageVariant} />
          </div>

          {/* Stacked segment bar — animated fills */}
          <div className="mb-3">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              {segmentEntries.map((seg, i) => (
                <motion.div
                  key={seg.key}
                  initial={{ width: 0 }}
                  animate={{ width: `${String(seg.value)}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                  style={{ backgroundColor: seg.color }}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                />
              ))}
            </div>
          </div>

          {/* Segment legend (compact) */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {segmentEntries.map((seg) => (
              <div key={seg.key} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[9px] text-neutral-500">
                  {SEGMENT_LABELS[seg.key]?.split(' ').pop() ?? seg.key} {seg.value}%
                </span>
              </div>
            ))}
          </div>

          {/* Completeness footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Completeness</span>
            <span className="text-neutral-300">
              <NumberFlow value={meta.profileCompleteness} suffix="%" />
            </span>
          </div>
        </GlassCard>
      </button>

      {/* Action row below card */}
      <div className="flex gap-2 mt-2 px-1">
        <button
          type="button"
          onClick={onQuickView}
          className="van-ripple flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium hover:bg-amber-500/20 transition-colors"
        >
          <Icon icon="solar:bolt-circle-linear" width={13} />
          Quick View
        </button>
        <button
          type="button"
          onClick={onAdvancedView}
          className="van-ripple flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-neutral-400 font-medium hover:bg-white/[0.07] hover:text-white transition-colors"
        >
          <Icon icon="solar:chart-2-linear" width={13} />
          Advanced View
        </button>
      </div>
    </div>
  );
}
