import { Icon } from '@iconify/react';
import NumberFlow from '@number-flow/react';
import { motion } from 'motion/react';
import GlassCard from '@/components/ui/GlassCard';
import type { ProfileMeta } from '@/types/profile';

interface KpiStripProps {
  readonly meta: ProfileMeta;
  readonly actionsCount: number;
}

// ── Mini donut sub-component ──────────────────────────────────

interface MiniDonutKpiProps {
  readonly value: number;
  readonly fillColor: string;
  readonly label: string;
}

function MiniDonutKpi({
  value,
  fillColor,
  label,
}: MiniDonutKpiProps): React.JSX.Element {
  const clamped      = Math.max(0, Math.min(100, value));
  const r            = 28;
  const circumference = 2 * Math.PI * r;
  const offset       = circumference * (1 - clamped / 100);

  return (
    <GlassCard>
      <div className="flex flex-col items-center text-center">
        <div className="relative w-[80px] h-[80px]">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {/* Track */}
            <circle
              cx="40" cy="40" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="7"
            />
            {/* Animated fill */}
            <motion.circle
              cx="40" cy="40" r={r}
              fill="none"
              stroke={fillColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 40 40)"
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-heading font-bold" style={{ color: 'var(--van-text-primary)' }}>
              <NumberFlow value={value} suffix="%" />
            </span>
          </div>
        </div>

        <span className="text-xs text-neutral-500 mt-2">{label}</span>
      </div>
    </GlassCard>
  );
}

// ── Number KPI sub-component ──────────────────────────────────

interface NumberKpiProps {
  readonly value: number;
  readonly icon: string;
  readonly label: string;
}

function NumberKpi({
  value,
  icon,
  label,
}: NumberKpiProps): React.JSX.Element {
  return (
    <GlassCard>
      <div className="flex flex-col items-center text-center">
        <Icon icon={icon} width={24} className="text-amber-400 mb-2" />
        <span className="text-3xl font-heading font-bold text-white">
          <NumberFlow value={value} trend={1} />
        </span>
        <span className="text-xs text-neutral-500 mt-2">{label}</span>
      </div>
    </GlassCard>
  );
}

// ── Main component ────────────────────────────────────────────

export default function KpiStrip({
  meta,
  actionsCount,
}: KpiStripProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MiniDonutKpi
        value={meta.profileCompleteness}
        fillColor="#FBBF24"
        label="Completeness"
      />
      <MiniDonutKpi
        value={meta.confidenceScore}
        fillColor="#38BDF8"
        label="Confidence"
      />
      <NumberKpi
        value={meta.sessionsAnalyzed}
        icon="solar:chat-round-dots-linear"
        label="Sessions"
      />
      <NumberKpi
        value={actionsCount}
        icon="solar:bolt-circle-linear"
        label="Actions"
      />
    </div>
  );
}
