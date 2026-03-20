import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@iconify/react';
import type { VanProfile, NextBestAction, NextBestActionType } from '@/types/profile';
import { ACTION_LABELS } from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';
import { geminiGenerate } from '@/lib/gemini';
import { buildVolvoEmailHtml, buildAIPrompt, ACTION_EMAIL_META, getTopModel } from '@/lib/emailTemplates';
import type { EmailData } from '@/lib/emailTemplates';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActionState = 'idle' | 'loading' | 'ready';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTION_ICONS: Readonly<Record<NextBestActionType, string>> = {
  bookTestDrive: 'solar:car-linear',
  completeConfiguration: 'solar:settings-minimalistic-linear',
  completeOrder: 'solar:document-text-linear',
  contactDealer: 'solar:phone-calling-linear',
  viewContent: 'solar:eye-linear',
};

// ── Iframe Email Preview ──────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

interface NextBestActionsProps {
  profile: VanProfile;
}

export default function NextBestActions({ profile }: NextBestActionsProps): React.JSX.Element | null {
  const actions = profile.recommendations.nextBestActions;

  if (actions.length === 0) return null;
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [emailCache, setEmailCache] = useState<Record<string, EmailData>>({});

  async function handleTrigger(action: NextBestAction): Promise<void> {
    const key = action.action;

    // Toggle off if already open
    if (activeAction === key && actionState === 'ready') {
      setActiveAction(null);
      setActionState('idle');
      return;
    }

    setActiveAction(key);

    // Use cached email if already generated
    if (emailCache[key]) {
      setActionState('ready');
      return;
    }

    setActionState('loading');
    try {
      const aiBody = await geminiGenerate(buildAIPrompt(profile, action));
      const firstName = (profile.profileData.demographics.name ?? 'Valued Customer').split(' ')[0] ?? 'Valued Customer';
      const topModel = getTopModel(profile);
      const meta = ACTION_EMAIL_META[action.action];

      setEmailCache((prev) => ({
        ...prev,
        [key]: {
          subject: meta.subject(topModel, firstName),
          greeting: `Hi ${firstName},`,
          body: aiBody,
          ctaLabel: meta.cta,
        },
      }));
      setActionState('ready');
    } catch {
      setActionState('idle');
      setActiveAction(null);
    }
  }

  return (
    <GlassCard>
      <SectionHeader title="Next Best Actions" className="mb-5" />

      {actions.length === 0 ? (
        <p className="text-xs text-neutral-500">No actions recommended</p>
      ) : (
        <div className="space-y-5 relative">
          {/* Vertical connector line */}
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/5" />

          {actions.map((item) => {
            const isActive = activeAction === item.action;
            const isLoading = isActive && actionState === 'loading';
            const isReady = isActive && actionState === 'ready';
            const cachedEmail = emailCache[item.action];

            return (
              <div key={item.action} className="relative pl-6">
                {/* Dot indicator */}
                <div className={cn(
                  'absolute left-0 top-1.5 w-3 h-3 rounded-full border flex items-center justify-center transition-colors',
                  isActive ? 'border-amber-500 bg-amber-500/10' : 'bg-[#0A0A0A] border-white/10'
                )}>
                  <div className={cn('w-1 h-1 rounded-full transition-colors', isActive ? 'bg-amber-400' : 'bg-amber-500')} />
                </div>

                {/* Action header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon
                      icon={ACTION_ICONS[item.action] ?? 'solar:bolt-linear'}
                      width={13}
                      className="text-neutral-500 shrink-0"
                    />
                    <span className="text-xs text-white font-medium truncate">
                      {ACTION_LABELS[item.action] ?? item.action}
                    </span>
                  </div>
                </div>

                {/* Likelihood bar */}
                <ProgressBar
                  label="Likelihood"
                  value={item.likelihood}
                  color="bg-amber-400"
                  icon={
                    <Icon icon="solar:graph-up-linear" width={12} className="text-amber-400" />
                  }
                />

                {/* Reasoning */}
                <p className="text-[10px] text-neutral-500 leading-relaxed mt-2 mb-3">
                  {item.reasoning}
                </p>

                {/* Trigger Action button */}
                <button
                  type="button"
                  onClick={() => handleTrigger(item)}
                  disabled={actionState === 'loading' && !isActive}
                  className={cn(
                    'w-full flex items-center justify-center gap-1.5 h-7 rounded-lg border text-xs font-medium transition-all',
                    isReady
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/15'
                      : isLoading
                        ? 'bg-white/[0.03] border-white/10 text-neutral-500 cursor-wait'
                        : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:bg-white/[0.06] hover:text-white hover:border-white/20'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Icon icon="solar:refresh-circle-linear" width={13} className="animate-spin" />
                      Preparing content…
                    </>
                  ) : isReady ? (
                    <>
                      <Icon icon="solar:letter-opened-linear" width={13} />
                      Content Ready — View
                      <Icon icon="solar:alt-arrow-up-linear" width={11} />
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:bolt-circle-linear" width={13} />
                      Trigger Action
                    </>
                  )}
                </button>

                {/* Email preview — animated expand */}
                <AnimatePresence>
                  {isReady && cachedEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <IframeEmailPreview html={buildVolvoEmailHtml(cachedEmail)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
