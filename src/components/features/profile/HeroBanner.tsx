import { PieChart, Pie, Cell } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import type { VanProfileWithId, PropensityStage } from '@/types/profile';
import { STAGE_LABELS } from '@/types/profile';

interface HeroBannerProps {
  readonly profile: VanProfileWithId;
}

// ── Avatar helpers (same pattern as ProfileCard) ──────────────

const AVATAR_COLORS = [
  { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/20' },
  { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/20' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/20' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/20' },
] as const;

function getAvatarColor(name: string | null): (typeof AVATAR_COLORS)[number] {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index]!;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

// ── Stage badge config ────────────────────────────────────────

const STAGE_BADGE_STYLES: Readonly<
  Record<PropensityStage, { classes: string; shadow: string }>
> = {
  awareness: {
    classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    shadow: '0 0 12px rgba(192,132,252,0.4)',
  },
  consideration: {
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shadow: '0 0 12px rgba(56,189,248,0.4)',
  },
  decision: {
    classes: 'bg-green-500/10 text-green-400 border-green-500/20',
    shadow: '0 0 12px rgba(52,211,153,0.4)',
  },
};

// ── Donut data builder ────────────────────────────────────────

function buildDonutData(score: number): Array<{ name: string; value: number }> {
  const clamped = Math.max(0, Math.min(100, score));
  return [
    { name: 'filled', value: clamped },
    { name: 'empty', value: 100 - clamped },
  ];
}

// ── Component ─────────────────────────────────────────────────

export default function HeroBanner({
  profile,
}: HeroBannerProps): React.JSX.Element {
  const { demographics } = profile.profileData;
  const { propensityToBuy } = profile.analyticalScores;

  const name = demographics.name ?? 'Unknown';
  const city = demographics.city ?? 'Unknown city';
  const avatarColor = getAvatarColor(demographics.name);
  const stageStyle = STAGE_BADGE_STYLES[propensityToBuy.stage];
  const stageLabel = STAGE_LABELS[propensityToBuy.stage];

  const donutData = buildDonutData(propensityToBuy.score);

  return (
    <GlassCard padding="spacious" className="w-full">
      <div className="flex items-center justify-between">
        {/* ── Left: avatar + info ── */}
        <div className="flex items-center gap-5">
          <div
            className={`w-20 h-20 rounded-full ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} border flex items-center justify-center font-heading font-medium text-2xl shrink-0`}
          >
            {getInitials(demographics.name)}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-medium text-white leading-tight">
              {name}
            </h1>
            <span className="text-neutral-400 text-sm">{city}</span>

            <span
              className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-medium w-fit ${stageStyle.classes}`}
              style={{ boxShadow: stageStyle.shadow }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: 'currentColor',
                  boxShadow: stageStyle.shadow,
                }}
              />
              {stageLabel}
            </span>
          </div>
        </div>

        {/* ── Right: propensity donut ── */}
        <div
          className="relative flex flex-col items-center"
          style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.3))' }}
        >
          <div className="relative w-[200px] h-[200px]">
            <PieChart width={200} height={200}>
              <Pie
                data={donutData}
                dataKey="value"
                cx={99}
                cy={99}
                innerRadius={70}
                outerRadius={90}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              >
                <Cell key="filled" fill="#FBBF24" />
                <Cell key="empty" fill="rgba(255,255,255,0.05)" />
              </Pie>
            </PieChart>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-heading font-bold text-white">
                {propensityToBuy.score}
              </span>
              <span className="text-xs text-neutral-500 mt-0.5">
                Propensity
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
