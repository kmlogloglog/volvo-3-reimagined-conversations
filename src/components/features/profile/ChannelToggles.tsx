import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import type { ChannelConsent } from '@/types/profile';

interface ChannelTogglesProps {
  readonly consent: ChannelConsent;
}

interface ChannelConfig {
  readonly key: keyof ChannelConsent;
  readonly label: string;
  readonly icon: string;
}

const CHANNELS: readonly ChannelConfig[] = [
  { key: 'conversational', label: 'Chat', icon: 'solar:chat-round-dots-linear' },
  { key: 'email', label: 'Email', icon: 'solar:letter-linear' },
  { key: 'sms', label: 'SMS', icon: 'solar:smartphone-linear' },
] as const;

export default function ChannelToggles({
  consent,
}: ChannelTogglesProps): React.JSX.Element {
  return (
    <GlassCard>
      <SectionHeader title="Channel Consent" className="mb-5" />

      <div className="flex justify-around">
        {CHANNELS.map((channel) => {
          const optedIn = consent[channel.key];

          return (
            <div
              key={channel.key}
              className={cn(
                'flex flex-col items-center gap-1 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex-1 mx-1',
                optedIn && 'border-emerald-500/20 bg-emerald-500/5',
              )}
            >
              <Icon
                icon={channel.icon}
                width={28}
                className={cn(
                  optedIn ? 'text-emerald-400' : 'text-neutral-600',
                )}
              />

              <span className="text-xs text-neutral-400 mt-2">
                {channel.label}
              </span>

              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    optedIn
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : 'bg-neutral-600',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    optedIn ? 'text-emerald-400' : 'text-neutral-600',
                  )}
                >
                  {optedIn ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
