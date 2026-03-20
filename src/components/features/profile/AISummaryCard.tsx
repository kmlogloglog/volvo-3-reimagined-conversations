import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import { geminiGenerate } from '@/lib/gemini';
import type { AgentUserState } from '@/services/liveStateService';

interface AISummaryCardProps {
  agentState: AgentUserState | null;
  userId: string;
}

function buildPrompt(userId: string, state: AgentUserState): string {
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
  const carDetails = [
    state.car_config?.exterior,
    state.car_config?.interior,
    state.car_config?.wheels ? `${state.car_config.wheels}" wheels` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const appt = state.test_drive_appointment as {
    retailer?: { name?: string; location?: { city?: string } };
    appointment_slot?: { date?: string; time?: string };
  } | undefined;

  const testDrive = appt?.retailer?.name
    ? `${appt.retailer.name}${appt.appointment_slot?.date ? ` on ${appt.appointment_slot.date} at ${appt.appointment_slot.time ?? ''}` : ''}`
    : null;

  const lines = [
    `Name: ${name}`,
    city ? `Location: ${city}` : null,
    state.height_cm ? `Height: ${String(state.height_cm)}` : null,
    carModel ? `Selected model: Volvo ${carModel}${carDetails ? ` (${carDetails})` : ''}` : null,
    profilingLines ? `Conversation insights: ${profilingLines}` : null,
    testDrive ? `Test drive booked at: ${testDrive}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    `You are a Volvo sales consultant reviewing a customer profile. ` +
    `Write 2–3 sentences summarising who this person is and what their ` +
    `interest in Volvo reveals about them. Be warm, insightful, and ` +
    `human — no bullet points, no raw data values, just natural language.\n\n` +
    `Customer data:\n${lines}`
  );
}

export default function AISummaryCard({
  agentState,
  userId,
}: AISummaryCardProps): React.JSX.Element | null {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!agentState) return;
    setLoading(true);
    setFailed(false);
    setSummary(null);
    geminiGenerate(buildPrompt(userId, agentState))
      .then((text) => { setSummary(text); })
      .catch(() => { setFailed(true); })
      .finally(() => { setLoading(false); });
  // Re-run only when userId changes, not on every live update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!agentState && !loading) return null;

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Subtle amber glow top-right */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Icon
            icon="solar:stars-minimalistic-bold"
            width={15}
            className="text-amber-400"
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
            AI Summary
          </span>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-3 w-full van-skeleton rounded" />
            <div className="h-3 w-5/6 van-skeleton rounded" />
            <div className="h-3 w-4/6 van-skeleton rounded" />
          </div>
        )}

        {failed && (
          <p className="text-xs text-neutral-500">Unable to generate summary.</p>
        )}

        {summary && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--van-text-primary)' }}>{summary}</p>
        )}
      </div>
    </GlassCard>
  );
}
