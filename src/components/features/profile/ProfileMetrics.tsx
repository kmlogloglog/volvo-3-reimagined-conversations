import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import type { VanProfile } from '@/types/profile';

interface ProfileMetricsProps {
  readonly profile: VanProfile;
}

/**
 * Displays profile completeness and confidence score as two progress bars.
 */
export default function ProfileMetrics({
  profile,
}: ProfileMetricsProps): React.JSX.Element {
  const { profileCompleteness, confidenceScore } = profile.meta;

  return (
    <GlassCard>
      <SectionHeader title="Profile Metrics" className="mb-4" />
      <div className="space-y-4">
        <ProgressBar
          label="Completeness"
          value={profileCompleteness}
          color="bg-amber-400"
          icon={
            <Icon
              icon="solar:chart-2-linear"
              width={14}
              className="text-amber-400"
            />
          }
        />
        <ProgressBar
          label="Confidence"
          value={confidenceScore}
          color="bg-sky-400"
          icon={
            <Icon
              icon="solar:verified-check-linear"
              width={14}
              className="text-sky-400"
            />
          }
        />
      </div>
    </GlassCard>
  );
}
