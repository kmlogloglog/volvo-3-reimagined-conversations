import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import GlassPanel from '@/components/ui/GlassPanel';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusBadge from '@/components/ui/StatusBadge';
import SectionHeader from '@/components/ui/SectionHeader';
import InsightCard from '@/components/ui/InsightCard';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import type { BadgeVariant } from '@/constants/designTokens';

const badgeVariantNames: BadgeVariant[] = [
  'amber',
  'emerald',
  'neutral',
  'sky',
  'purple',
  'blue',
  'green',
  'rose',
];

export default function DesignSystemTest(): React.JSX.Element {
  return (
    <div className="min-h-full">
      <AnimatedBackground fallbackOnly />

      <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-12">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-heading font-medium text-white tracking-tight">
            Design System
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Visual QA page — compare with ui-references/*.html
          </p>
        </div>

        {/* ── GlassCard Variants ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            GlassCard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard padding="compact">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-neutral-500 font-medium mb-1">
                    Compact (p-4)
                  </div>
                  <div className="text-2xl text-white font-medium tracking-tight">
                    $124,592
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Icon icon="solar:dollar-linear" width={18} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  <Icon icon="solar:arrow-right-up-linear" width={12} />
                  12.5%
                </span>
                <span className="text-neutral-600">vs last month</span>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-neutral-500 font-medium mb-1">
                    Default (p-5)
                  </div>
                  <div className="text-2xl text-white font-medium tracking-tight">
                    8,402
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
                  <Icon icon="solar:user-linear" width={18} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  <Icon icon="solar:arrow-right-up-linear" width={12} />
                  8.2%
                </span>
                <span className="text-neutral-600">vs last month</span>
              </div>
            </GlassCard>

            <GlassCard padding="spacious">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-neutral-500 font-medium mb-1">
                    Spacious (p-6)
                  </div>
                  <div className="text-2xl text-white font-medium tracking-tight">
                    1.2%
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
                  <Icon icon="solar:graph-down-linear" width={18} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  <Icon icon="solar:arrow-right-down-linear" width={12} />
                  0.4%
                </span>
                <span className="text-neutral-600">improvement</span>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ── GlassPanel ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            GlassPanel
          </h2>
          <GlassPanel>
            <p className="text-sm text-neutral-400">
              Larger container variant with heavier blur — used for page-level
              containers and login card.
            </p>
          </GlassPanel>
        </section>

        {/* ── ProgressBar ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            ProgressBar
          </h2>
          <GlassCard>
            <SectionHeader title="Traffic Sources" className="mb-6" />
            <div className="space-y-6">
              <ProgressBar
                label="Direct"
                value={45}
                color="bg-neutral-200"
                icon={
                  <Icon
                    icon="solar:earth-linear"
                    className="text-neutral-500"
                    width={14}
                  />
                }
              />
              <ProgressBar
                label="Organic Search"
                value={32}
                color="bg-neutral-600"
                icon={
                  <Icon
                    icon="solar:magnifer-linear"
                    className="text-neutral-500"
                    width={14}
                  />
                }
              />
              <ProgressBar
                label="Social"
                value={18}
                color="bg-neutral-700"
                icon={
                  <Icon
                    icon="solar:mention-circle-linear"
                    className="text-neutral-500"
                    width={14}
                  />
                }
              />
            </div>
          </GlassCard>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Inline Variant
            </h3>
            <div className="flex items-center gap-6">
              <ProgressBar label="Score" value={85} variant="inline" color="bg-yellow-500" />
              <ProgressBar label="Score" value={42} variant="inline" color="bg-purple-500" />
              <ProgressBar label="Score" value={15} variant="inline" color="bg-green-500" />
            </div>
          </div>
        </section>

        {/* ── StatusBadge ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            StatusBadge
          </h2>

          <div>
            <h3 className="text-xs text-neutral-500 font-medium mb-3">
              All Variants (default size)
            </h3>
            <div className="flex flex-wrap gap-3">
              {badgeVariantNames.map((v) => (
                <StatusBadge key={v} label={v} variant={v} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs text-neutral-500 font-medium mb-3">
              Mini Size
            </h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge label="NEW" variant="amber" size="mini" />
              <StatusBadge label="BETA" variant="purple" size="mini" />
              <StatusBadge label="Coming Soon" variant="amber" size="mini" />
            </div>
          </div>

          <div>
            <h3 className="text-xs text-neutral-500 font-medium mb-3">
              Without Dot
            </h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge label="Active" variant="emerald" showDot={false} />
              <StatusBadge label="Trial" variant="amber" showDot={false} />
              <StatusBadge label="Churned" variant="neutral" showDot={false} />
            </div>
          </div>

          <div>
            <h3 className="text-xs text-neutral-500 font-medium mb-3">
              Stage Colors (propensity stages)
            </h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge label="Awareness" variant="purple" />
              <StatusBadge label="Consideration" variant="blue" />
              <StatusBadge label="Decision" variant="green" />
            </div>
          </div>
        </section>

        {/* ── SectionHeader ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            SectionHeader
          </h2>
          <GlassCard>
            <SectionHeader title="Recent Signups" className="mb-4" />
            <p className="text-xs text-neutral-500">Title only variant.</p>
          </GlassCard>
          <GlassCard>
            <SectionHeader
              title="Revenue Growth"
              subtitle="Daily recurring revenue over last 30 days"
              className="mb-4"
            />
            <p className="text-xs text-neutral-500">
              Title + subtitle variant.
            </p>
          </GlassCard>
          <GlassCard>
            <SectionHeader
              title="Recent Signups"
              action={
                <button className="text-xs text-neutral-500 hover:text-white transition-colors flex items-center gap-1">
                  View All{' '}
                  <Icon icon="solar:arrow-right-linear" width={12} />
                </button>
              }
              className="mb-4"
            />
            <p className="text-xs text-neutral-500">
              Title + action button variant.
            </p>
          </GlassCard>
        </section>

        {/* ── InsightCard ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            InsightCard
          </h2>
          <InsightCard
            title="Insight"
            content="Direct traffic has increased by 12% following the v2.0 product launch campaign."
          />
          <InsightCard
            title="AI Recommendation"
            content="Jon is a pragmatic family man who values proven quality and design-led functionality. Lead with the EX60's interior space and safety credentials."
            icon="solar:magic-stick-3-linear"
          />
        </section>

        {/* ── Typography ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-medium text-white">
            Typography
          </h2>
          <GlassCard>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-neutral-500 mb-1">
                  font-heading (Oswald)
                </p>
                <p className="font-heading text-xl font-medium text-white">
                  Vän Profiling Dashboard
                </p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 mb-1">
                  font-jakarta (Plus Jakarta Sans)
                </p>
                <p className="font-jakarta text-xl font-medium text-white">
                  Vän Profiling Dashboard
                </p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 mb-1">
                  font-geist (Geist)
                </p>
                <p className="font-geist text-sm text-neutral-400">
                  Body text rendered in Geist — the default font for all
                  secondary content and descriptions across the dashboard.
                </p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 mb-1">
                  Text hierarchy
                </p>
                <p className="text-white font-medium">text-white (primary)</p>
                <p className="text-neutral-400">text-neutral-400 (secondary)</p>
                <p className="text-neutral-500">text-neutral-500 (muted)</p>
                <p className="text-neutral-600">text-neutral-600 (faint)</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Spacer */}
        <div className="h-16" />
      </div>
    </div>
  );
}
