import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import DataRow from '@/components/features/profile/DataRow';
import type { VanProfile } from '@/types/profile';

interface MobilityNeedsCardProps {
  readonly profile: VanProfile;
}

const DAILY_USAGE_LABELS: Record<string, string> = {
  city: 'City',
  highway: 'Highway',
  mixed: 'Mixed',
};

const WEEKEND_LABELS: Record<string, string> = {
  cabin: 'Cabin trips',
  sports: 'Sports',
  errands: 'Errands',
  family_activities: 'Family activities',
};

const CARGO_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const RENEWAL_LABELS: Record<string, string> = {
  renew: 'Renewal',
  first_buy: 'First purchase',
};

/**
 * Displays mobility needs as labeled key→value rows.
 * All nullable fields fall back to "Unknown".
 */
export default function MobilityNeedsCard({
  profile,
}: MobilityNeedsCardProps): React.JSX.Element | null {
  const { mobilityNeeds } = profile.profileData;

  const weekendItems =
    mobilityNeeds.weekendUsage && mobilityNeeds.weekendUsage.length > 0
      ? mobilityNeeds.weekendUsage.map((a) => WEEKEND_LABELS[a] ?? a).join(', ')
      : null;

  // Only render if there is at least one populated field
  const hasData =
    mobilityNeeds.dailyUsage ||
    weekendItems ||
    mobilityNeeds.passengerCount !== null ||
    mobilityNeeds.cargoNeeds ||
    mobilityNeeds.numberOfCars !== null ||
    mobilityNeeds.carRenewal ||
    mobilityNeeds.reasonForBuying;

  if (!hasData) return null;

  return (
    <GlassCard>
      <SectionHeader title="Mobility Needs" className="mb-4" />
      <div>
        {mobilityNeeds.dailyUsage && (
          <DataRow
            label="Daily Usage"
            value={DAILY_USAGE_LABELS[mobilityNeeds.dailyUsage] ?? mobilityNeeds.dailyUsage}
          />
        )}
        {weekendItems && <DataRow label="Weekend Usage" value={weekendItems} />}
        {mobilityNeeds.passengerCount !== null && (
          <DataRow label="Passengers" value={String(mobilityNeeds.passengerCount)} />
        )}
        {mobilityNeeds.cargoNeeds && (
          <DataRow
            label="Cargo Needs"
            value={CARGO_LABELS[mobilityNeeds.cargoNeeds] ?? mobilityNeeds.cargoNeeds}
          />
        )}
        {mobilityNeeds.numberOfCars !== null && (
          <DataRow label="Number of Cars" value={String(mobilityNeeds.numberOfCars)} />
        )}
        {mobilityNeeds.carRenewal && (
          <DataRow
            label="Car Renewal"
            value={RENEWAL_LABELS[mobilityNeeds.carRenewal] ?? mobilityNeeds.carRenewal}
          />
        )}
        {mobilityNeeds.reasonForBuying && (
          <DataRow label="Reason for Buying" value={mobilityNeeds.reasonForBuying} />
        )}
      </div>
    </GlassCard>
  );
}
