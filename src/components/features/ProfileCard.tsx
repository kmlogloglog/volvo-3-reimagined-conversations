import { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'motion/react';
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
  readonly onDelete: () => Promise<void>;
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
  onDelete,
}: ProfileCardProps): React.JSX.Element {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { profileData, analyticalScores, meta } = profile;
  const { demographics } = profileData;
  const { segmentRanking, propensityToBuy } = analyticalScores;

  const name = demographics.name ?? 'Unknown';
  const avatarColor = getAvatarColor(demographics.name ?? profile.userId);
  const carOfInterest = analyticalScores.affinities.models[0]?.value ?? null;
  const traits = meta.profileCharacteristics
    ? meta.profileCharacteristics.split(' · ').slice(0, 4)
    : [];
  const email = demographics.email ?? null;

  const stageLabel = STAGE_LABELS[propensityToBuy.stage] ?? propensityToBuy.stage;
  const stageVariant = stageBadgeVariant[propensityToBuy.stage] ?? 'neutral';
  const stageGlow = STAGE_GLOW[propensityToBuy.stage] ?? '';
  const donutData = [
    { name: 'score', value: propensityToBuy.score },
    { name: 'remainder', value: 100 - propensityToBuy.score },
  ];

  const segmentSum = segmentRanking.affluentProgressive + segmentRanking.affluentSocialClimber +
    segmentRanking.establishedElite + segmentRanking.technocentricTrendsetter;
  const segmentEntries: Array<{ key: SegmentKey; value: number; color: string }> = [
    { key: 'affluentProgressive' as const, value: segmentRanking.affluentProgressive, color: SEGMENT_COLORS['affluentProgressive'] ?? '#FBBF24' },
    { key: 'affluentSocialClimber' as const, value: segmentRanking.affluentSocialClimber, color: SEGMENT_COLORS['affluentSocialClimber'] ?? '#C084FC' },
    { key: 'establishedElite' as const, value: segmentRanking.establishedElite, color: SEGMENT_COLORS['establishedElite'] ?? '#38BDF8' },
    { key: 'technocentricTrendsetter' as const, value: segmentRanking.technocentricTrendsetter, color: SEGMENT_COLORS['technocentricTrendsetter'] ?? '#34D399' },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="group/card">
      <button type="button" onClick={onQuickView} className="w-full text-left">
        <GlassCard className="transition-all duration-300 pb-3">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} border flex items-center justify-center font-medium text-sm shrink-0`}>
              {getInitials(demographics.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base text-white font-medium truncate">{name}</div>
              {demographics.city && <div className="text-xs text-neutral-500 truncate">{demographics.city}</div>}
            </div>
            <Icon icon="solar:bolt-circle-linear" width={16} className="text-neutral-600 group-hover/card:text-amber-400 transition-colors shrink-0" />
          </div>

          {/* Propensity donut — always shown */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative" style={{ width: 120, height: 120, filter: propensityToBuy.score > 0 ? 'drop-shadow(0 0 12px rgba(251,191,36,0.2))' : undefined }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={50} startAngle={90} endAngle={-270} strokeWidth={0} animationDuration={1000} animationEasing="ease-out">
                    <Cell fill={propensityToBuy.score > 0 ? '#FBBF24' : 'rgba(255,255,255,0.08)'} />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-heading font-bold text-white"><NumberFlow value={propensityToBuy.score} /></span>
                <span className="text-[9px] text-neutral-500">Propensity</span>
              </div>
            </div>
          </div>

          {/* Stage badge */}
          <div className={`flex justify-center mb-4 ${stageGlow}`}>
            <StatusBadge label={stageLabel} variant={stageVariant} />
          </div>

          {/* Segment bar — shown if data exists */}
          {segmentSum > 0 && (
            <>
              <div className="mb-3">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                  {segmentEntries.map((seg, i) => (
                    <motion.div key={seg.key} initial={{ width: 0 }} animate={{ width: `${String(seg.value)}%` }} transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }} style={{ backgroundColor: seg.color }} className="h-full first:rounded-l-full last:rounded-r-full" />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {segmentEntries.map((seg) => (
                  <div key={seg.key} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-[9px] text-neutral-500">{SEGMENT_LABELS[seg.key]?.split(' ').pop() ?? seg.key} {seg.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Profiling traits — shown if no segments */}
          {segmentSum === 0 && traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {traits.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3 text-[10px] text-neutral-500 min-w-0">
            {email && (
              <span className="flex items-center gap-1 truncate">
                <Icon icon="solar:letter-linear" width={11} className="shrink-0" />
                <span className="truncate">{email}</span>
              </span>
            )}
            {meta.profileCompleteness > 0 ? (
              <span className="ml-auto flex items-center gap-1 shrink-0">
                Completeness
                <span className="text-neutral-300"><NumberFlow value={meta.profileCompleteness} suffix="%" /></span>
              </span>
            ) : (
              <span className="flex items-center gap-1 ml-auto shrink-0 text-neutral-600">
                <Icon icon="solar:chat-round-dots-linear" width={11} />
                Agent collected
              </span>
            )}
          </div>
        </GlassCard>
      </button>

      <div className="flex gap-2 mt-2 px-1">
        <button type="button" onClick={onQuickView} className="van-ripple flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium hover:bg-amber-500/20 transition-colors">
          <Icon icon="solar:bolt-circle-linear" width={13} />Quick View
        </button>
        <button type="button" onClick={onAdvancedView} className="van-ripple flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-neutral-400 font-medium hover:bg-white/[0.07] hover:text-white transition-colors">
          <Icon icon="solar:chart-2-linear" width={13} />Advanced View
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="van-ripple flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0"
          title="Delete profile"
        >
          <Icon icon="solar:trash-bin-minimalistic-linear" width={14} />
        </button>
      </div>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Icon icon="solar:trash-bin-minimalistic-bold" width={18} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Delete profile?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">This will permanently remove <span className="text-neutral-300">{name}</span> from the database.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 text-xs text-neutral-300 font-medium hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onDelete();
                    } finally {
                      setIsDeleting(false);
                      setConfirmOpen(false);
                    }
                  }}
                  className="flex-1 h-9 rounded-lg bg-rose-500 text-xs text-white font-medium hover:bg-rose-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting
                    ? <><Icon icon="solar:refresh-linear" width={13} className="animate-spin" />Deleting…</>
                    : <><Icon icon="solar:trash-bin-minimalistic-linear" width={13} />Delete</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
