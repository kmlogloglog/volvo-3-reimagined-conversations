import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import NumberFlow from '@number-flow/react';
import { useProfileStore } from '@/store/profileStore';
import GlassCard from '@/components/ui/GlassCard';
import { SEGMENT_LABELS, ACTION_LABELS } from '@/types/profile';
import type { SegmentKey, NextBestActionType } from '@/types/profile';
import { geminiGenerate } from '@/lib/gemini';
import { buildVolvoEmailHtml, ACTION_EMAIL_META, getTopModel, buildAIPrompt, buildCampaignSummaryPrompt } from '@/lib/emailTemplates';
import type { EmailData } from '@/lib/emailTemplates';
import { cn } from '@/lib/utils';

// ── Local constants ────────────────────────────────────────────────────────────

const SEGMENT_COLORS: Record<SegmentKey, string> = {
  affluentProgressive:      '#FBBF24',
  affluentSocialClimber:    '#C084FC',
  establishedElite:         '#38BDF8',
  technocentricTrendsetter: '#34D399',
};

// ── Journey steps ──────────────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  { label: 'Client talks to Volvo AI',              icon: 'solar:chat-round-dots-bold' },
  { label: 'Profile Saved',                          icon: 'solar:user-check-bold' },
  { label: 'Engage by Segment',                      icon: 'solar:pie-chart-2-bold' },
  { label: 'AI Creates Custom Interaction & Email',  icon: 'solar:magic-stick-3-bold' },
  { label: 'Track Conversion',                        icon: 'solar:chart-2-bold' },
] as const;

// ── Animation variants ─────────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.22, delay: i * 0.07, ease: 'easeOut' as const },
  }),
};

const stepVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.45, delay: 0.25 + i * 0.35, ease: 'easeOut' as const },
  }),
};

const connectorVariants = {
  hidden: { scaleX: 0 },
  visible: (i: number) => ({
    scaleX: 1,
    transition: { duration: 0.5, delay: 0.52 + i * 0.35, ease: 'easeOut' as const },
  }),
};

// ── Email helpers ────────────────────────────────────────────────────────────

interface GeneratedEmail extends EmailData {
  action: NextBestActionType;
  actionLabel: string;
  likelihood: number;
}

const ACTION_ICONS: Record<NextBestActionType, string> = {
  bookTestDrive: 'solar:car-linear',
  completeConfiguration: 'solar:settings-minimalistic-linear',
  completeOrder: 'solar:document-text-linear',
  contactDealer: 'solar:phone-calling-linear',
  viewContent: 'solar:eye-linear',
};

const AVATAR_COLORS = [
  { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/20' },
  { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/20' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/20' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/20' },
] as const;

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getAvatarColor(name: string | null): (typeof AVATAR_COLORS)[number] {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function IframeEmailPreview({ html }: { html: string }): React.JSX.Element {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10">
      <iframe
        srcDoc={html}
        onLoad={(e) => {
          const iframe = e.currentTarget;
          if (iframe.contentDocument?.body) {
            iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
          }
        }}
        style={{ width: '100%', border: 'none', display: 'block', minHeight: '200px' }}
        title="Email Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ActionsPage(): React.JSX.Element {
  const navigate  = useNavigate();
  const profiles  = useProfileStore((s) => s.profiles);

  const [selectedUserId,  setSelectedUserId]  = useState<string>('');
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activeSegment,      setActiveSegment]      = useState<SegmentKey | null>(null);
  const [isSegmentGenerating, setIsSegmentGenerating] = useState(false);
  const [segmentProgress,    setSegmentProgress]    = useState({ done: 0, total: 0 });
  const [segmentEmails,      setSegmentEmails]      = useState<Map<string, GeneratedEmail>>(new Map());
  const [campaignSummary,    setCampaignSummary]    = useState<string | null>(null);
  const [expandedEmailIds,   setExpandedEmailIds]   = useState<Set<string>>(new Set());
  const groupReachoutRef = useRef<HTMLDivElement>(null);

  // ── Empty state ──

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="flex flex-col items-center text-center py-16 px-10 max-w-md w-full">
          <Icon icon="solar:send-linear" width={40} className="text-neutral-600 mb-4" />
          <p className="text-base font-medium text-white mb-1">No profiles loaded</p>
          <p className="text-sm text-neutral-500 mb-6">
            Load profiles on the Overview page before creating content.
          </p>
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="van-ripple inline-flex items-center gap-2 h-8 px-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400 font-medium hover:bg-amber-500/20 transition-colors"
          >
            <Icon icon="solar:widget-linear" width={14} />
            Go to Overview
          </button>
        </GlassCard>
      </div>
    );
  }

  // ── Derived ──

  const segmentCounts = (Object.keys(SEGMENT_COLORS) as SegmentKey[]).map((seg) => ({
    seg,
    count: profiles.filter(
      (p) => p.analyticalScores.segmentRanking.dominantSegment === seg,
    ).length,
  }));

  const segmentProfiles = activeSegment
    ? profiles.filter((p) => p.analyticalScores.segmentRanking.dominantSegment === activeSegment)
    : [];

  const selectedProfile =
    profiles.find((p) => p.userId === selectedUserId) ?? profiles[0] ?? null;

  async function handleGenerate(): Promise<void> {
    if (!selectedProfile) return;
    setIsGenerating(true);
    setGeneratedEmails([]);
    try {
      const actions = selectedProfile.recommendations.nextBestActions;
      const firstName = (selectedProfile.profileData.demographics.name ?? 'Valued Customer').split(' ')[0] ?? 'Valued Customer';
      const topModel = getTopModel(selectedProfile);

      const emails = await Promise.all(
        actions.map(async (nba): Promise<GeneratedEmail> => {
          const aiBody = await geminiGenerate(buildAIPrompt(selectedProfile, nba));
          const meta = ACTION_EMAIL_META[nba.action];
          return {
            action: nba.action,
            actionLabel: ACTION_LABELS[nba.action] ?? nba.action,
            likelihood: nba.likelihood,
            subject: meta.subject(topModel, firstName),
            greeting: `Hi ${firstName},`,
            body: aiBody,
            ctaLabel: meta.cta,
          };
        }),
      );
      setGeneratedEmails(emails);
      toast.success(`${emails.length} personalised email${emails.length === 1 ? '' : 's'} generated`);
    } catch {
      toast.error('Failed to generate content — please try again');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleProfileChange(userId: string): void {
    setSelectedUserId(userId);
    setGeneratedEmails([]);
  }

  function handleSegmentClick(seg: SegmentKey): void {
    if (activeSegment === seg) {
      setActiveSegment(null);
    } else {
      setActiveSegment(seg);
      setSegmentEmails(new Map());
      setCampaignSummary(null);
      setIsSegmentGenerating(false);
      setSegmentProgress({ done: 0, total: 0 });
      setExpandedEmailIds(new Set());
      setTimeout(() => {
        groupReachoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  async function handleSegmentGenerate(): Promise<void> {
    if (!activeSegment || segmentProfiles.length === 0) return;
    setIsSegmentGenerating(true);
    setSegmentEmails(new Map());
    setCampaignSummary(null);
    setExpandedEmailIds(new Set());
    setSegmentProgress({ done: 0, total: segmentProfiles.length });

    const newEmails = new Map<string, GeneratedEmail>();

    for (const profile of segmentProfiles) {
      const actions = profile.recommendations.nextBestActions;
      const topAction = [...actions].sort((a, b) => b.likelihood - a.likelihood)[0];
      if (!topAction) {
        setSegmentProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        continue;
      }

      try {
        const firstName = (profile.profileData.demographics.name ?? 'Valued Customer').split(' ')[0] ?? 'Valued Customer';
        const topModel = getTopModel(profile);
        const aiBody = await geminiGenerate(buildAIPrompt(profile, topAction));
        const meta = ACTION_EMAIL_META[topAction.action];

        newEmails.set(profile.userId, {
          action: topAction.action,
          actionLabel: ACTION_LABELS[topAction.action] ?? topAction.action,
          likelihood: topAction.likelihood,
          subject: meta.subject(topModel, firstName),
          greeting: `Hi ${firstName},`,
          body: aiBody,
          ctaLabel: meta.cta,
        });
        setSegmentEmails(new Map(newEmails));
      } catch {
        // Skip failures
      }
      setSegmentProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    if (newEmails.size > 0) {
      try {
        const summaryData = segmentProfiles
          .filter((p) => newEmails.has(p.userId))
          .map((p) => ({
            name: p.profileData.demographics.name ?? 'Unknown',
            city: p.profileData.demographics.city ?? 'unknown',
            actionLabel: newEmails.get(p.userId)!.actionLabel,
            likelihood: newEmails.get(p.userId)!.likelihood,
          }));
        const summary = await geminiGenerate(buildCampaignSummaryPrompt(activeSegment, summaryData));
        setCampaignSummary(summary);
      } catch {
        // Campaign summary is optional
      }
    }

    setIsSegmentGenerating(false);
    toast.success(`${newEmails.size} email${newEmails.size === 1 ? '' : 's'} generated for segment`);
  }

  function toggleExpand(userId: string): void {
    setExpandedEmailIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleAllExpanded(): void {
    if (expandedEmailIds.size === segmentEmails.size) {
      setExpandedEmailIds(new Set());
    } else {
      setExpandedEmailIds(new Set(segmentEmails.keys()));
    }
  }

  // ── Full page ──

  return (
    <div className="space-y-4">

      {/* Section 1: Journey Flow */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
        <GlassCard>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-6">
            Volvo AI Journey
          </p>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:flex items-center">
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1 min-w-0">

                {/* Step card */}
                <motion.div
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={stepVariants}
                  className="flex flex-col items-center text-center flex-1 min-w-0 px-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 shrink-0">
                    <Icon icon={step.icon} width={22} className="text-amber-400" />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-2 shrink-0 animate-pulse-glow">
                    <span className="text-[9px] font-bold text-amber-400">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-snug font-medium">
                    {step.label}
                  </p>
                </motion.div>

                {/* Connector (not after last step) */}
                {i < JOURNEY_STEPS.length - 1 && (
                  <motion.div
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={connectorVariants}
                    style={{ originX: 0 }}
                    className="w-8 shrink-0 flex items-center"
                  >
                    <div className="w-full border-t border-dashed border-amber-500/30" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical stack */}
          <div className="flex flex-col gap-3 md:hidden">
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center">
                <motion.div
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={stepVariants}
                  className="flex items-center gap-3 w-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Icon icon={step.icon} width={18} className="text-amber-400" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-amber-400 shrink-0">{i + 1}</span>
                    <p className="text-xs text-neutral-300 font-medium">{step.label}</p>
                  </div>
                </motion.div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <motion.div
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={connectorVariants}
                    style={{ originX: 0.5 }}
                    className="w-px h-4 bg-amber-500/20 ml-5 mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Section 2: Segmentation — staggered tiles */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
        <GlassCard>
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Segmentation
            </p>
            <span className="text-xs text-neutral-600">{profiles.length} profiles total</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {segmentCounts.map(({ seg, count }, index) => {
              const color   = SEGMENT_COLORS[seg];
              const pct     = profiles.length > 0 ? (count / profiles.length) * 100 : 0;
              return (
                <motion.div
                  key={seg}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.08, ease: 'easeOut' }}
                  className={cn('transition-opacity', activeSegment && activeSegment !== seg && 'opacity-60')}
                >
                  <div
                    onClick={() => handleSegmentClick(seg)}
                    className="rounded-xl border p-4 cursor-pointer transition-all hover:bg-white/[0.04]"
                    style={{
                      borderColor: activeSegment === seg ? color + '80' : 'rgba(255,255,255,0.05)',
                      backgroundColor: activeSegment === seg ? color + '08' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-medium text-neutral-400 leading-tight flex-1">
                        {SEGMENT_LABELS[seg]}
                      </span>
                      {activeSegment === seg && (
                        <Icon icon="solar:alt-arrow-down-bold" width={12} style={{ color }} />
                      )}
                    </div>

                    {/* Count */}
                    <p className="text-2xl font-heading text-white mb-2">
                      <NumberFlow value={count} trend={1} />
                    </p>

                    {/* Mini bar */}
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                        style={{ backgroundColor: color + 'cc' }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-1">
                      <NumberFlow value={Math.round(pct)} suffix="%" /> of total
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Section 2.5: Group Reachout */}
      <AnimatePresence>
        {activeSegment && (
          <motion.div
            ref={groupReachoutRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <GlassCard>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: SEGMENT_COLORS[activeSegment] }}
                  />
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                    {SEGMENT_LABELS[activeSegment]} — Group Reachout
                  </p>
                </div>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: SEGMENT_COLORS[activeSegment] + '20',
                    color: SEGMENT_COLORS[activeSegment],
                  }}
                >
                  {segmentProfiles.length} profile{segmentProfiles.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Profile list */}
              <div className="space-y-2 mb-5">
                {segmentProfiles.map((profile, i) => {
                  const name = profile.profileData.demographics.name;
                  const city = profile.profileData.demographics.city;
                  const topAction = [...profile.recommendations.nextBestActions]
                    .sort((a, b) => b.likelihood - a.likelihood)[0];
                  const avatarColor = getAvatarColor(name);
                  return (
                    <motion.div
                      key={profile.userId}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0',
                          avatarColor.bg, avatarColor.text, avatarColor.border,
                        )}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{name ?? 'Unknown'}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{city ?? 'Unknown city'}</p>
                      </div>
                      {topAction && (
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                          <Icon icon={ACTION_ICONS[topAction.action]} width={13} className="text-amber-400" />
                          <span className="text-[10px] text-neutral-400">
                            {ACTION_LABELS[topAction.action]}
                          </span>
                        </div>
                      )}
                      {topAction && (
                        <span className="text-[10px] font-medium text-neutral-500 shrink-0">
                          {Math.round(topAction.likelihood)}%
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Generate button + progress */}
              <div className="mb-5">
                <button
                  type="button"
                  disabled={isSegmentGenerating || segmentProfiles.length === 0}
                  onClick={handleSegmentGenerate}
                  className={cn(
                    'van-ripple inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-medium transition-all',
                    segmentEmails.size > 0
                      ? 'bg-white/[0.05] border border-white/10 text-neutral-400 hover:bg-white/[0.08] hover:text-white'
                      : !isSegmentGenerating
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-white/5 text-neutral-600 cursor-not-allowed',
                  )}
                >
                  {isSegmentGenerating ? (
                    <>
                      <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                      Generating {segmentProgress.done} of {segmentProgress.total}...
                    </>
                  ) : segmentEmails.size > 0 ? (
                    <>
                      <Icon icon="solar:restart-bold" width={16} />
                      Regenerate for Segment
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:magic-stick-3-bold" width={16} />
                      Generate for Segment
                    </>
                  )}
                </button>

                {isSegmentGenerating && segmentProgress.total > 0 && (
                  <div className="mt-3 h-1.5 w-full max-w-sm rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(segmentProgress.done / segmentProgress.total) * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{ backgroundColor: SEGMENT_COLORS[activeSegment] }}
                    />
                  </div>
                )}
              </div>

              {/* Email review accordion */}
              <AnimatePresence>
                {segmentEmails.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                        {segmentEmails.size} Generated Email{segmentEmails.size === 1 ? '' : 's'}
                      </p>
                      <button
                        type="button"
                        onClick={toggleAllExpanded}
                        className="text-[10px] text-neutral-500 hover:text-white transition-colors"
                      >
                        {expandedEmailIds.size === segmentEmails.size ? 'Collapse All' : 'Expand All'}
                      </button>
                    </div>

                    {segmentProfiles.map((profile, i) => {
                      const email = segmentEmails.get(profile.userId);
                      if (!email) return null;
                      const name = profile.profileData.demographics.name;
                      const avatarColor = getAvatarColor(name);
                      const isExpanded = expandedEmailIds.has(profile.userId);
                      return (
                        <motion.div
                          key={profile.userId}
                          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
                          className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpand(profile.userId)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                          >
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0',
                                avatarColor.bg, avatarColor.text, avatarColor.border,
                              )}
                            >
                              {getInitials(name)}
                            </div>
                            <span className="text-xs font-medium text-white truncate">
                              {name ?? 'Unknown'}
                            </span>
                            <div className="hidden sm:flex items-center gap-1.5 ml-auto shrink-0">
                              <Icon icon={ACTION_ICONS[email.action]} width={13} className="text-amber-400" />
                              <span className="text-[10px] text-neutral-400">{email.actionLabel}</span>
                            </div>
                            <span className="text-[10px] text-neutral-500 shrink-0">
                              {Math.round(email.likelihood)}%
                            </span>
                            <Icon
                              icon="solar:alt-arrow-down-linear"
                              width={14}
                              className={cn(
                                'text-neutral-500 transition-transform shrink-0',
                                isExpanded && 'rotate-180',
                              )}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4">
                                  <IframeEmailPreview html={buildVolvoEmailHtml(email)} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Campaign summary */}
              <AnimatePresence>
                {campaignSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="mt-5 rounded-xl p-4"
                    style={{
                      border: `1px solid ${SEGMENT_COLORS[activeSegment]}40`,
                      backgroundColor: SEGMENT_COLORS[activeSegment] + '08',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon icon="solar:chart-2-bold" width={16} style={{ color: SEGMENT_COLORS[activeSegment] }} />
                      <span className="text-xs font-medium text-white">Campaign Summary</span>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-300">{campaignSummary}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 3: Create Customised Content */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
        <GlassCard>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-5">
            Create Customised Content
          </p>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 mb-5">
            <Icon icon="solar:info-circle-bold" width={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--van-text-secondary)' }}>
              Creating customised content will generate a personalised email -- including images
              and text -- based on this client's recorded interactions and profile data.
            </p>
          </div>

          {/* Profile selector */}
          <div className="mb-5">
            <p className="text-xs text-neutral-500 mb-2">Select Profile</p>
            {profiles.length === 1 && profiles[0] ? (
              <div className="h-9 px-3 rounded-xl border border-white/10 bg-white/[0.03] flex items-center">
                <span className="text-sm text-white">
                  {profiles[0].profileData.demographics.name ?? profiles[0].userId}
                </span>
              </div>
            ) : (
              <select
                value={selectedUserId || (selectedProfile?.userId ?? '')}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="h-9 w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:outline-none focus:border-amber-500/50 [&>option]:bg-neutral-900"
              >
                {profiles.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.profileData.demographics.name ?? p.userId}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Generate button */}
          <button
            type="button"
            disabled={profiles.length === 0 || isGenerating}
            onClick={handleGenerate}
            className={cn(
              'van-ripple inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-medium transition-all',
              generatedEmails.length > 0
                ? 'bg-white/[0.05] border border-white/10 text-neutral-400 hover:bg-white/[0.08] hover:text-white'
                : profiles.length > 0 && !isGenerating
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-white/5 text-neutral-600 cursor-not-allowed',
            )}
          >
            {isGenerating ? (
              <>
                <Icon icon="solar:refresh-circle-linear" width={16} className="animate-spin" />
                Preparing content...
              </>
            ) : generatedEmails.length > 0 ? (
              <>
                <Icon icon="solar:restart-bold" width={16} />
                Regenerate
              </>
            ) : (
              <>
                <Icon icon="solar:magic-stick-3-bold" width={16} />
                Generate Content
              </>
            )}
          </button>

          {/* Email preview — animated expand with blur materializing effect */}
          <AnimatePresence>
            {generatedEmails.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5 mt-6"
              >
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                  {generatedEmails.length} Personalised Email{generatedEmails.length === 1 ? '' : 's'}
                </p>
                {generatedEmails.map((email, i) => (
                  <motion.div
                    key={email.action}
                    initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.35, delay: i * 0.12, ease: 'easeOut' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={ACTION_ICONS[email.action]} width={14} className="text-amber-400" />
                      <span className="text-xs font-medium text-white">{email.actionLabel}</span>
                      <span className="text-[10px] text-neutral-500 ml-auto">
                        {Math.round(email.likelihood)}% likelihood
                      </span>
                    </div>
                    <IframeEmailPreview html={buildVolvoEmailHtml(email)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

    </div>
  );
}
