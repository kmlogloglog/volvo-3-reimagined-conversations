import type { VanProfile } from '@/types/profile';
import InsightCard from '@/components/ui/InsightCard';

interface EngagementStrategyCardProps {
  profile: VanProfile;
}

export default function EngagementStrategyCard({
  profile,
}: EngagementStrategyCardProps): React.JSX.Element | null {
  const strategy = profile.recommendations.engagementStrategy;

  if (!strategy) {
    return null;
  }

  return (
    <div className="overflow-y-auto max-h-64">
      <InsightCard
        title="Engagement Strategy"
        content={strategy}
        icon="solar:lightbulb-linear"
      />
    </div>
  );
}
