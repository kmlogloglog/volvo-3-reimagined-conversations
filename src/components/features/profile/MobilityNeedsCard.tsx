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
}: MobilityNeedsCardProps): React.JSX.Element {
  const { mobilityNeeds } = profile.profileData;

  const weekendDisplay =
    mobilityNeeds.weekendUsage && mobilityNeeds.weekendUsage.length > 0
      ? mobilityNeeds.weekendUsage
          .map((activity) => WEEKEND_LABELS[activity] ?? activity)
          .join(', ')
      : 'Unknown';

  return (
    <GlassCard>
      <SectionHeader title="Mobility Needs" className="mb-4" />
      <div>
        <DataRow
          label="Daily Usage"
          value={
            mobilityNeeds.dailyUsage
              ? (DAILY_USAGE_LABELS[mobilityNeeds.dailyUsage] ??
                mobilityNeeds.dailyUsage)
              : 'Unknown'
          }
        />
        <DataRow label="Weekend Usage" value={weekendDisplay} />
        <DataRow
          label="Passengers"
          value={
            mobilityNeeds.passengerCount !== null
              ? String(mobilityNeeds.passengerCount)
              : 'Unknown'
          }
        />
        <DataRow
          label="Cargo Needs"
          value={
            mobilityNeeds.cargoNeeds
              ? (CARGO_LABELS[mobilityNeeds.cargoNeeds] ??
                mobilityNeeds.cargoNeeds)
              : 'Unknown'
          }
        />
        <DataRow
          label="Current Car"
          value={mobilityNeeds.currentCar ?? 'Unknown'}
        />
        <DataRow
          label="Number of Cars"
          value={
            mobilityNeeds.numberOfCars !== null
              ? String(mobilityNeeds.numberOfCars)
              : 'Unknown'
          }
        />
        <DataRow
          label="Car Renewal"
          value={
            mobilityNeeds.carRenewal
              ? (RENEWAL_LABELS[mobilityNeeds.carRenewal] ??
                mobilityNeeds.carRenewal)
              : 'Unknown'
          }
        />
        <DataRow
          label="Reason for Buying"
          value={mobilityNeeds.reasonForBuying ?? 'Unknown'}
        />
      </div>
    </GlassCard>
  );
}
