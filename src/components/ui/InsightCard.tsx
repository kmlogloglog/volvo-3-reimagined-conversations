import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  title: string;
  content: string;
  icon?: string;
  className?: string;
}

export default function InsightCard({
  title,
  content,
  icon = 'solar:stars-minimalistic-linear',
  className,
}: InsightCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-3 items-start',
        className,
      )}
    >
      <Icon
        icon={icon}
        className="text-amber-400 shrink-0 mt-0.5"
        width={16}
      />
      <div>
        <div
          className="text-xs font-medium mb-0.5"
          style={{ color: 'var(--van-text-primary)' }}
        >
          {title}
        </div>
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: 'var(--van-text-secondary)' }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}
