import { cn } from '@/lib/utils';
import { badgeVariants } from '@/constants/designTokens';
import type { BadgeVariant } from '@/constants/designTokens';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'default' | 'mini';
  showDot?: boolean;
  className?: string;
}

const sizeClasses = {
  default: 'px-2 py-0.5 text-[10px]',
  mini: 'px-1.5 py-0.5 text-[9px]',
} as const;

export default function StatusBadge({
  label,
  variant = 'neutral',
  size = 'default',
  showDot = true,
  className,
}: StatusBadgeProps): React.JSX.Element {
  const v = badgeVariants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        sizeClasses[size],
        v.bg,
        v.text,
        v.border,
        className,
      )}
    >
      {showDot && <span className={cn('w-1 h-1 rounded-full', v.dot)} />}
      {label}
    </span>
  );
}
