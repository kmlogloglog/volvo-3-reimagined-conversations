import { Icon } from '@iconify/react';
import type { VanProfile } from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ProgressBar from '@/components/ui/ProgressBar';

interface ContentRecommendationsProps {
  profile: VanProfile;
}

export default function ContentRecommendations({
  profile,
}: ContentRecommendationsProps): React.JSX.Element | null {
  const items = profile.recommendations.contentRecommendations;

  if (items.length === 0) return null;

  return (
    <GlassCard>
      <SectionHeader title="Content Recommendations" className="mb-5" />
      <div className="space-y-4">
        {items.map((item) => (
          <ProgressBar
            key={item.topic}
            label={item.topic}
            value={item.relevanceScore}
            color="bg-sky-400"
            icon={
              <Icon
                icon="solar:document-text-linear"
                width={12}
                className="text-sky-400"
              />
            }
          />
        ))}
      </div>
    </GlassCard>
  );
}
