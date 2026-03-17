import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const paddingMap = {
  compact: 'p-4',
  default: 'p-5',
  spacious: 'p-6',
} as const;

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof paddingMap;
  /** Disable the hover lift — useful for purely decorative or static containers */
  static?: boolean;
}

export default function GlassCard({
  children,
  className,
  padding = 'default',
  static: isStatic = false,
}: GlassCardProps): React.JSX.Element {
  return (
    <motion.div
      whileHover={isStatic ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'van-glass rounded-xl border backdrop-blur-sm relative overflow-hidden group hover:shadow-[var(--van-card-shadow)] transition-[border-color,box-shadow]',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
