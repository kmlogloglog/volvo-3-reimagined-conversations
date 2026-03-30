import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import DataRow from '@/components/features/profile/DataRow';
import type { AgentUserState } from '@/services/liveStateService';

interface CarConfigurationCardProps {
  readonly carConfig: NonNullable<AgentUserState['car_config']>;
}

/** Turns IDs like "cloud_blue" or "19_5" into readable labels. */
function humanize(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CarConfigurationCard({
  carConfig,
}: CarConfigurationCardProps): React.JSX.Element | null {
  const hasData = carConfig.model || carConfig.exterior || carConfig.interior || carConfig.wheels;
  if (!hasData) return null;

  return (
    <GlassCard>
      <SectionHeader
        title="Desired Configuration"
        subtitle="Volvo model & personalisation"
        className="mb-4"
      />
      <div>
        {carConfig.model && (
          <DataRow
            label="Model"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Icon icon="solar:car-linear" width={14} className="text-sky-400" />
                Volvo {carConfig.model}
              </span>
            }
          />
        )}
        {carConfig.exterior && (
          <DataRow
            label="Exterior"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Icon icon="solar:pallete-2-linear" width={14} className="text-amber-400" />
                {humanize(carConfig.exterior)}
              </span>
            }
          />
        )}
        {carConfig.interior && (
          <DataRow
            label="Interior"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Icon icon="solar:sofa-2-linear" width={14} className="text-violet-400" />
                {humanize(carConfig.interior)}
              </span>
            }
          />
        )}
        {carConfig.wheels && (
          <DataRow
            label="Wheels"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Icon icon="solar:wheel-linear" width={14} className="text-emerald-400" />
                {humanize(carConfig.wheels)}
              </span>
            }
          />
        )}
      </div>
    </GlassCard>
  );
}
