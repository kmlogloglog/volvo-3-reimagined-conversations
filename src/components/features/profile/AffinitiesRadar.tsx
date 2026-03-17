import { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'motion/react';
import type { Affinities, AffinityItem, AffinityStrength } from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';

interface AffinitiesRadarProps {
  readonly affinities: Affinities;
}

interface RadarDatum {
  readonly axis: string;
  readonly value: number;
  readonly items: readonly AffinityItem[];
}

type QuadrantKey = keyof Affinities;

const QUADRANT_LABELS: Readonly<Record<QuadrantKey, string>> = {
  powertrain: 'Powertrain',
  models: 'Models',
  personalDrivers: 'Personal Drivers',
  productAttributes: 'Product Attributes',
};

const QUADRANT_KEYS: readonly QuadrantKey[] = [
  'powertrain',
  'models',
  'personalDrivers',
  'productAttributes',
] as const;

const STRENGTH_VALUES: Readonly<Record<AffinityStrength, number>> = {
  high: 3,
  medium: 2,
  low: 1,
};

const STRENGTH_BADGE_CLASSES: Readonly<Record<AffinityStrength, string>> = {
  high: 'bg-amber-500/20 text-amber-300',
  medium: 'bg-amber-500/10 text-amber-400/70',
  low: 'bg-neutral-500/10 text-neutral-400',
};

function calculateQuadrantScore(items: readonly AffinityItem[]): number {
  if (items.length === 0) return 0;

  const totalStrength = items.reduce(
    (sum, item) => sum + STRENGTH_VALUES[item.strength],
    0,
  );
  const average = totalStrength / items.length;
  return Math.round((average / 3) * 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomAxisTick(props: any): React.JSX.Element {
  const { x, y, payload, textAnchor } = props as {
    x: number; y: number; payload: { value: string }; textAnchor: string;
  };
  const words = payload.value.split(' ');
  // Split into two lines: first half / second half
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill="var(--van-text-secondary)"
      fontSize={11}
    >
      <tspan x={x} dy="0">{line1}</tspan>
      {line2 && <tspan x={x} dy="1.2em">{line2}</tspan>}
    </text>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip(props: any): React.JSX.Element | null {
  const { active, payload } = props as { active?: boolean; payload?: Array<{ payload: RadarDatum }> };
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div
      className="backdrop-blur-md rounded-lg p-3 border max-w-[200px]"
      style={{ background: 'var(--van-surface)', borderColor: 'var(--van-border)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--van-text-primary)' }}>
          {data.axis}
        </span>
        <span className="text-[10px] text-amber-400 tabular-nums">
          {data.value}%
        </span>
      </div>
      {data.items.length > 0 ? (
        <div className="space-y-1.5">
          {data.items.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-[11px] truncate" style={{ color: 'var(--van-text-secondary)' }}>
                {item.value}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${STRENGTH_BADGE_CLASSES[item.strength]}`}
              >
                {item.strength}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: 'var(--van-text-muted)' }}>No affinities</p>
      )}
    </div>
  );
}

export default function AffinitiesRadar({
  affinities,
}: AffinitiesRadarProps): React.JSX.Element {
  const chartData: readonly RadarDatum[] = useMemo(() => {
    return QUADRANT_KEYS.map((key) => ({
      axis: QUADRANT_LABELS[key],
      value: calculateQuadrantScore(affinities[key]),
      items: affinities[key],
    }));
  }, [affinities]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <GlassCard className="relative">
        {/* Subtle rotating glow behind chart */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-48 h-48 rounded-full blur-3xl animate-[spin_20s_linear_infinite]"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.06), transparent 70%)' }}
          />
        </div>

        <div className="relative z-10">
          <SectionHeader
            title="Affinities Radar"
            subtitle="Average strength per quadrant"
            className="mb-4"
          />

          <div style={{ minHeight: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={chartData as RadarDatum[]}
              >
                <PolarGrid
                  stroke="var(--van-border)"
                  radialLines={true}
                />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={<CustomAxisTick />}
                  tickLine={false}
                />
                <Radar
                  name="Affinity"
                  dataKey="value"
                  stroke="#FBBF24"
                  strokeWidth={2}
                  fill="#FBBF24"
                  fillOpacity={0.3}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
