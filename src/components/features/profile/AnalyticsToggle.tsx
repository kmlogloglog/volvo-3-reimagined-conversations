import { useState } from 'react';
import type { AnalyticalScores } from '@/types/profile';
import SegmentDonut from './SegmentDonut';
import AffinitiesRadar from './AffinitiesRadar';

// ────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────

interface AnalyticsToggleProps {
  readonly analyticalScores: AnalyticalScores;
}

type ViewKey = 'segments' | 'affinities';

interface TabDef {
  readonly key: ViewKey;
  readonly label: string;
}

const TABS: readonly TabDef[] = [
  { key: 'segments', label: 'Segments' },
  { key: 'affinities', label: 'Affinities' },
] as const;

// ────────────────────────────────────────────
//  Tab bar
// ────────────────────────────────────────────

interface TabBarProps {
  readonly activeTab: ViewKey;
  readonly onTabChange: (tab: ViewKey) => void;
}

function TabBar({ activeTab, onTabChange }: TabBarProps): React.JSX.Element {
  return (
    <div className="flex gap-2 mb-4">
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

export default function AnalyticsToggle({
  analyticalScores,
}: AnalyticsToggleProps): React.JSX.Element {
  const [view, setView] = useState<ViewKey>('segments');

  return (
    <div>
      <TabBar activeTab={view} onTabChange={setView} />

      <div
        key={view}
        className="animate-[fadeSlideIn_0.25s_ease-out]"
      >
        {view === 'segments' ? (
          <SegmentDonut segmentRanking={analyticalScores.segmentRanking} />
        ) : (
          <AffinitiesRadar affinities={analyticalScores.affinities} />
        )}
      </div>
    </div>
  );
}
