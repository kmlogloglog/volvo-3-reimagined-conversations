import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import NumberFlow from '@number-flow/react';
import { useProfileStore } from '@/store/profileStore';
import GlassCard from '@/components/ui/GlassCard';
import JsonUploadModal from '@/components/features/JsonUploadModal';
import { SEGMENT_LABELS, STAGE_LABELS } from '@/types/profile';
import type { SegmentKey } from '@/types/profile';
import { cn } from '@/lib/utils';

// ── Template JSON ─────────────────────────────────────────────────────────────

const TEMPLATE_JSON = JSON.stringify(
  {
    profileData: {
      demographics: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        city: 'Stockholm',
        maritalStatus: 'married',
        childrenCount: 2,
        affordability: 'high',
      },
      psychographics: {
        familyLogistician: true,
        styleConsciousCommuter: false,
        highMileCruiser: true,
        interests: ['sustainability', 'technology', 'outdoor'],
        values: ['safety', 'quality', 'innovation'],
      },
      mobilityNeeds: {
        dailyUsage: 'mixed',
        weekendUsage: ['cabin', 'family_activities'],
        passengerCount: 4,
        cargoNeeds: 'high',
        currentCar: 'Volvo XC90',
        numberOfCars: 2,
        carRenewal: 'renew',
        reasonForBuying: 'Growing family needs more space and range',
      },
    },
    analyticalScores: {
      segmentRanking: {
        affluentProgressive: 45,
        affluentSocialClimber: 20,
        establishedElite: 20,
        technocentricTrendsetter: 15,
        dominantSegment: 'affluentProgressive',
      },
      propensityToBuy: {
        score: 72,
        stage: 'consideration',
      },
      affinities: {
        powertrain: [
          { value: 'electric', strength: 'high' },
          { value: 'plugInHybrid', strength: 'medium' },
          { value: 'mildHybrid', strength: 'low' },
        ],
        models: [
          { value: 'EX90', strength: 'high' },
          { value: 'EX60', strength: 'medium' },
        ],
        personalDrivers: [
          { value: 'responsibility', strength: 'high' },
          { value: 'qualityOfLife', strength: 'high' },
          { value: 'security', strength: 'medium' },
        ],
        productAttributes: [
          { value: 'safety', strength: 'high' },
          { value: 'technology', strength: 'high' },
          { value: 'luxury', strength: 'medium' },
          { value: 'performance', strength: 'low' },
        ],
      },
    },
    recommendations: {
      engagementStrategy:
        'Focus on family safety features and long-range electric capability. Highlight EX90 configurator and sustainability credentials to drive consideration-to-decision transition.',
      nextBestActions: [
        {
          action: 'bookTestDrive',
          likelihood: 0.78,
          reasoning: 'High propensity score and consideration stage indicate readiness for hands-on experience.',
        },
        {
          action: 'completeConfiguration',
          likelihood: 0.65,
          reasoning: 'EX90 affinity is high -- guided configurator will deepen commitment.',
        },
        {
          action: 'viewContent',
          likelihood: 0.55,
          reasoning: 'Sustainability values align with EV ownership stories and range content.',
        },
      ],
      contentRecommendations: [
        { topic: 'EX90 Family Safety Features', relevanceScore: 95 },
        { topic: 'Electric Range & Charging Guide', relevanceScore: 88 },
        { topic: 'Sustainability & Carbon Footprint', relevanceScore: 80 },
      ],
    },
    channelConsent: {
      conversational: true,
      email: true,
      sms: false,
    },
    meta: {
      profileCompleteness: 85,
      confidenceScore: 78,
      lastUpdated: '2026-03-05T10:00:00Z',
      sessionsAnalyzed: 7,
      profileCharacteristics:
        'Family-first progressive buyer with strong EV intent, values safety and sustainability above all.',
    },
  },
  null,
  2,
);

// ── Local display helpers ─────────────────────────────────────────────────────

const SEGMENT_COLORS: Record<SegmentKey, string> = {
  affluentProgressive: '#FBBF24',
  affluentSocialClimber: '#C084FC',
  establishedElite: '#38BDF8',
  technocentricTrendsetter: '#34D399',
};

const STAGE_COLORS: Record<string, string> = {
  awareness: 'text-purple-400',
  consideration: 'text-blue-400',
  decision: 'text-emerald-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OverviewPage(): React.JSX.Element {
  const profiles = useProfileStore((s) => s.profiles);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(TEMPLATE_JSON).catch(() => {});
    setCopied(true);
    toast.success('Template copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">

      {/* Section A: JSON Template */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="solar:code-linear" width={18} className="text-amber-400" />
            <span className="text-sm font-medium text-white">JSON Profile Template</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="van-ripple h-7 px-3 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Icon icon={copied ? 'solar:check-circle-linear' : 'solar:copy-linear'} width={13} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => setIsTemplateExpanded((v) => !v)}
              className="h-7 px-3 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Icon
                icon={isTemplateExpanded ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
                width={13}
              />
              {isTemplateExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {isTemplateExpanded && (
          <pre className="font-mono text-[11px] text-neutral-300 leading-relaxed bg-white/[0.02] rounded-lg p-4 max-h-96 overflow-y-auto overflow-x-auto whitespace-pre mt-4">
            {TEMPLATE_JSON}
          </pre>
        )}
      </GlassCard>

      {/* Section B: Empty state or All Profiles dashboard */}
      {profiles.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <Icon icon="solar:widget-linear" width={40} className="text-neutral-600 mb-4" />
          <p className="text-base font-medium text-white mb-1">No profile loaded</p>
          <p className="text-sm text-neutral-500 mb-6 max-w-sm">
            Upload a Van Profile JSON to view the full profiling dashboard.
          </p>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="van-ripple inline-flex items-center gap-2 h-8 px-3 rounded-full bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors"
          >
            <Icon icon="solar:upload-minimalistic-linear" width={14} />
            Upload JSON
          </button>
        </GlassCard>
      ) : (
        <>
          {/* Dashboard header row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-lg font-heading font-medium text-white">
              Profiling &amp; Prediction Dashboard
            </h1>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="van-ripple inline-flex items-center gap-2 h-8 px-3 rounded-full bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors"
            >
              <Icon icon="solar:upload-minimalistic-linear" width={14} />
              Upload JSON
            </button>
          </div>

          {/* All Profiles */}
          {(() => {
            const avgScore = Math.round(
              profiles.reduce((s, p) => s + p.analyticalScores.propensityToBuy.score, 0) / profiles.length,
            );

            const stageCounts: Record<string, number> = {};
            for (const p of profiles) {
              const st = p.analyticalScores.propensityToBuy.stage;
              stageCounts[st] = (stageCounts[st] ?? 0) + 1;
            }

            const consentCounts = {
              conversational: profiles.filter((p) => p.channelConsent.conversational).length,
              email: profiles.filter((p) => p.channelConsent.email).length,
              sms: profiles.filter((p) => p.channelConsent.sms).length,
            };
            const bestReachKey = (Object.entries(consentCounts) as [string, number][])
              .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'email';

            const avgScoreColor =
              avgScore < 34 ? 'text-purple-400' : avgScore < 67 ? 'text-blue-400' : 'text-emerald-400';

            const reachIcons: Record<string, string> = {
              conversational: 'solar:chat-round-dots-bold',
              email: 'solar:letter-bold',
              sms: 'solar:phone-bold',
            };
            const reachLabels: Record<string, string> = {
              conversational: 'Conversational',
              email: 'Email',
              sms: 'SMS',
            };

            return (
              <div className="space-y-4">

                {/* Aggregate stat tiles — staggered */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    <GlassCard key="loaded" className="text-center">
                      <Icon icon="solar:users-group-rounded-bold" width={28} className="mx-auto mb-2 text-amber-400" />
                      <p className="text-3xl font-heading text-white">
                        <NumberFlow value={profiles.length} trend={1} />
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">Profiles Loaded</p>
                    </GlassCard>,
                    <GlassCard key="score" className="text-center">
                      <Icon icon="solar:graph-up-bold" width={28} className={cn('mx-auto mb-2', avgScoreColor)} />
                      <p className={cn('text-3xl font-heading', avgScoreColor)}>
                        <NumberFlow value={avgScore} trend={1} />
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">Avg Score</p>
                    </GlassCard>,
                    <GlassCard key="stages" className="text-center">
                      <Icon icon="solar:chart-2-bold" width={28} className="mx-auto mb-2 text-neutral-400" />
                      <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                        {(stageCounts['awareness'] ?? 0) > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                            {stageCounts['awareness']} awareness
                          </span>
                        )}
                        {(stageCounts['consideration'] ?? 0) > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                            {stageCounts['consideration']} consideration
                          </span>
                        )}
                        {(stageCounts['decision'] ?? 0) > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            {stageCounts['decision']} decision
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">Stage Distribution</p>
                    </GlassCard>,
                    <GlassCard key="reach" className="text-center">
                      <Icon
                        icon={reachIcons[bestReachKey] ?? 'solar:letter-bold'}
                        width={28}
                        className="mx-auto mb-2 text-amber-400"
                      />
                      <p className="text-lg font-heading text-white">{reachLabels[bestReachKey] ?? bestReachKey}</p>
                      <p className="text-xs text-neutral-500 mt-1">Best Reach</p>
                    </GlassCard>,
                  ].map((tile, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.07, ease: 'easeOut' }}
                    >
                      {tile}
                    </motion.div>
                  ))}
                </div>

                {/* Profile roster — staggered */}
                <div className="space-y-2">
                  {profiles.map((p, i) => {
                    const dominantSeg = p.analyticalScores.segmentRanking.dominantSegment;
                    const segColor = SEGMENT_COLORS[dominantSeg];
                    const stage = p.analyticalScores.propensityToBuy.stage;
                    return (
                      <motion.div
                        key={p.userId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                      >
                        <GlassCard className="pl-5">
                          {/* Left accent bar */}
                          <div
                            className="absolute left-0 inset-y-0 w-1 rounded-r"
                            style={{ backgroundColor: segColor }}
                          />
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Name + city */}
                            <div className="min-w-0 w-36 shrink-0">
                              <p className="text-sm font-medium text-white truncate leading-snug">
                                {p.profileData.demographics.name ?? 'Unknown'}
                              </p>
                              {p.profileData.demographics.city !== null && (
                                <p className="text-xs text-neutral-500 truncate leading-snug">
                                  {p.profileData.demographics.city}
                                </p>
                              )}
                            </div>

                            {/* Score ring */}
                            <div className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative shrink-0">
                              <div className="absolute inset-0 border border-amber-500/40 rounded-full animate-[spin_8s_linear_infinite]" />
                              <span className="text-xs font-heading text-white relative z-10">
                                {p.analyticalScores.propensityToBuy.score}
                              </span>
                            </div>

                            {/* Stage badge */}
                            <span className={cn('text-xs font-medium shrink-0 hidden sm:block', STAGE_COLORS[stage] ?? 'text-neutral-400')}>
                              {STAGE_LABELS[stage] ?? stage}
                            </span>

                            {/* Segment chip */}
                            <span
                              className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 hidden md:block truncate max-w-[10rem]"
                              style={{
                                color: segColor,
                                borderColor: segColor + '66',
                                backgroundColor: segColor + '1a',
                              }}
                            >
                              {SEGMENT_LABELS[dominantSeg]}
                            </span>

                            {/* Consent dots */}
                            <div className="flex items-center gap-1.5 shrink-0 hidden lg:flex">
                              {(
                                [
                                  { key: 'conversational', active: p.channelConsent.conversational, title: 'Conversational' },
                                  { key: 'email', active: p.channelConsent.email, title: 'Email' },
                                  { key: 'sms', active: p.channelConsent.sms, title: 'SMS' },
                                ] as const
                              ).map(({ key, active, title }) => (
                                <span
                                  key={key}
                                  title={title}
                                  className={cn('w-2 h-2 rounded-full', active ? 'bg-emerald-400' : 'bg-neutral-700')}
                                />
                              ))}
                            </div>

                            {/* Arrow button */}
                            <button
                              type="button"
                              className="ml-auto flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors shrink-0"
                              onClick={() => void navigate(`/profiles/${p.userId}`)}
                            >
                              Open
                              <Icon icon="solar:alt-arrow-right-linear" width={14} />
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Segment distribution bar */}
                <GlassCard>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">Segment Distribution</p>
                  <div className="space-y-3">
                    {(Object.entries(SEGMENT_COLORS) as [SegmentKey, string][]).map(([key, color]) => {
                      const count = profiles.filter(
                        (p) => p.analyticalScores.segmentRanking.dominantSegment === key,
                      ).length;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-neutral-400 w-48 shrink-0">{SEGMENT_LABELS[key]}</span>
                          <span className="text-xs font-medium text-white w-4 shrink-0">
                            <NumberFlow value={count} />
                          </span>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5">
                            <motion.div
                              className="h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max((count / profiles.length) * 100, count > 0 ? 4 : 0)}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              style={{ backgroundColor: color + '99' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

              </div>
            );
          })()}
        </>
      )}

      <JsonUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}
