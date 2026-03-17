import InsightCard from '@/components/ui/InsightCard';
import type { VanProfile } from '@/types/profile';

interface ProfileCharacteristicsProps {
  readonly profile: VanProfile;
}

/**
 * Amber InsightCard wrapping `meta.profileCharacteristics`.
 * Hidden entirely when the value is null or empty.
 */
export default function ProfileCharacteristics({
  profile,
}: ProfileCharacteristicsProps): React.JSX.Element | null {
  const text = profile.meta.profileCharacteristics;
  if (!text) return null;

  return (
    <InsightCard
      title="Profile Summary"
      content={text}
      icon="solar:user-id-linear"
    />
  );
}
