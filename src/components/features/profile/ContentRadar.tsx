import { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import type { ContentRecommendation } from '@/types/profile';

interface ContentRadarProps {
  readonly recommendations: readonly ContentRecommendation[];
}

interface RadarDatum {
  readonly topic: string;
  readonly label: string;
  readonly relevanceScore: number;
}

function truncateLabel(text: string, max: number = 12): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function CustomTooltip({
  active,
  payload,
}: {
  readonly active?: boolean;
  readonly payload?: readonly { payload: RadarDatum }[];
}): React.JSX.Element | null {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 rounded-lg p-3">
      <p className="text-xs text-neutral-400 mb-1">{data.topic}</p>
      <p className="text-sm font-medium text-sky-400">{data.relevanceScore}%</p>
    </div>
  );
}

export default function ContentRadar({
  recommendations,
}: ContentRadarProps): React.JSX.Element {
  const data: readonly RadarDatum[] = useMemo(
    () =>
      recommendations.map((rec) => ({
        topic: rec.topic,
        label: truncateLabel(rec.topic),
        relevanceScore: rec.relevanceScore,
      })),
    [recommendations],
  );

  return (
    <GlassCard>
      <SectionHeader title="Content Relevance" className="mb-5" />

      {data.length === 0 ? (
        <p className="text-center text-neutral-600 text-sm py-6">
          No content recommendations available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data as RadarDatum[]} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: '#a3a3a3', fontSize: 11 }}
              tickLine={false}
            />
            <Radar
              dataKey="relevanceScore"
              fill="#38BDF8"
              fillOpacity={0.25}
              stroke="#38BDF8"
              strokeWidth={1.5}
              isAnimationActive
              animationDuration={800}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
