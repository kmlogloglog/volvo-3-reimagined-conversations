import { Icon } from '@iconify/react';
import type { VanProfile } from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';

interface ChannelConsentCardProps {
  profile: VanProfile;
}

const CHANNELS: readonly {
  key: keyof VanProfile['channelConsent'];
  label: string;
  icon: string;
}[] = [
  { key: 'conversational', label: 'Conversational', icon: 'solar:chat-round-dots-linear' },
  { key: 'email', label: 'Email', icon: 'solar:letter-linear' },
  { key: 'sms', label: 'SMS', icon: 'solar:smartphone-linear' },
] as const;

export default function ChannelConsentCard({
  profile,
}: ChannelConsentCardProps): React.JSX.Element {
  const consent = profile.channelConsent;

  return (
    <GlassCard>
      <SectionHeader title="Channel Consent" className="mb-4" />

      <div className="flex flex-col">
        {CHANNELS.map((channel, idx) => {
          const isOptedIn = consent[channel.key];

          return (
            <div
              key={channel.key}
              className="flex items-center justify-between py-3"
              style={idx > 0 ? { borderTop: '1px solid var(--van-border)' } : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  icon={channel.icon}
                  width={14}
                  className="text-neutral-400"
                />
                <span className="text-xs" style={{ color: 'var(--van-text-primary)' }}>{channel.label}</span>
              </div>

              <StatusBadge
                label={isOptedIn ? 'Opted In' : 'Opted Out'}
                variant={isOptedIn ? 'emerald' : 'neutral'}
              />
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
