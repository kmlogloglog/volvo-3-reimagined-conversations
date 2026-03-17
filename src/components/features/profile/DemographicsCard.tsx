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
}: DemographicsCardProps): React.JSX.Element {
  const { demographics } = profile.profileData;

  return (
    <GlassCard>
      <SectionHeader title="Demographics" className="mb-4" />
      <div>
        <DataRow label="Name" value={demographics.name ?? 'Unknown'} />
        <DataRow label="Email" value={demographics.email ?? 'Unknown'} />
        <DataRow label="City" value={demographics.city ?? 'Unknown'} />
        <DataRow
          label="Marital Status"
          value={
            demographics.maritalStatus
              ? (MARITAL_LABELS[demographics.maritalStatus] ??
                demographics.maritalStatus)
              : 'Unknown'
          }
        />
        <DataRow
          label="Children"
          value={
            demographics.childrenCount !== null
              ? String(demographics.childrenCount)
              : 'Unknown'
          }
        />
        <DataRow
          label="Affordability"
          value={
            <StatusBadge
              label={
                demographics.affordability.charAt(0).toUpperCase() +
                demographics.affordability.slice(1)
              }
              variant={
                AFFORDABILITY_BADGE[demographics.affordability] ?? 'neutral'
              }
            />
          }
        />
      </div>
    </GlassCard>
  );
}
