import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataRowProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly className?: string;
}

/**
 * Shared label → value row used by DemographicsCard and MobilityNeedsCard.
 * Renders a subtle bottom border between rows (removed on last child).
 */
export default function DataRow({
  label,
  value,
  className,
}: DataRowProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start justify-between py-2 border-b border-white/5 last:border-b-0',
        className,
      )}
    >
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      <span className="text-sm text-white font-medium text-right">
        {value}
      </span>
    </div>
  );
}
