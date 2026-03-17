import { Icon } from '@iconify/react';
import type { VanProfile } from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';

interface MetaInfoProps {
  profile: VanProfile;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MetaInfo({
  profile,
}: MetaInfoProps): React.JSX.Element {
  const { sessionsAnalyzed, lastUpdated } = profile.meta;

  return (
    <GlassCard padding="compact">
      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
        <Icon
          icon="solar:clock-circle-linear"
          width={12}
          className="text-neutral-600 shrink-0"
        />
        <span>
          {sessionsAnalyzed} session{sessionsAnalyzed !== 1 ? 's' : ''} analyzed
          {' · '}
          Last updated {formatDate(lastUpdated)}
        </span>
      </div>
    </GlassCard>
  );
}
