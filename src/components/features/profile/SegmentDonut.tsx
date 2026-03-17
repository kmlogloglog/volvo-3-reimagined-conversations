import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import NumberFlow from '@number-flow/react';
import type { SegmentRanking, SegmentKey } from '@/types/profile';
import { SEGMENT_LABELS } from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';

interface SegmentDonutProps {
  readonly segmentRanking: SegmentRanking;
}

interface SegmentDatum {
  readonly key: SegmentKey;
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

const SEGMENT_COLORS: Readonly<Record<SegmentKey, string>> = {
  affluentProgressive: '#FBBF24',   // amber-500
  affluentSocialClimber: '#C084FC', // purple-400
  establishedElite: '#38BDF8',      // sky-400
  technocentricTrendsetter: '#34D399', // emerald-400
};

const SEGMENT_KEYS: readonly SegmentKey[] = [
  'affluentProgressive',
  'affluentSocialClimber',
  'establishedElite',
  'technocentricTrendsetter',
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip(props: any): React.JSX.Element | null {
  const { active, payload } = props as { active?: boolean; payload?: Array<{ payload: SegmentDatum }> };
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as SegmentDatum;

  return (
    <div
      className="backdrop-blur-md rounded-lg p-3 border"
      style={{ background: 'var(--van-surface)', borderColor: 'var(--van-border)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-xs font-medium" style={{ color: 'var(--van-text-primary)' }}>
          {data.label}
        </span>
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--van-text-primary)' }}>
        {data.value}%
      </p>
    </div>
  );
}

export default function SegmentDonut({
  segmentRanking,
}: SegmentDonutProps): React.JSX.Element {
  const chartData: readonly SegmentDatum[] = useMemo(() => {
    return SEGMENT_KEYS.map((key) => ({
      key,
      label: SEGMENT_LABELS[key],
      value: segmentRanking[key],
      color: SEGMENT_COLORS[key],
    }));
  }, [segmentRanking]);

  const dominantLabel = SEGMENT_LABELS[segmentRanking.dominantSegment];
  const dominantColor = SEGMENT_COLORS[segmentRanking.dominantSegment];
  const dominantValue = segmentRanking[segmentRanking.dominantSegment];

  const total = SEGMENT_KEYS.reduce(
    (sum, key) => sum + segmentRanking[key],
    0,
  );
  const showWarning = total !== 100;

  return (
    <GlassCard>
      <SectionHeader
        title="Segment Distribution"
        subtitle="Attitudinal segment scores"
        action={
          showWarning ? (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              Sum: {total}%
            </span>
          ) : undefined
        }
        className="mb-4"
      />

      <div className="relative" style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData as SegmentDatum[]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              strokeWidth={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry) => {
                const isDominant =
                  entry.key === segmentRanking.dominantSegment;
                return (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    stroke={isDominant ? entry.color : 'transparent'}
                    strokeWidth={isDominant ? 2 : 0}
                    style={
                      isDominant
                        ? { filter: `drop-shadow(0 0 6px ${entry.color}40)` }
                        : undefined
                    }
                  />
                );
              })}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label with NumberFlow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: 240 }}>
          <div className="text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: dominantColor }}
            >
              <NumberFlow value={dominantValue} suffix="%" />
            </p>
            <p className="text-[10px] text-neutral-400 max-w-[100px] leading-tight">
              {dominantLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Legend with NumberFlow */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        {chartData.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-neutral-400 truncate">
              {entry.label}
            </span>
            <span className="text-[11px] text-white ml-auto tabular-nums">
              <NumberFlow value={entry.value} suffix="%" />
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
