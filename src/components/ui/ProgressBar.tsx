import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  value: number;
  icon?: ReactNode;
  color?: string;
  variant?: 'default' | 'inline';
  className?: string;
}

export default function ProgressBar({
  label,
  value,
  icon,
  color = 'bg-neutral-200',
  variant = 'default',
  className,
}: ProgressBarProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full', color)}
            initial={{ width: 0 }}
            animate={{ width: `${String(clamped)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] text-white/50">{clamped}%</span>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-white flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="text-neutral-400">{clamped}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
        <motion.div
          className={cn('h-full rounded-full relative', color)}
          initial={{ width: 0 }}
          animate={{ width: `${String(clamped)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Shimmer sweep overlay */}
          <div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 2s ease-in-out infinite',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
