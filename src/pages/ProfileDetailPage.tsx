import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import GlassCard from '@/components/ui/GlassCard';
import GlassPanel from '@/components/ui/GlassPanel';
import { createTestDriveCall } from '@/services/retellService';
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
import CarConfigurationCard from '@/components/features/profile/CarConfigurationCard';
import { useProfileStore } from '@/store/profileStore';
import { useLiveStateStore } from '@/store/liveStateStore';
import { mapAgentStateToProfile } from '@/services/profileService';
import AISummaryCard from '@/components/features/profile/AISummaryCard';
import { useAIEnrichedProfile } from '@/hooks/useAIEnrichedProfile';

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
  const refreshLiveState = useLiveStateStore((s) => s.refresh);
  const liveState = useLiveStateStore((s) => s.state);
  const isLive = useLiveStateStore((s) => s.isListening);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callName, setCallName] = useState('');
  const [isCallingRetell, setIsCallingRetell] = useState(false);
  const [showCallTriggered, setShowCallTriggered] = useState(false);

  function toggleView() {
    setSearchParams(isAdvanced ? {} : { view: 'advanced' }, { replace: true });
  }

  async function handleTestDriveCall(): Promise<void> {
    const trimmedPhone = phoneNumber.trim();
    const trimmedName = callName.trim();
    if (!trimmedPhone || !trimmedName) return;
    setIsCallingRetell(true);
    try {
      await createTestDriveCall(trimmedPhone, trimmedName);
      setShowCallTriggered(true);
      setTimeout(() => {
        setShowCallTriggered(false);
        setIsCallModalOpen(false);
        setPhoneNumber('');
        setCallName('');
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initiate call';
      toast.error(message);
    } finally {
      setIsCallingRetell(false);
    }
  }

  useEffect(() => {
    if (userId) void loadProfile(userId);
    return () => { setSelectedProfile(null); };
  }, [userId, loadProfile, setSelectedProfile]);

  useEffect(() => {
    if (userId) startListening(userId);
    return () => { stopListening(); };
  }, [userId, startListening, stopListening]);

  // Derive profile reactively from live state so demographics, propensity
  // scores, etc. update in real-time as the agent collects data.
  const rawProfile = useMemo(() => {
    // Prefer per-user live state when it has real data
    if (liveState && userId && Object.keys(liveState).length > 0) {
      return mapAgentStateToProfile(userId, liveState);
    }
    // Fall back to profiles store (updated by collectionGroup listener)
    const storeProfile = profiles.find((p) => p.userId === userId);
    if (storeProfile) return storeProfile;
    // Last resort
    return useProfileStore.getState().selectedProfile
      ?? (userId ? mapAgentStateToProfile(userId, {}) : null);
  }, [liveState, userId, profiles]);

  const { enrichedProfile: profile, isEnriching } = useAIEnrichedProfile(rawProfile, liveState);

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
          {profile.profileData.demographics.name ?? 'Unknown'}
        </span>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
        {isEnriching && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Icon icon="solar:stars-minimalistic-bold" width={11} className="animate-pulse" />
            AI Enriching
          </span>
        )}

        {/* Refresh profile */}
        <button
          type="button"
          onClick={() => {
            refreshLiveState();
            if (userId) void loadProfile(userId);
            toast.success('Profile refreshed');
          }}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Icon icon="solar:refresh-circle-linear" width={14} />
          Refresh
        </button>

        {/* Test Drive Call */}
        <button
          type="button"
          onClick={() => setIsCallModalOpen(true)}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-sky-500/20 bg-sky-500/10 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
        >
          <Icon icon="solar:phone-calling-linear" width={14} />
          Test Drive Call
        </button>

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
            {liveState?.car_config && (
              <StaggerCard index={2}><CarConfigurationCard carConfig={liveState.car_config} /></StaggerCard>
            )}
            <StaggerCard index={3}><ChannelConsentCard profile={profile} /></StaggerCard>
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
              {liveState?.car_config && (
                <StaggerCard index={4}><CarConfigurationCard carConfig={liveState.car_config} /></StaggerCard>
              )}
              <StaggerCard index={5}><SegmentRanking profile={profile} /></StaggerCard>
              <StaggerCard index={6}><SegmentDonut segmentRanking={profile.analyticalScores.segmentRanking} /></StaggerCard>
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

      {/* Test Drive Call Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setIsCallModalOpen(false); setPhoneNumber(''); setCallName(''); }}
            role="presentation"
          />
          <div className="relative z-10 w-full max-w-sm mx-4">
            <GlassPanel padding="spacious">
              {showCallTriggered ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Icon icon="solar:check-circle-bold" width={40} className="text-sky-400" />
                  <p className="text-sm font-medium text-white">Mock call has been triggered</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-heading font-medium text-white">Mock test drive call to salesperson assigned</h2>
                    <button
                      type="button"
                      onClick={() => { setIsCallModalOpen(false); setPhoneNumber(''); setCallName(''); }}
                      className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Icon icon="solar:close-circle-linear" width={16} />
                    </button>
                  </div>

                  <label className="block text-xs text-neutral-400 mb-2">Receiver name</label>
                  <input
                    type="text"
                    value={callName}
                    onChange={(e) => setCallName(e.target.value)}
                    placeholder="e.g. Astrid Lindqvist"
                    className="w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-sky-500/30 mb-4"
                    autoFocus
                  />

                  <label className="block text-xs text-neutral-400 mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-sky-500/30 mb-5"
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleTestDriveCall(); }}
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setIsCallModalOpen(false); setPhoneNumber(''); setCallName(''); }}
                      className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 text-sm text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTestDriveCall()}
                      disabled={isCallingRetell || phoneNumber.trim().length === 0 || callName.trim().length === 0}
                      className="flex-1 h-9 rounded-lg bg-sky-500 text-sm text-white font-medium hover:bg-sky-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCallingRetell ? (
                        <>
                          <Icon icon="solar:refresh-circle-linear" width={14} className="animate-spin" />
                          Calling…
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:phone-calling-linear" width={14} />
                          Call
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}
