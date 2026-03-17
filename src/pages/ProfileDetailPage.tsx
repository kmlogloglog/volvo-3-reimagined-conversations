import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import GlassCard from '@/components/ui/GlassCard';
import KpiStrip from '@/components/features/profile/KpiStrip';
import ProfileCharacteristics from '@/components/features/profile/ProfileCharacteristics';
import DemographicsCard from '@/components/features/profile/DemographicsCard';
import PsychographicsCard from '@/components/features/profile/PsychographicsCard';
import MobilityNeedsCard from '@/components/features/profile/MobilityNeedsCard';
import SegmentRanking from '@/components/features/profile/SegmentRanking';
import SegmentDonut from '@/components/features/profile/SegmentDonut';
import PropensityGauge from '@/components/features/profile/PropensityGauge';
import AffinitiesWheel from '@/components/features/profile/AffinitiesWheel';
import AffinitiesRadar from '@/components/features/profile/AffinitiesRadar';
import EngagementStrategyCard from '@/components/features/profile/EngagementStrategyCard';
import NextBestActions from '@/components/features/profile/NextBestActions';
import ContentRecommendations from '@/components/features/profile/ContentRecommendations';
import ChannelConsentCard from '@/components/features/profile/ChannelConsentCard';
import { useProfileStore } from '@/store/profileStore';
import { useLiveStateStore } from '@/store/liveStateStore';
import { SEGMENT_LABELS, ACTION_LABELS, STAGE_LABELS } from '@/types/profile';
import type { SegmentKey, AffinityStrength } from '@/types/profile';
import { cn } from '@/lib/utils';

// ── Quick View constants ───────────────────────────────────────────────────────

const SEGMENT_COLORS: Record<SegmentKey, string> = {
  affluentProgressive: '#FBBF24',
  affluentSocialClimber: '#C084FC',
  establishedElite: '#38BDF8',
  technocentricTrendsetter: '#34D399',
};

const POWERTRAIN_LABELS: Record<string, string> = {
  electric: 'Electric',
  plugInHybrid: 'Plug-in Hybrid',
  mildHybrid: 'Mild Hybrid',
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

const STAGE_COLORS: Record<string, string> = {
  awareness: 'text-purple-400',
  consideration: 'text-blue-400',
  decision: 'text-emerald-400',
};

const STRENGTH_ORDER: Record<AffinityStrength, number> = { high: 0, medium: 1, low: 2 };

const AFFORDABILITY_STYLES: Record<string, string> = {
  high: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  low: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
};

function contentScoreStyle(score: number): string {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-400';
  if (score >= 60) return 'bg-blue-500/15 text-blue-400';
  return 'bg-white/5 text-neutral-400';
}

// ── Card stagger wrapper ──────────────────────────────────────────────────────

function StaggerCard({ children, index }: { children: React.ReactNode; index: number }): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileDetailPage(): React.JSX.Element {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const profiles = useProfileStore((s) => s.profiles);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const setSelectedProfile = useProfileStore((s) => s.setSelectedProfile);

  const initialView = searchParams.get('view') === 'advanced' ? 'advanced' : 'quick';
  const [viewMode, setViewMode] = useState<'quick' | 'advanced'>(initialView);

  // Live state listener
  const startListening = useLiveStateStore((s) => s.startListening);
  const stopListening = useLiveStateStore((s) => s.stopListening);
  const liveState = useLiveStateStore((s) => s.state);
  const isLive = useLiveStateStore((s) => s.isListening);
  const liveLastUpdated = useLiveStateStore((s) => s.lastUpdated);

  useEffect(() => {
    if (userId) void loadProfile(userId);
    return () => { setSelectedProfile(null); };
  }, [userId, loadProfile, setSelectedProfile]);

  // Start/stop live listener whenever the viewed profile changes
  useEffect(() => {
    if (userId) startListening(userId);
    return () => { stopListening(); };
  }, [userId, startListening, stopListening]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="h-48"><div className="van-skeleton h-full rounded-lg" /></GlassCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={`skel-${String(i)}`} className="h-28"><div className="van-skeleton h-full rounded-lg" /></GlassCard>
          ))}
        </div>
      </div>
    );
  }

  // Resolve profile
  const profile = useProfileStore.getState().selectedProfile
    ?? profiles.find((p) => p.userId === userId)
    ?? null;

  // ── Not found ──
  if (error !== null || profile === null) {
    return (
      <div>
        <Link to="/profiles" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors mb-6">
          <Icon icon="solar:alt-arrow-left-linear" width={14} />
          Back to profiles
        </Link>
        <GlassCard className="text-center py-12">
          <Icon
            icon={error ? 'solar:danger-triangle-linear' : 'solar:user-cross-linear'}
            width={36}
            className={error ? 'mx-auto text-rose-400 mb-3' : 'mx-auto text-neutral-500 mb-3'}
          />
          <p className="text-sm text-white font-medium mb-1">{error ?? 'Profile not found'}</p>
          <p className="text-xs text-neutral-500 mb-4">
            {error ? 'There was a problem loading this profile.' : `No profile exists with ID "${userId ?? ''}".`}
          </p>
          <Link to="/profiles" className="h-8 px-4 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors inline-flex items-center">
            View all profiles
          </Link>
        </GlassCard>
      </div>
    );
  }

  const nextBestActions = profile.recommendations.nextBestActions;

  return (
    <div className="space-y-6">

      {/* Top bar: back + live badge + view toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/profiles" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors">
            <Icon icon="solar:alt-arrow-left-linear" width={14} />
            Back to profiles
          </Link>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* View mode switcher with sliding indicator pill */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full p-0.5 relative">
          <button
            type="button"
            onClick={() => setViewMode('quick')}
            className={cn(
              'relative flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium transition-colors z-10',
              viewMode === 'quick'
                ? 'text-black'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            {viewMode === 'quick' && (
              <motion.div
                layoutId="view-pill"
                className="absolute inset-0 bg-amber-500 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon icon="solar:bolt-circle-linear" width={13} className="relative z-10" />
            <span className="relative z-10">Quick View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('advanced')}
            className={cn(
              'relative flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium transition-colors z-10',
              viewMode === 'advanced'
                ? 'text-white'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            {viewMode === 'advanced' && (
              <motion.div
                layoutId="view-pill"
                className="absolute inset-0 bg-white/10 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon icon="solar:chart-2-linear" width={13} className="relative z-10" />
            <span className="relative z-10">Advanced View</span>
          </button>
        </div>
      </div>

      {/* Live agent state panel — shown whenever onSnapshot has data */}
      {liveState && (
        <GlassCard className="border border-emerald-500/20 bg-emerald-500/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">Agent Live State</span>
            </div>
            {liveLastUpdated && (
              <span className="text-[10px] text-neutral-600">
                Updated {liveLastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Profiling insights */}
            {liveState.profiling && liveState.profiling.length > 0 && (
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Profiling Insights</p>
                <div className="flex flex-wrap gap-1.5">
                  {liveState.profiling.map((insight, i) => (
                    <span
                      key={String(i)}
                      className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300"
                    >
                      {insight}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Car config */}
            {liveState.car_config?.model && (
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Car Configuration</p>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                    {liveState.car_config.model}
                  </span>
                  {liveState.car_config.exterior && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {liveState.car_config.exterior}
                    </span>
                  )}
                  {liveState.car_config.interior && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {liveState.car_config.interior}
                    </span>
                  )}
                  {liveState.car_config.wheels && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {liveState.car_config.wheels}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Personal details captured by the agent */}
            {(liveState.full_name ?? liveState.email ?? liveState.location) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                {liveState.full_name && (
                  <span className="text-neutral-400">
                    <span className="text-neutral-600 mr-1">Name</span>{liveState.full_name}
                  </span>
                )}
                {liveState.email && (
                  <span className="text-neutral-400">
                    <span className="text-neutral-600 mr-1">Email</span>{liveState.email}
                  </span>
                )}
                {liveState.location && (
                  <span className="text-neutral-400">
                    <span className="text-neutral-600 mr-1">Location</span>{liveState.location}
                  </span>
                )}
              </div>
            )}

            {/* Test drive appointment */}
            {liveState.test_drive_appointment && (
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Test Drive Booked</p>
                <pre className="text-[10px] text-neutral-400 bg-white/[0.02] rounded p-2 overflow-x-auto">
                  {JSON.stringify(liveState.test_drive_appointment, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* KPI strip */}
      <KpiStrip meta={profile.meta} actionsCount={nextBestActions.length} />

      {/* Crossfade between Quick and Advanced */}
      <AnimatePresence mode="wait">
        {/* Quick View */}
        {viewMode === 'quick' && (() => {
          const { affinities, segmentRanking, propensityToBuy } = profile.analyticalScores;
          const { demographics, psychographics } = profile.profileData;
          const { channelConsent, recommendations, meta } = profile;

          const dominantSegment = segmentRanking.dominantSegment;
          const dominantSegmentColor = SEGMENT_COLORS[dominantSegment];
          const dominantSegmentScore = segmentRanking[dominantSegment];

          const topPowertrain = [...affinities.powertrain].sort(
            (a, b) => STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength],
          )[0];
          const topModel = [...affinities.models].sort(
            (a, b) => STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength],
          )[0];

          const topAction = recommendations.nextBestActions[0];

          const highPowertrain = affinities.powertrain.filter((i) => i.strength === 'high');
          const highModels = affinities.models.filter((i) => i.strength === 'high');
          const highDrivers = affinities.personalDrivers.filter((i) => i.strength === 'high');
          const highAttributes = affinities.productAttributes.filter((i) => i.strength === 'high');
          const hasHighAffinities =
            highPowertrain.length > 0 || highModels.length > 0 ||
            highDrivers.length > 0 || highAttributes.length > 0;

          const signalGridCols = topModel !== undefined ? 'grid-cols-3' : 'grid-cols-2';

          return (
            <motion.div
              key="quick"
              initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-4"
            >

              {/* Hero Identity Card */}
              <StaggerCard index={0}>
                <GlassCard>
                  <div
                    className="absolute top-0 left-0 w-64 h-64 blur-3xl rounded-full pointer-events-none"
                    style={{ backgroundColor: dominantSegmentColor + '1a' }}
                  />
                  <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Profile</p>
                      <h2 className="text-3xl font-heading text-white leading-tight truncate">
                        {demographics.name ?? 'Unknown'}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {demographics.city !== null && (
                          <span className="text-sm text-neutral-400">{demographics.city}</span>
                        )}
                        <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', AFFORDABILITY_STYLES[demographics.affordability])}>
                          {demographics.affordability} affordability
                        </span>
                      </div>
                      <div className="mt-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border"
                          style={{
                            color: dominantSegmentColor,
                            borderColor: dominantSegmentColor + '66',
                            backgroundColor: dominantSegmentColor + '1a',
                          }}
                        >
                          {SEGMENT_LABELS[dominantSegment]}
                        </span>
                      </div>
                      {meta.profileCharacteristics !== null && (
                        <p className="text-sm text-neutral-400 italic mt-3 leading-relaxed max-w-md">
                          &ldquo;{meta.profileCharacteristics}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-28 h-28 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative animate-pulse-glow">
                        <div className="absolute inset-0 border border-amber-500/40 rounded-full animate-[spin_8s_linear_infinite]" />
                        <div className="text-center">
                          <span className="text-4xl font-heading font-medium text-white leading-none">
                            <NumberFlow value={propensityToBuy.score} />
                          </span>
                          <span className="text-neutral-500 text-xs block">/ 100</span>
                        </div>
                      </div>
                      <span className={cn('text-sm font-medium', STAGE_COLORS[propensityToBuy.stage] ?? 'text-neutral-400')}>
                        {STAGE_LABELS[propensityToBuy.stage] ?? propensityToBuy.stage}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </StaggerCard>

              {/* Persona Chips */}
              <StaggerCard index={1}>
                <GlassCard padding="compact">
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">Persona Signals</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(
                      [
                        { label: 'Family Logistician', active: psychographics.familyLogistician },
                        { label: 'Style-Conscious Commuter', active: psychographics.styleConsciousCommuter },
                        { label: 'High-Mile Cruiser', active: psychographics.highMileCruiser },
                      ] as const
                    ).map(({ label, active }) => (
                      <span
                        key={label}
                        className={cn(
                          'rounded-full px-4 py-1.5 text-sm font-medium border',
                          active
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-white/[0.02] border-white/5 text-neutral-600 line-through',
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </StaggerCard>

              {/* Top Signal Trio */}
              <StaggerCard index={2}>
                <div className={cn('grid gap-4', signalGridCols)}>
                  <GlassCard className="text-center">
                    <Icon icon="solar:chart-square-linear" width={28} className="mx-auto mb-2" style={{ color: dominantSegmentColor }} />
                    <p className="text-lg font-heading font-medium leading-tight" style={{ color: dominantSegmentColor }}>
                      {SEGMENT_LABELS[dominantSegment]}
                    </p>
                    <p className="text-2xl font-heading text-white mt-1">
                      <NumberFlow value={dominantSegmentScore} suffix="%" />
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">Dominant Segment</p>
                  </GlassCard>

                  {topPowertrain !== undefined && (
                    <GlassCard className="text-center">
                      <Icon icon="solar:bolt-circle-linear" width={28} className="mx-auto mb-2 text-amber-400" />
                      <p className="text-lg font-heading font-medium text-white leading-tight">
                        {POWERTRAIN_LABELS[topPowertrain.value] ?? topPowertrain.value}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                        {topPowertrain.strength}
                      </span>
                      <p className="text-xs text-neutral-500 mt-1">Preferred Powertrain</p>
                    </GlassCard>
                  )}

                  {topModel !== undefined && (
                    <GlassCard className="text-center">
                      <Icon icon="solar:car-bold" width={28} className="mx-auto mb-2 text-sky-400" />
                      <p className="text-lg font-heading font-medium text-white leading-tight">{topModel.value}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 capitalize">
                        {topModel.strength}
                      </span>
                      <p className="text-xs text-neutral-500 mt-1">Top Model Affinity</p>
                    </GlassCard>
                  )}
                </div>
              </StaggerCard>

              {/* Top Next Best Action */}
              {topAction !== undefined && (
                <StaggerCard index={3}>
                  <GlassCard className="pl-6">
                    <div className="absolute left-0 inset-y-0 w-1 bg-amber-500 rounded-r" />
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Recommended Action</p>
                    <p className="text-xl font-heading text-white">
                      {ACTION_LABELS[topAction.action] ?? topAction.action}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-500">Likelihood</span>
                        <span className="text-xs text-amber-400 font-medium">
                          <NumberFlow value={Math.round(topAction.likelihood)} suffix="%" />
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <motion.div
                          className="bg-amber-500 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(topAction.likelihood)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 italic mt-3">{topAction.reasoning}</p>
                  </GlassCard>
                </StaggerCard>
              )}

              {/* High-Strength Affinity Tags */}
              <StaggerCard index={4}>
                <GlassCard>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">Strong Affinities</p>
                  {hasHighAffinities ? (
                    <div className="flex flex-wrap gap-2">
                      {highPowertrain.map((item) => (
                        <span key={`pt-${item.value}`} className="rounded-full px-3 py-1 text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          {POWERTRAIN_LABELS[item.value] ?? item.value}
                        </span>
                      ))}
                      {highModels.map((item) => (
                        <span key={`m-${item.value}`} className="rounded-full px-3 py-1 text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                          {item.value}
                        </span>
                      ))}
                      {highDrivers.map((item) => (
                        <span key={`d-${item.value}`} className="rounded-full px-3 py-1 text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                          {DRIVER_LABELS[item.value] ?? item.value}
                        </span>
                      ))}
                      {highAttributes.map((item) => (
                        <span key={`a-${item.value}`} className="rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {ATTRIBUTE_LABELS[item.value] ?? item.value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600">No strong affinities yet</p>
                  )}
                </GlassCard>
              </StaggerCard>

              {/* Content + Channels */}
              <StaggerCard index={5}>
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">Top Content</p>
                    <div className="space-y-2">
                      {recommendations.contentRecommendations.slice(0, 3).map((rec) => (
                        <div key={rec.topic} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-neutral-300 truncate">{rec.topic}</span>
                          <span className={cn('shrink-0 text-xs px-2 py-0.5 rounded-full', contentScoreStyle(rec.relevanceScore))}>
                            {rec.relevanceScore}
                          </span>
                        </div>
                      ))}
                      {recommendations.contentRecommendations.length === 0 && (
                        <p className="text-sm text-neutral-600">No recommendations</p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">Reachability</p>
                    <div className="space-y-3">
                      {(
                        [
                          { icon: 'solar:chat-round-dots-bold', label: 'Conversational', active: channelConsent.conversational },
                          { icon: 'solar:letter-bold', label: 'Email', active: channelConsent.email },
                          { icon: 'solar:phone-bold', label: 'SMS', active: channelConsent.sms },
                        ] as const
                      ).map(({ icon, label, active }) => (
                        <div key={label} className="flex items-center gap-3">
                          <Icon icon={icon} width={20} className={active ? 'text-emerald-400' : 'text-neutral-600'} />
                          <span className={cn('text-sm font-medium flex-1', active ? 'text-white' : 'text-neutral-600')}>{label}</span>
                          <span className={cn('w-2 h-2 rounded-full', active ? 'bg-emerald-400' : 'bg-red-500/60')} />
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </StaggerCard>

            </motion.div>
          );
        })()}

        {/* Advanced View */}
        {viewMode === 'advanced' && (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start"
          >
            <div className="space-y-4">
              <StaggerCard index={0}><ProfileCharacteristics profile={profile} /></StaggerCard>
              <StaggerCard index={1}><DemographicsCard profile={profile} /></StaggerCard>
              <StaggerCard index={2}><PsychographicsCard profile={profile} /></StaggerCard>
              <StaggerCard index={3}><MobilityNeedsCard profile={profile} /></StaggerCard>
              <StaggerCard index={4}><SegmentRanking profile={profile} /></StaggerCard>
              <StaggerCard index={5}><SegmentDonut segmentRanking={profile.analyticalScores.segmentRanking} /></StaggerCard>
            </div>
            <div className="space-y-4">
              <StaggerCard index={1}><PropensityGauge profile={profile} /></StaggerCard>
              <StaggerCard index={2}><AffinitiesWheel profile={profile} /></StaggerCard>
              <StaggerCard index={3}><AffinitiesRadar affinities={profile.analyticalScores.affinities} /></StaggerCard>
            </div>
            <div className="space-y-4">
              <StaggerCard index={2}><EngagementStrategyCard profile={profile} /></StaggerCard>
              <StaggerCard index={3}><NextBestActions profile={profile} /></StaggerCard>
              <StaggerCard index={4}><ContentRecommendations profile={profile} /></StaggerCard>
              <StaggerCard index={5}><ChannelConsentCard profile={profile} /></StaggerCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
