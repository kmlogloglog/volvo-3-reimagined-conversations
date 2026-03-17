import { useState } from 'react';
import { Icon } from '@iconify/react';
import type {
  ProfileData,
  Affordability,
  WeekendActivity,
} from '@/types/profile';
import GlassCard from '@/components/ui/GlassCard';
import SectionHeader from '@/components/ui/SectionHeader';

// ────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────

interface TogglePanelProps {
  readonly profileData: ProfileData;
}

type TabKey = 'demographics' | 'psychographics' | 'mobility';

interface TabDef {
  readonly key: TabKey;
  readonly label: string;
}

const TABS: readonly TabDef[] = [
  { key: 'demographics', label: 'Demographics' },
  { key: 'psychographics', label: 'Psychographics' },
  { key: 'mobility', label: 'Mobility' },
] as const;

// ────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────

function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const AFFORDABILITY_CLASSES: Readonly<Record<Affordability, string>> = {
  high: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  medium: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  low: 'bg-neutral-800 text-neutral-400 border-white/5',
};

// ────────────────────────────────────────────
//  Icon-value row (shared by Demographics & Mobility)
// ────────────────────────────────────────────

interface IconValueProps {
  readonly icon: string;
  readonly children: React.ReactNode;
}

function IconValue({ icon, children }: IconValueProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <Icon
        icon={icon}
        width={18}
        className="text-amber-400 shrink-0"
      />
      <span className="text-sm text-white">{children}</span>
    </div>
  );
}

function UnknownValue(): React.JSX.Element {
  return <span className="text-neutral-600">Unknown</span>;
}

// ────────────────────────────────────────────
//  Demographics view
// ────────────────────────────────────────────

function DemographicsView({
  profileData,
}: {
  readonly profileData: ProfileData;
}): React.JSX.Element {
  const { demographics, mobilityNeeds } = profileData;

  return (
    <div className="grid grid-cols-2 gap-3">
      <IconValue icon="solar:city-linear">
        {demographics.city ?? <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:letter-linear">
        {demographics.email ?? <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:heart-linear">
        {demographics.maritalStatus !== null && demographics.maritalStatus !== undefined
          ? capitalize(demographics.maritalStatus)
          : <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:users-group-rounded-linear">
        {demographics.childrenCount !== null && demographics.childrenCount !== undefined
          ? `${demographics.childrenCount} children`
          : <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:wallet-linear">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium ${AFFORDABILITY_CLASSES[demographics.affordability]}`}
        >
          {capitalize(demographics.affordability)}
        </span>
      </IconValue>

      <IconValue icon="solar:car-linear">
        {mobilityNeeds.currentCar ?? <UnknownValue />}
      </IconValue>
    </div>
  );
}

// ────────────────────────────────────────────
//  Psychographics view
// ────────────────────────────────────────────

interface PersonaFlagDef {
  readonly key: 'familyLogistician' | 'styleConsciousCommuter' | 'highMileCruiser';
  readonly label: string;
  readonly icon: string;
}

const PERSONA_FLAGS: readonly PersonaFlagDef[] = [
  { key: 'familyLogistician', label: 'Family Logistician', icon: 'solar:home-smile-linear' },
  { key: 'styleConsciousCommuter', label: 'Style-Conscious Commuter', icon: 'solar:hanger-2-linear' },
  { key: 'highMileCruiser', label: 'High-Mile Cruiser', icon: 'solar:road-linear' },
] as const;

function PsychographicsView({
  profileData,
}: {
  readonly profileData: ProfileData;
}): React.JSX.Element {
  const { psychographics } = profileData;

  return (
    <div className="space-y-5">
      {/* Persona flags */}
      <div className="flex gap-3">
        {PERSONA_FLAGS.map((flag) => {
          const isOn = psychographics[flag.key];
          return (
            <div
              key={flag.key}
              className={`flex-1 flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
                isOn
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-white/[0.02] border-white/5 text-neutral-600'
              }`}
            >
              <Icon icon={flag.icon} width={20} />
              <span className="text-[11px] font-medium leading-tight">
                {flag.label}
              </span>
              <span className="text-[9px] uppercase tracking-wider">
                {isOn ? 'On' : 'Off'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Interests */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">
          Interests
        </p>
        <div className="flex flex-wrap gap-1.5">
          {psychographics.interests !== null && psychographics.interests !== undefined && psychographics.interests.length > 0 ? (
            psychographics.interests.map((interest) => (
              <span
                key={interest}
                className="bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full px-2.5 py-1 text-[11px]"
              >
                {interest}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-600">None</span>
          )}
        </div>
      </div>

      {/* Values */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">
          Values
        </p>
        <div className="flex flex-wrap gap-1.5">
          {psychographics.values !== null && psychographics.values !== undefined && psychographics.values.length > 0 ? (
            psychographics.values.map((val) => (
              <span
                key={val}
                className="bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full px-2.5 py-1 text-[11px]"
              >
                {val}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-600">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
//  Mobility view
// ────────────────────────────────────────────

function formatWeekendActivities(
  activities: readonly WeekendActivity[] | null | undefined,
): string | null {
  if (activities === null || activities === undefined || activities.length === 0) return null;
  return activities.map(humanize).join(', ');
}

function MobilityView({
  profileData,
}: {
  readonly profileData: ProfileData;
}): React.JSX.Element {
  const { mobilityNeeds } = profileData;

  return (
    <div className="grid grid-cols-2 gap-3">
      <IconValue icon="solar:routing-linear">
        {mobilityNeeds.dailyUsage !== null && mobilityNeeds.dailyUsage !== undefined
          ? capitalize(mobilityNeeds.dailyUsage)
          : <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:calendar-linear">
        {formatWeekendActivities(mobilityNeeds.weekendUsage) ?? <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:users-group-rounded-linear">
        {mobilityNeeds.passengerCount !== null && mobilityNeeds.passengerCount !== undefined
          ? `${mobilityNeeds.passengerCount} passengers`
          : <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:box-linear">
        {mobilityNeeds.cargoNeeds !== null && mobilityNeeds.cargoNeeds !== undefined
          ? capitalize(mobilityNeeds.cargoNeeds)
          : <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:car-linear">
        {mobilityNeeds.numberOfCars !== null && mobilityNeeds.numberOfCars !== undefined
          ? `${mobilityNeeds.numberOfCars} car${mobilityNeeds.numberOfCars !== 1 ? 's' : ''}`
          : <UnknownValue />}
      </IconValue>

      <IconValue icon="solar:refresh-circle-linear">
        {mobilityNeeds.carRenewal !== null && mobilityNeeds.carRenewal !== undefined
          ? mobilityNeeds.carRenewal === 'renew'
            ? 'Renewal'
            : 'First buy'
          : <UnknownValue />}
      </IconValue>

      <div className="col-span-2">
        <IconValue icon="solar:chat-round-dots-linear">
          {mobilityNeeds.reasonForBuying ?? <UnknownValue />}
        </IconValue>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
//  Tab bar
// ────────────────────────────────────────────

interface TabBarProps {
  readonly activeTab: TabKey;
  readonly onTabChange: (tab: TabKey) => void;
}

function TabBar({ activeTab, onTabChange }: TabBarProps): React.JSX.Element {
  return (
    <div className="flex gap-2 mb-5">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={
              isActive
                ? 'bg-amber-500 text-black rounded-lg px-3 py-1.5 text-xs font-medium'
                : 'bg-white/5 text-neutral-400 border border-white/10 rounded-lg px-3 py-1.5 text-xs hover:bg-white/10 hover:text-white transition-colors'
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────
//  Main component
// ────────────────────────────────────────────

export default function TogglePanel({
  profileData,
}: TogglePanelProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('demographics');

  return (
    <GlassCard>
      <SectionHeader title="Profile Data" className="mb-4" />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        key={activeTab}
        className="animate-[fadeSlideIn_0.25s_ease-out]"
        style={{
          // Inline keyframe fallback — use globals.css @keyframes if available
        }}
      >
        {activeTab === 'demographics' && (
          <DemographicsView profileData={profileData} />
        )}
        {activeTab === 'psychographics' && (
          <PsychographicsView profileData={profileData} />
        )}
        {activeTab === 'mobility' && (
          <MobilityView profileData={profileData} />
        )}
      </div>
    </GlassCard>
  );
}
