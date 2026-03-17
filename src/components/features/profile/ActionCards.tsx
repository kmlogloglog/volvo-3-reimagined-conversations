import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import type { NextBestAction, NextBestActionType } from '@/types/profile';
import { ACTION_LABELS } from '@/types/profile';

interface ActionCardsProps {
  readonly actions: readonly NextBestAction[];
}

const ACTION_ICONS: Readonly<Record<NextBestActionType, string>> = {
  bookTestDrive: 'solar:car-linear',
  completeConfiguration: 'solar:settings-linear',
  completeOrder: 'solar:document-linear',
  contactDealer: 'solar:phone-linear',
  viewContent: 'solar:eye-linear',
};

export default function ActionCards({ actions }: ActionCardsProps): React.JSX.Element {
  const sorted = useMemo(
    () => [...actions].sort((a, b) => b.likelihood - a.likelihood),
    [actions],
  );

  return (
    <GlassCard>
      <SectionHeader title="Next Best Actions" className="mb-5" />

      {sorted.length === 0 ? (
        <p className="text-center text-neutral-600 text-sm py-6">
          No actions available
        </p>
      ) : (
        <div>
          {sorted.map((action) => (
            <ActionItem key={action.action} action={action} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function ActionItem({ action }: { readonly action: NextBestAction }): React.JSX.Element {
  const icon = ACTION_ICONS[action.action];
  const label = ACTION_LABELS[action.action];
  const pct = Math.round(action.likelihood);

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Icon icon={icon} width={18} className="text-neutral-400 shrink-0" />
          <span className="text-sm text-white font-medium">{label}</span>
        </div>
        <span className="text-sm text-amber-400 font-heading font-bold">
          {pct}%
        </span>
      </div>

      <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
