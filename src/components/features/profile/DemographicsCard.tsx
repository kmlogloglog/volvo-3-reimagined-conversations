import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataRow from '@/components/features/profile/DataRow';
import type { VanProfile } from '@/types/profile';
import type { BadgeVariant } from '@/constants/designTokens';

interface DemographicsCardProps {
  readonly profile: VanProfile;
}

const MARITAL_LABELS: Record<string, string> = {
  married: 'Married',
  single: 'Single',
  divorced: 'Divorced',
  partner: 'Partner',
};

const AFFORDABILITY_BADGE: Record<string, BadgeVariant> = {
  high: 'emerald',
  medium: 'amber',
  low: 'neutral',
};

/**
 * Displays demographic fields as labeled key→value rows.
 * All nullable fields fall back to "Unknown".
 */
export default function DemographicsCard({
  profile,
}: DemographicsCardProps): React.JSX.Element | null {
  const { demographics } = profile.profileData;

  // Only render rows that have actual data
  const hasAny =
    demographics.name ??
    demographics.email ??
    demographics.city ??
    demographics.maritalStatus ??
    demographics.childrenCount !== null;

  if (!hasAny) return null;

  return (
    <GlassCard>
      <SectionHeader title="Demographics" className="mb-4" />
      <div>
        {demographics.name && (
          <DataRow label="Name" value={demographics.name} />
        )}
        {demographics.email && (
          <DataRow label="Email" value={demographics.email} />
        )}
        {demographics.city && (
          <DataRow label="City" value={demographics.city} />
        )}
        {demographics.maritalStatus && (
          <DataRow
            label="Marital Status"
            value={MARITAL_LABELS[demographics.maritalStatus] ?? demographics.maritalStatus}
          />
        )}
        {demographics.childrenCount !== null && (
          <DataRow label="Children" value={String(demographics.childrenCount)} />
        )}
        {demographics.affordability && demographics.affordability !== 'medium' && (
          <DataRow
            label="Affordability"
            value={
              <StatusBadge
                label={
                  demographics.affordability.charAt(0).toUpperCase() +
                  demographics.affordability.slice(1)
                }
                variant={AFFORDABILITY_BADGE[demographics.affordability] ?? 'neutral'}
              />
            }
          />
        )}
      </div>
    </GlassCard>
  );
}
