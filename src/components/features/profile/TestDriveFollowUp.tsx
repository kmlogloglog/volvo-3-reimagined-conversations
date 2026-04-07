import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import { geminiGenerateJSON } from '@/lib/gemini';
import type { AgentUserState } from '@/services/liveStateService';

const STEPS = [
  {
    label: 'Matching sales personnel',
    description: 'Matching profile with the most suitable sales advisor',
    icon: 'solar:user-check-rounded-linear',
  },
  {
    label: 'Contacting dealership',
    description: 'Called to confirm slot…',
    icon: 'solar:phone-calling-linear',
  },
  {
    label: 'Dealership informed',
    description: 'Visit confirmed and expected.',
    icon: 'solar:buildings-2-linear',
  },
];

const SALES_PERSONAS = [
  { id: 'erik', name: 'Erik Nordström', role: 'Senior Sales Advisor', age: 45, traits: 'experienced, family-oriented, calm', avatar: 'https://i.pravatar.cc/80?img=12' },
  { id: 'sofia', name: 'Sofia Lindström', role: 'Sales Consultant', age: 30, traits: 'energetic, tech-savvy, approachable', avatar: 'https://i.pravatar.cc/80?img=47' },
  { id: 'james', name: 'James Okafor', role: 'Product Specialist', age: 28, traits: 'young, enthusiastic, performance-focused', avatar: 'https://i.pravatar.cc/80?img=53' },
  { id: 'maya', name: 'Maya Chen', role: 'Luxury Sales Lead', age: 38, traits: 'premium-focused, attentive, detail-oriented', avatar: 'https://i.pravatar.cc/80?img=23' },
];

interface PersonaMatch {
  personaId: string;
  reasoning: string;
}

function buildPersonaPrompt(userId: string, state: AgentUserState): string {
  const name = state.full_name ?? userId;
  const city =
    typeof state.location === 'string'
      ? state.location
      : [
          (state.location as { city?: string } | undefined)?.city,
          (state.location as { nation?: string } | undefined)?.nation,
        ]
          .filter(Boolean)
          .join(', ');

  const profilingLines =
    state.profiling && typeof state.profiling === 'object' && !Array.isArray(state.profiling)
      ? Object.entries(state.profiling)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : Array.isArray(state.profiling)
        ? (state.profiling as string[]).join(', ')
        : null;

  const carModel = state.car_config?.model ?? null;
  const exterior = state.car_config?.exterior ?? null;

  const personaList = SALES_PERSONAS.map(
    (p, i) => `${i + 1}. ${p.name} (${p.age}) — ${p.role}, ${p.traits}`,
  ).join('\n');

  return (
    `You are a Volvo dealership manager assigning a sales advisor to a customer.\n\n` +
    `Customer profile:\n` +
    `- Name: ${name}\n` +
    (city ? `- Location: ${city}\n` : '') +
    (carModel ? `- Car interest: Volvo ${carModel}${exterior ? ` (${exterior})` : ''}\n` : '') +
    (profilingLines ? `- Insights: ${profilingLines}\n` : '') +
    `\nAvailable advisors:\n${personaList}\n\n` +
    `Return JSON: { "personaId": "<erik|sofia|james|maya>", "reasoning": "<exactly 2 sentences>" }`
  );
}

interface TestDriveFollowUpProps {
  engagementStrategy?: string;
  agentState?: AgentUserState | null;
  userId?: string;
}

export default function TestDriveFollowUp({ engagementStrategy, agentState, userId }: TestDriveFollowUpProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState(-1);
  const [personaMatch, setPersonaMatch] = useState<PersonaMatch | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchFailed, setMatchFailed] = useState(false);
  const [matchAttempted, setMatchAttempted] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(0), 600),
      setTimeout(() => setCurrentStep(1), 2400),
      setTimeout(() => setCurrentStep(2), 4200),
      setTimeout(() => setCurrentStep(3), 5600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (currentStep < 1 || matchAttempted) return;
    setMatchAttempted(true);

    if (!agentState || !userId) {
      setMatchFailed(true);
      return;
    }

    setMatchLoading(true);
    geminiGenerateJSON<PersonaMatch>(buildPersonaPrompt(userId, agentState))
      .then((result) => { setPersonaMatch(result); })
      .catch(() => { setMatchFailed(true); })
      .finally(() => { setMatchLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="solar:routing-2-linear" width={14} className="text-amber-400" />
        <span className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold">
          Booking Journey
        </span>
      </div>

      <div className="relative">
        {/* Vertical connector */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />

        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const isDone = currentStep > i;
            const isActive = currentStep === i;
            const isPending = currentStep < i;
            const showPersonaMatch = i === 0 && isDone;
            const showStrategy = i === 1 && isDone && engagementStrategy;

            return (
              <AnimatePresence key={step.label}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: isPending ? 0.25 : 1,
                    y: 0,
                  }}
                  transition={{ duration: 0.4, delay: isPending ? 0 : 0.1 }}
                  className="relative flex items-start gap-3 py-2"
                >
                  {/* Dot / check */}
                  <div className="relative z-10 flex items-center justify-center w-[22px] h-[22px] flex-shrink-0">
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Icon icon="solar:check-circle-bold" width={18} className="text-amber-400" />
                      </motion.div>
                    ) : (
                      <div
                        className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center transition-colors duration-300 ${
                          isActive
                            ? 'border-amber-500 bg-amber-500/15'
                            : 'border-white/15 bg-white/[0.04]'
                        }`}
                      >
                        {isActive && (
                          <span className="w-[5px] h-[5px] rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 pt-0.5 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon
                        icon={step.icon}
                        width={13}
                        className={
                          isDone
                            ? 'text-amber-400'
                            : isActive
                              ? 'text-white'
                              : 'text-neutral-600'
                        }
                      />
                      <span
                        className={`text-xs font-medium transition-colors duration-300 ${
                          isDone
                            ? 'text-amber-400'
                            : isActive
                              ? 'text-white'
                              : 'text-neutral-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Matched advisor expanded inside step 0 */}
                    {showPersonaMatch && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="mt-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Icon icon="solar:users-group-rounded-linear" width={12} className="text-amber-400/70" />
                          <span className="text-[10px] uppercase tracking-widest text-amber-400/60 font-semibold">
                            Matched Advisor
                          </span>
                        </div>

                        {(matchLoading || !matchAttempted) ? (
                          <div className="space-y-2">
                            <div className="flex gap-3 justify-center">
                              {Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1.5">
                                  <div className="w-10 h-10 rounded-full van-skeleton" />
                                  <div className="h-2 w-12 van-skeleton rounded" />
                                </div>
                              ))}
                            </div>
                            <div className="h-2.5 w-full van-skeleton rounded mt-2" />
                            <div className="h-2.5 w-4/5 van-skeleton rounded" />
                          </div>
                        ) : personaMatch ? (
                          <>
                            <div className="flex gap-3 justify-center mb-3">
                              {SALES_PERSONAS.map((persona) => {
                                const isSelected = persona.id === personaMatch.personaId;
                                return (
                                  <div
                                    key={persona.id}
                                    className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
                                      isSelected ? 'opacity-100' : 'opacity-30'
                                    }`}
                                  >
                                    <div
                                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-colors duration-300 ${
                                        isSelected
                                          ? 'border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                                          : 'border-white/10'
                                      }`}
                                    >
                                      <img
                                        src={persona.avatar}
                                        alt={persona.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className={`text-[9px] font-medium leading-tight text-center ${
                                      isSelected ? 'text-amber-400' : 'text-neutral-500'
                                    }`}>
                                      {persona.name.split(' ')[0]}
                                    </span>
                                    {isSelected && (
                                      <Icon icon="solar:check-circle-bold" width={10} className="text-amber-400 -mt-0.5" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                              {personaMatch.reasoning}
                            </p>
                          </>
                        ) : matchFailed ? (
                          <p className="text-[11px] text-neutral-500">Unable to match advisor.</p>
                        ) : null}
                      </motion.div>
                    )}

                    {/* Engagement strategy expanded inside step 2 */}
                    {showStrategy && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="mt-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Icon icon="solar:lightbulb-linear" width={12} className="text-amber-400/70" />
                          <span className="text-[10px] uppercase tracking-widest text-amber-400/60 font-semibold">
                            Engagement Strategy
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {engagementStrategy}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
