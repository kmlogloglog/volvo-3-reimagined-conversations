import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import GlassCard from '@/components/ui/GlassCard';
import DemographicsCard from '@/components/features/profile/DemographicsCard';
import PsychographicsCard from '@/components/features/profile/PsychographicsCard';
import MobilityNeedsCard from '@/components/features/profile/MobilityNeedsCard';
import SegmentRanking from '@/components/features/profile/SegmentRanking';
import SegmentDonut from '@/components/features/profile/SegmentDonut';
import PropensityGauge from '@/components/features/profile/PropensityGauge';
import AffinitiesWheel from '@/components/features/profile/AffinitiesWheel';
import AffinitiesRadar from '@/components/features/profile/AffinitiesRadar';
import AffinityMapCard from '@/components/features/profile/AffinityMapCard';
import EngagementStrategyCard from '@/components/features/profile/EngagementStrategyCard';
import NextBestActions from '@/components/features/profile/NextBestActions';
import ContentRecommendations from '@/components/features/profile/ContentRecommendations';
import ChannelConsentCard from '@/components/features/profile/ChannelConsentCard';
import { useProfileStore } from '@/store/profileStore';
import { useLiveStateStore } from '@/store/liveStateStore';
import AISummaryCard from '@/components/features/profile/AISummaryCard';

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

function ColumnHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <h2 className="text-base font-semibold text-white mb-4 pb-2 border-b border-white/10 tracking-wide">
      {title}
    </h2>
  );
}

export default function ProfileDetailPage(): React.JSX.Element {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdvanced = searchParams.get('view') === 'advanced';

  const profiles = useProfileStore((s) => s.profiles);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const setSelectedProfile = useProfileStore((s) => s.setSelectedProfile);

  const startListening = useLiveStateStore((s) => s.startListening);
  const stopListening = useLiveStateStore((s) => s.stopListening);
  const liveState = useLiveStateStore((s) => s.state);
  const isLive = useLiveStateStore((s) => s.isListening);

  function toggleView() {
    setSearchParams(isAdvanced ? {} : { view: 'advanced' }, { replace: true });
  }

  useEffect(() => {
    if (userId) void loadProfile(userId);
    return () => { setSelectedProfile(null); };
  }, [userId, loadProfile, setSelectedProfile]);

  useEffect(() => {
    if (userId) startListening(userId);
    return () => { stopListening(); };
  }, [userId, startListening, stopListening]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="h-12"><div className="van-skeleton h-full rounded-lg" /></GlassCard>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={`skel-${String(i)}`} className="h-96">
              <div className="van-skeleton h-full rounded-lg" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-5">

      {/* Top bar: back + name + live badge + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to="/profiles"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={14} />
          Profiles
        </Link>
        <span className="text-neutral-700 text-xs">/</span>
        <span className="text-xs text-white font-medium">
          {profile.profileData.demographics.name ?? userId}
        </span>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <button
            type="button"
            onClick={() => { if (isAdvanced) toggleView(); }}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all ${
              !isAdvanced
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Icon icon="solar:bolt-circle-linear" width={13} />
            Quick
          </button>
          <button
            type="button"
            onClick={() => { if (!isAdvanced) toggleView(); }}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-all ${
              isAdvanced
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Icon icon="solar:chart-2-linear" width={13} />
            Advanced
          </button>
        </div>
      </div>

      {/* Test drive booking card — shown in both views */}
      {liveState?.test_drive_appointment && (() => {
        const appt = liveState.test_drive_appointment as {
          retailer?: { name?: string; location?: { city?: string; nation?: string; street?: string } };
          appointment_slot?: { date?: string; time?: string };
        };
        const retailer = appt.retailer?.name;
        const slot = appt.appointment_slot;
        const loc = appt.retailer?.location;
        const locStr = [loc?.street, loc?.city, loc?.nation].filter(Boolean).join(', ');
        return (
          <GlassCard className="border border-emerald-500/20 bg-emerald-500/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:car-bold" width={15} className="text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">Test Drive Booked</span>
            </div>
            {retailer && <p className="text-sm text-white font-medium mb-0.5">{retailer}</p>}
            {locStr && <p className="text-xs text-neutral-400 mb-1">{locStr}</p>}
            {slot?.date && (
              <p className="text-xs text-neutral-300">
                {new Date(slot.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {slot.time ? ` · ${slot.time}` : ''}
              </p>
            )}
          </GlassCard>
        );
      })()}

      {/* ── Quick View — focused overview ── */}
      {!isAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <StaggerCard index={0}><AISummaryCard agentState={liveState} userId={userId ?? ''} /></StaggerCard>
            <StaggerCard index={1}><DemographicsCard profile={profile} /></StaggerCard>
            <StaggerCard index={2}><ChannelConsentCard profile={profile} /></StaggerCard>
          </div>
          <div className="space-y-4">
            <StaggerCard index={1}><PropensityGauge profile={profile} /></StaggerCard>
            <StaggerCard index={2}><MobilityNeedsCard profile={profile} /></StaggerCard>
            <StaggerCard index={3}><EngagementStrategyCard profile={profile} /></StaggerCard>
          </div>
        </div>
      )}

      {/* ── Advanced View — full 3-column analytical dashboard ── */}
      {isAdvanced && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* Left: Profile Data */}
          <div>
            <ColumnHeader title="Profile Data" />
            <div className="space-y-4">
              <StaggerCard index={0}><AISummaryCard agentState={liveState} userId={userId ?? ''} /></StaggerCard>
              <StaggerCard index={1}><DemographicsCard profile={profile} /></StaggerCard>
              <StaggerCard index={2}><PsychographicsCard profile={profile} /></StaggerCard>
              <StaggerCard index={3}><MobilityNeedsCard profile={profile} /></StaggerCard>
              <StaggerCard index={4}><SegmentRanking profile={profile} /></StaggerCard>
              <StaggerCard index={5}><SegmentDonut segmentRanking={profile.analyticalScores.segmentRanking} /></StaggerCard>
            </div>
          </div>

          {/* Center: Analytical Scores */}
          <div>
            <ColumnHeader title="Analytical Scores" />
            <div className="space-y-4">
              <StaggerCard index={1}><PropensityGauge profile={profile} /></StaggerCard>
              <StaggerCard index={2}><AffinitiesWheel profile={profile} /></StaggerCard>
              <StaggerCard index={3}><AffinitiesRadar affinities={profile.analyticalScores.affinities} /></StaggerCard>
              <StaggerCard index={4}><AffinityMapCard affinities={profile.analyticalScores.affinities} /></StaggerCard>
            </div>
          </div>

          {/* Right: Recommendations */}
          <div>
            <ColumnHeader title="Recommendations" />
            <div className="space-y-4">
              <StaggerCard index={2}><EngagementStrategyCard profile={profile} /></StaggerCard>
              <StaggerCard index={3}><NextBestActions profile={profile} /></StaggerCard>
              <StaggerCard index={4}><ContentRecommendations profile={profile} /></StaggerCard>
              <StaggerCard index={5}><ChannelConsentCard profile={profile} /></StaggerCard>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
