import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import type { VanProfile } from '@/types/profile';

interface PsychographicsCardProps {
  readonly profile: VanProfile;
}

/** Persona flag definitions for iteration */
const PERSONA_FLAGS = [
  { key: 'familyLogistician' as const, label: 'Family Logistician' },
  { key: 'styleConsciousCommuter' as const, label: 'Style-Conscious Commuter' },
  { key: 'highMileCruiser' as const, label: 'High-Mile Cruiser' },
] as const;

/**
 * Displays psychographic persona flags as emerald/neutral badges
 * and interests + values as sky-colored tag pills.
 */
export default function PsychographicsCard({
  profile,
}: PsychographicsCardProps): React.JSX.Element | null {
  const { psychographics } = profile.profileData;

  const hasData =
    PERSONA_FLAGS.some((f) => psychographics[f.key]) ||
    (psychographics.interests && psychographics.interests.length > 0) ||
    (psychographics.values && psychographics.values.length > 0);

  if (!hasData) return null;

  return (
    <GlassCard>
      <SectionHeader title="Psychographics" className="mb-4" />

      {/* Persona flags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PERSONA_FLAGS.map((flag) => (
          <StatusBadge
            key={flag.key}
            label={flag.label}
            variant={psychographics[flag.key] ? 'emerald' : 'neutral'}
          />
        ))}
      </div>

      {/* Interests */}
      <div className="mb-3">
        <p className="text-xs text-neutral-500 mb-2">Interests</p>
        {psychographics.interests && psychographics.interests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {psychographics.interests.map((interest) => (
              <StatusBadge
                key={interest}
                label={interest}
                variant="sky"
                showDot={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-600">None specified</p>
        )}
      </div>

      {/* Values */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">Values</p>
        {psychographics.values && psychographics.values.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {psychographics.values.map((value) => (
              <StatusBadge
                key={value}
                label={value}
                variant="sky"
                showDot={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-600">None specified</p>
        )}
      </div>
    </GlassCard>
  );
}
