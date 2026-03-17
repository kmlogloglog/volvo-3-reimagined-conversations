import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const paddingMap = {
  default: 'p-6',
  spacious: 'p-8',
} as const;

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof paddingMap;
}

export default function GlassPanel({
  children,
  className,
  padding = 'default',
}: GlassPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/5 bg-[#030303]/50 backdrop-blur-xl',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
