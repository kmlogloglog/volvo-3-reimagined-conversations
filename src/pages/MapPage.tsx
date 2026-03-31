import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '@iconify/react';
import NumberFlow from '@number-flow/react';
import { useProfileStore } from '@/store/profileStore';
import GlassCard from '@/components/ui/GlassCard';
import { getCityCoords } from '@/constants/cityCoordinates';
import type { VanProfileWithId } from '@/types/profile';

// World topology URL (Natural Earth 110m)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ── Types ──

interface MappedProfile {
  profile: VanProfileWithId;
  coords: [number, number]; // [lng, lat]
  city: string;
}

interface CityCluster {
  city: string;
  coords: [number, number];
  profiles: VanProfileWithId[];
}

// ── Helpers ──

function getTopModelAffinity(profile: VanProfileWithId): string | null {
  const models = profile.analyticalScores.affinities.models;
  if (models.length === 0) return null;
  const sorted = [...models].sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[b.strength] - order[a.strength];
  });
  return sorted[0]?.value ?? null;
}

function getPropensityColor(score: number): string {
  if (score >= 70) return '#34D399'; // emerald
  if (score >= 40) return '#FBBF24'; // amber
  return '#F87171'; // red
}

// ── Component ──

export default function MapPage(): React.JSX.Element {
  const navigate = useNavigate();
  const profiles = useProfileStore((s) => s.profiles);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleMarkerEnter = useCallback((city: string, e: React.MouseEvent) => {
    setHoveredCity(city.toLowerCase().trim());
    const container = mapContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  // Map profiles to coordinates
  const mapped = useMemo<MappedProfile[]>(() => {
    return profiles
      .filter((p) => p.profileData.demographics.city)
      .map((p) => {
        const city = p.profileData.demographics.city!;
        const coords = getCityCoords(city);
        if (!coords) return null;
        return { profile: p, coords, city };
      })
      .filter((m): m is MappedProfile => m !== null);
  }, [profiles]);

  // Cluster by city
  const clusters = useMemo<CityCluster[]>(() => {
    const map = new Map<string, CityCluster>();
    for (const m of mapped) {
      const key = m.city.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { city: m.city, coords: m.coords, profiles: [] });
      }
      map.get(key)!.profiles.push(m.profile);
    }
    return Array.from(map.values());
  }, [mapped]);

  // Stats
  const testDriveProfiles = profiles.filter((p) =>
    p.recommendations.nextBestActions.some((a) => a.action === 'bookTestDrive'),
  );
  const citiesWithMarkers = clusters.length;
  const unmappedCount = profiles.filter(
    (p) => p.profileData.demographics.city && !getCityCoords(p.profileData.demographics.city),
  ).length;

  // ── Empty state ──

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="flex flex-col items-center text-center py-16 px-10 max-w-md w-full">
          <Icon icon="solar:map-point-linear" width={40} className="text-neutral-600 mb-4" />
          <p className="text-base font-medium mb-1" style={{ color: 'var(--van-text-primary)' }}>
            No profiles loaded
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--van-text-muted)' }}>
            Load profiles first to see them on the map.
          </p>
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="van-ripple inline-flex items-center gap-2 h-8 px-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400 font-medium hover:bg-amber-500/20 transition-colors"
          >
            <Icon icon="solar:widget-linear" width={14} />
            Go to Overview
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Profiles',
              value: profiles.length,
              icon: 'solar:users-group-rounded-linear',
              color: '#38BDF8',
            },
            {
              label: 'Test Drive Interest',
              value: testDriveProfiles.length,
              icon: 'solar:car-linear',
              color: '#FBBF24',
            },
            {
              label: 'Cities Mapped',
              value: citiesWithMarkers,
              icon: 'solar:map-point-linear',
              color: '#34D399',
            },
            {
              label: 'Plotted on Map',
              value: mapped.length,
              icon: 'solar:pin-bold',
              color: '#C084FC',
            },
          ].map((kpi) => (
            <GlassCard key={kpi.label} padding="compact" static>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: kpi.color + '15' }}
                >
                  <Icon icon={kpi.icon} width={15} style={{ color: kpi.color }} />
                </div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--van-text-muted)' }}>
                  {kpi.label}
                </span>
              </div>
              <p className="text-2xl font-heading" style={{ color: 'var(--van-text-primary)' }}>
                <NumberFlow value={kpi.value} trend={1} />
              </p>
            </GlassCard>
          ))}
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.07, ease: 'easeOut' }}
      >
        <GlassCard padding="compact" className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--van-text-muted)' }}>
              Profile Locations
            </p>
            {unmappedCount > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--van-text-muted)' }}>
                {unmappedCount} profile{unmappedCount === 1 ? '' : 's'} with unknown city
              </span>
            )}
          </div>

          <div ref={mapContainerRef} className="rounded-lg overflow-hidden border max-w-3xl mx-auto relative" style={{ borderColor: 'var(--van-border)' }}>
            <ComposableMap
              projection="geoNaturalEarth1"
              projectionConfig={{ scale: 180 }}
              style={{ width: '100%', height: 'auto' }}
            >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies
                    .filter((geo) => geo.id !== '010' && geo.properties.name !== 'Antarctica')
                    .map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="var(--van-surface)"
                        stroke="var(--van-map-stroke, #999)"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: 'var(--van-surface-hover)' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {clusters.map((cluster) => (
                  <Marker
                    key={cluster.city}
                    coordinates={cluster.coords}
                    onMouseEnter={(e) => handleMarkerEnter(cluster.city, e)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    {/* Pulse ring */}
                    <circle
                      r={8 + cluster.profiles.length * 2}
                      fill="rgba(251, 191, 36, 0.12)"
                      className="animate-pulse"
                    />
                    {/* Core dot */}
                    <circle
                      r={4 + Math.min(cluster.profiles.length, 4)}
                      fill="#FBBF24"
                      stroke="#000"
                      strokeWidth={1}
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))',
                        cursor: 'pointer',
                      }}
                    />
                    {/* Count label */}
                    {cluster.profiles.length > 1 && (
                      <text
                        textAnchor="middle"
                        y={-12 - Math.min(cluster.profiles.length, 4)}
                        style={{
                          fontFamily: 'inherit',
                          fontSize: 10,
                          fontWeight: 600,
                          fill: '#FBBF24',
                        }}
                      >
                        {cluster.profiles.length}
                      </text>
                    )}
                  </Marker>
                ))}
            </ComposableMap>
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredCity && (() => {
              const cluster = clusters.find(
                (c) => c.city.toLowerCase().trim() === hoveredCity,
              );
              if (!cluster) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 pointer-events-none"
                  style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 14 }}
                >
                  <div
                    className="rounded-xl border px-4 py-3 backdrop-blur-xl shadow-lg max-w-xs"
                    style={{
                      background: 'var(--van-surface)',
                      borderColor: 'var(--van-border)',
                    }}
                  >
                    <p className="text-xs font-semibold mb-2 capitalize" style={{ color: 'var(--van-text-primary)' }}>
                      {cluster.city} — {cluster.profiles.length} profile{cluster.profiles.length === 1 ? '' : 's'}
                    </p>
                    <div className="space-y-1.5">
                      {cluster.profiles.slice(0, 5).map((p) => {
                        const propensity = p.analyticalScores.propensityToBuy.score;
                        const topModel = getTopModelAffinity(p);
                        return (
                          <div key={p.userId} className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: getPropensityColor(propensity) }}
                            />
                            <span className="text-[11px] truncate" style={{ color: 'var(--van-text-primary)' }}>
                              {p.profileData.demographics.name ?? 'Unknown'}
                            </span>
                            {topModel && (
                              <span className="text-[10px] shrink-0" style={{ color: 'var(--van-text-muted)' }}>
                                {topModel}
                              </span>
                            )}
                            <span className="text-[10px] shrink-0 ml-auto" style={{ color: 'var(--van-text-muted)' }}>
                              {Math.round(propensity)}%
                            </span>
                          </div>
                        );
                      })}
                      {cluster.profiles.length > 5 && (
                        <p className="text-[10px]" style={{ color: 'var(--van-text-muted)' }}>
                          +{cluster.profiles.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Profiles with test drive interest — city breakdown */}
      {testDriveProfiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.14, ease: 'easeOut' }}
        >
          <GlassCard>
            <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--van-text-muted)' }}>
              Test Drive Interest by Location
            </p>
            <div className="space-y-2">
              {clusters
                .map((cluster) => ({
                  ...cluster,
                  testDriveCount: cluster.profiles.filter((p) =>
                    p.recommendations.nextBestActions.some((a) => a.action === 'bookTestDrive'),
                  ).length,
                }))
                .filter((c) => c.testDriveCount > 0)
                .sort((a, b) => b.testDriveCount - a.testDriveCount)
                .map((cluster, i) => (
                  <motion.div
                    key={cluster.city}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--van-border)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Icon icon="solar:map-point-bold" width={16} className="text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize" style={{ color: 'var(--van-text-primary)' }}>
                        {cluster.city}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--van-text-muted)' }}>
                        {cluster.profiles.length} total profile{cluster.profiles.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Icon icon="solar:car-linear" width={13} className="text-amber-400" />
                      <span className="text-xs font-medium" style={{ color: 'var(--van-text-primary)' }}>
                        {cluster.testDriveCount}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
