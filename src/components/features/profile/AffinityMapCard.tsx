import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '@iconify/react';
import GlassCard from '@/components/ui/GlassCard';
import type { Affinities, AffinityStrength } from '@/types/profile';

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface AffinityMapCardProps {
  readonly affinities: Affinities;
}

interface TooltipState {
  label: string;
  quadrant: QuadrantKey;
  strength: AffinityStrength | null;
  x: number;
  y: number;
}

// ── Catalogue ──────────────────────────────────────────────────────────────────

const CATALOGUE = {
  models: [
    { value: 'EX90', label: 'EX90' },
    { value: 'EX60', label: 'EX60' },
    { value: 'EX30', label: 'EX30' },
    { value: 'CX90', label: 'CX90' },
    { value: 'CX60', label: 'CX60' },
    { value: 'CX40', label: 'CX40' },
  ],
  powertrain: [
    { value: 'electric', label: 'Electric' },
    { value: 'plugInHybrid', label: 'Plug-in Hybrid' },
    { value: 'mildHybrid', label: 'Mild Hybrid' },
  ],
  personalDrivers: [
    { value: 'socialValidation', label: 'Social Validation' },
    { value: 'responsibility', label: 'Responsibility' },
    { value: 'fun', label: 'Fun' },
    { value: 'security', label: 'Security' },
    { value: 'qualityOfLife', label: 'Quality of Life' },
  ],
  productAttributes: [
    { value: 'performance', label: 'Performance' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'technology', label: 'Technology' },
    { value: 'safety', label: 'Safety' },
  ],
} as const;

type QuadrantKey = keyof typeof CATALOGUE;

// ── Visual identity per quadrant ───────────────────────────────────────────────

const QUADRANT_META: Record<QuadrantKey, {
  label: string;
  icon: string;
  accentHex: string;
  filterId: string;
}> = {
  models: {
    label: 'Models',
    icon: 'solar:car-bold',
    accentHex: '#FBBF24',
    filterId: 'glow-amber',
  },
  powertrain: {
    label: 'Powertrain',
    icon: 'solar:bolt-bold',
    accentHex: '#38BDF8',
    filterId: 'glow-sky',
  },
  personalDrivers: {
    label: 'Personal Drivers',
    icon: 'solar:heart-bold',
    accentHex: '#C084FC',
    filterId: 'glow-purple',
  },
  productAttributes: {
    label: 'Product Attributes',
    icon: 'solar:star-bold',
    accentHex: '#34D399',
    filterId: 'glow-emerald',
  },
};

// ── Layout ─────────────────────────────────────────────────────────────────────

const CANVAS_CENTER = { x: 220, y: 160 };
const NODE_ORBIT_RADIUS = 52;

const CLUSTER_CENTER: Record<QuadrantKey, { x: number; y: number }> = {
  models:           { x: 105, y: 100 },
  powertrain:       { x: 335, y: 100 },
  personalDrivers:  { x: 105, y: 220 },
  productAttributes:{ x: 335, y: 220 },
};

const QUADRANT_KEYS: readonly QuadrantKey[] = [
  'models',
  'powertrain',
  'personalDrivers',
  'productAttributes',
];

// ── Static background star field ───────────────────────────────────────────────

const BG_STARS: readonly { cx: number; cy: number; r: number; o: number }[] = [
  { cx: 22,  cy: 15,  r: 0.9, o: 0.40 },
  { cx: 55,  cy: 8,   r: 1.1, o: 0.30 },
  { cx: 90,  cy: 30,  r: 0.8, o: 0.50 },
  { cx: 140, cy: 12,  r: 1.3, o: 0.25 },
  { cx: 178, cy: 25,  r: 0.8, o: 0.35 },
  { cx: 218, cy: 8,   r: 1.0, o: 0.40 },
  { cx: 258, cy: 18,  r: 1.2, o: 0.30 },
  { cx: 298, cy: 7,   r: 0.9, o: 0.45 },
  { cx: 338, cy: 22,  r: 1.1, o: 0.30 },
  { cx: 385, cy: 12,  r: 0.8, o: 0.40 },
  { cx: 418, cy: 35,  r: 1.3, o: 0.25 },
  { cx: 428, cy: 75,  r: 0.9, o: 0.35 },
  { cx: 422, cy: 122, r: 1.0, o: 0.40 },
  { cx: 432, cy: 162, r: 1.2, o: 0.30 },
  { cx: 424, cy: 202, r: 0.8, o: 0.45 },
  { cx: 416, cy: 248, r: 1.1, o: 0.30 },
  { cx: 428, cy: 285, r: 0.9, o: 0.35 },
  { cx: 396, cy: 310, r: 1.3, o: 0.25 },
  { cx: 350, cy: 315, r: 0.8, o: 0.40 },
  { cx: 305, cy: 310, r: 1.0, o: 0.30 },
  { cx: 258, cy: 315, r: 1.2, o: 0.35 },
  { cx: 218, cy: 310, r: 0.9, o: 0.40 },
  { cx: 178, cy: 315, r: 1.1, o: 0.30 },
  { cx: 132, cy: 310, r: 0.8, o: 0.45 },
  { cx: 88,  cy: 314, r: 1.3, o: 0.25 },
  { cx: 45,  cy: 308, r: 1.0, o: 0.35 },
  { cx: 10,  cy: 285, r: 0.9, o: 0.40 },
  { cx: 6,   cy: 242, r: 1.2, o: 0.30 },
  { cx: 14,  cy: 198, r: 0.8, o: 0.45 },
  { cx: 8,   cy: 155, r: 1.1, o: 0.35 },
  { cx: 16,  cy: 108, r: 0.9, o: 0.40 },
  { cx: 6,   cy: 68,  r: 1.3, o: 0.25 },
  // Interior scattered stars
  { cx: 168, cy: 52,  r: 0.8, o: 0.22 },
  { cx: 200, cy: 76,  r: 1.0, o: 0.18 },
  { cx: 242, cy: 55,  r: 0.9, o: 0.28 },
  { cx: 275, cy: 78,  r: 1.1, o: 0.22 },
  { cx: 188, cy: 148, r: 0.8, o: 0.18 },
  { cx: 252, cy: 145, r: 0.9, o: 0.20 },
  { cx: 196, cy: 238, r: 1.0, o: 0.22 },
  { cx: 248, cy: 262, r: 0.8, o: 0.18 },
  { cx: 158, cy: 258, r: 1.1, o: 0.20 },
  { cx: 295, cy: 208, r: 0.9, o: 0.22 },
  { cx: 148, cy: 180, r: 1.3, o: 0.16 },
  { cx: 62,  cy: 155, r: 0.8, o: 0.22 },
];

// ── Glow filter definitions ────────────────────────────────────────────────────

const GLOW_FILTERS: readonly { id: string }[] = [
  { id: 'glow-amber' },
  { id: 'glow-sky' },
  { id: 'glow-purple' },
  { id: 'glow-emerald' },
];

// ── Helper functions ───────────────────────────────────────────────────────────

function nodePos(
  center: { x: number; y: number },
  index: number,
  total: number,
  radius = NODE_ORBIT_RADIUS,
) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function labelProps(
  pos: { x: number; y: number },
  center: { x: number; y: number },
  offset = 15,
): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: pos.x + (dx / len) * offset,
    y: pos.y + (dy / len) * offset,
    anchor: Math.abs(dx) < 10 ? 'middle' : dx > 0 ? 'start' : 'end',
  };
}

function segLen(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

const STRENGTH_LABEL: Record<AffinityStrength, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function strengthDots(s: AffinityStrength): string {
  if (s === 'high') return '●●●';
  if (s === 'medium') return '●●○';
  return '●○○';
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AffinityMapCard({
  affinities,
}: AffinityMapCardProps): React.JSX.Element {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const totalActive = QUADRANT_KEYS.reduce((sum, k) => sum + affinities[k].length, 0);

  const activeMap = Object.fromEntries(
    QUADRANT_KEYS.map((k) => [
      k,
      new Map(affinities[k].map((item) => [item.value, item.strength])),
    ]),
  ) as Record<QuadrantKey, Map<string, AffinityStrength>>;

  return (
    <GlassCard>
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="solar:chart-square-linear" width={15} className="text-neutral-400" />
          <span className="text-xs font-semibold" style={{ color: 'var(--van-text-primary)' }}>
            Affinity Constellation
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-neutral-500">
          {totalActive} active
        </span>
      </div>

      {/* SVG constellation canvas */}
      <svg
        viewBox="0 0 440 320"
        className="w-full h-auto select-none"
        aria-label="Affinity constellation map"
      >
        <defs>
          {/* Glow filter — blurred layer merged under the crisp source */}
          {GLOW_FILTERS.map(({ id }) => (
            <filter key={id} id={id} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          {/* Beam gradient: transparent at canvas center → accent at cluster */}
          {QUADRANT_KEYS.map((key) => {
            const { accentHex } = QUADRANT_META[key];
            const c = CLUSTER_CENTER[key];
            return (
              <linearGradient
                key={`beam-grad-${key}`}
                id={`beam-grad-${key}`}
                x1={CANVAS_CENTER.x}
                y1={CANVAS_CENTER.y}
                x2={c.x}
                y2={c.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={accentHex} stopOpacity={0} />
                <stop offset="100%" stopColor={accentHex} stopOpacity={0.35} />
              </linearGradient>
            );
          })}
        </defs>

        {/* ── Layer 1: background star field ─────────────────────────────────── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {BG_STARS.map((s, i) => (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.o} />
          ))}
        </motion.g>

        {/* ── Layer 2: canvas centre crosshair ───────────────────────────────── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <line
            x1={CANVAS_CENTER.x - 8} y1={CANVAS_CENTER.y}
            x2={CANVAS_CENTER.x + 8} y2={CANVAS_CENTER.y}
            stroke="white" strokeWidth={0.7}
          />
          <line
            x1={CANVAS_CENTER.x} y1={CANVAS_CENTER.y - 8}
            x2={CANVAS_CENTER.x} y2={CANVAS_CENTER.y + 8}
            stroke="white" strokeWidth={0.7}
          />
          <circle
            cx={CANVAS_CENTER.x} cy={CANVAS_CENTER.y}
            r={3} fill="none" stroke="white" strokeWidth={0.7}
          />
        </motion.g>

        {/* ── Layer 3: cluster beam lines (centre → cluster, only if active) ─── */}
        {QUADRANT_KEYS.map((key) => {
          if (activeMap[key].size === 0) return null;
          const c = CLUSTER_CENTER[key];
          const len = segLen(CANVAS_CENTER, c);
          return (
            <motion.line
              key={`beam-${key}`}
              x1={CANVAS_CENTER.x} y1={CANVAS_CENTER.y}
              x2={c.x} y2={c.y}
              stroke={`url(#beam-grad-${key})`}
              strokeWidth={1}
              strokeDasharray={len}
              initial={{ strokeDashoffset: len }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.65, delay: 0.72, ease: 'easeOut' }}
            />
          );
        })}

        {/* ── Layer 4: per-quadrant cluster content ──────────────────────────── */}
        {QUADRANT_KEYS.map((key, quadIdx) => {
          const meta = QUADRANT_META[key];
          const center = CLUSTER_CENTER[key];
          const options = CATALOGUE[key];
          const qActive = activeMap[key];

          // Active node positions for connection lines
          const activeNodes = options
            .map((opt, i) => ({ opt, i, pos: nodePos(center, i, options.length) }))
            .filter(({ opt }) => qActive.has(opt.value));

          return (
            <g key={key}>
              {/* Connection lines between active nodes (≥2 needed) */}
              {activeNodes.length >= 2 &&
                activeNodes.flatMap((a, ai) =>
                  activeNodes.slice(ai + 1).map((b) => {
                    const len = segLen(a.pos, b.pos);
                    return (
                      <motion.line
                        key={`conn-${key}-${a.opt.value}-${b.opt.value}`}
                        x1={a.pos.x} y1={a.pos.y}
                        x2={b.pos.x} y2={b.pos.y}
                        stroke={meta.accentHex}
                        strokeWidth={0.8}
                        strokeOpacity={0.3}
                        strokeDasharray={len}
                        initial={{ strokeDashoffset: len }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 0.5, delay: 0.82, ease: 'easeOut' }}
                      />
                    );
                  }),
                )}

              {/* Cluster centre: orbit ring + dot + label */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2 + quadIdx * 0.09,
                  ease: [0.34, 1.56, 0.64, 1], // back-out spring
                }}
                style={{ transformOrigin: `${center.x}px ${center.y}px` }}
              >
                {/* Dashed orbit ring */}
                <circle
                  cx={center.x} cy={center.y}
                  r={NODE_ORBIT_RADIUS}
                  fill="none"
                  stroke={meta.accentHex}
                  strokeWidth={0.4}
                  strokeOpacity={0.14}
                  strokeDasharray="3 7"
                />
                {/* Centre dot */}
                <circle
                  cx={center.x} cy={center.y}
                  r={5}
                  fill={meta.accentHex}
                  fillOpacity={0.22}
                  stroke={meta.accentHex}
                  strokeWidth={1.5}
                  strokeOpacity={0.65}
                />
                {/* Category label — floats above the orbit */}
                <text
                  x={center.x}
                  y={center.y - NODE_ORBIT_RADIUS - 9}
                  textAnchor="middle"
                  fill={meta.accentHex}
                  fontSize="7.5"
                  fontWeight="700"
                  letterSpacing="1.3"
                  opacity={0.88}
                >
                  {meta.label.toUpperCase()}
                </text>
              </motion.g>

              {/* Item nodes */}
              {options.map((opt, i) => {
                const pos = nodePos(center, i, options.length);
                const strength = qActive.get(opt.value) ?? null;
                const isActive = strength !== null;
                const nodeDelay = 0.4 + (quadIdx * options.length + i) * 0.024;
                const lbl = labelProps(pos, center);

                return (
                  <g key={opt.value}>
                    {/* Pulse ring — only for active nodes */}
                    {isActive && (
                      <motion.circle
                        cx={pos.x} cy={pos.y}
                        r={8}
                        fill="none"
                        stroke={meta.accentHex}
                        strokeWidth={1.2}
                        animate={{ r: [8, 28], opacity: [0.65, 0] }}
                        transition={{
                          duration: 2.1,
                          repeat: Infinity,
                          ease: 'easeOut',
                          delay: 0.6 + quadIdx * 0.18,
                        }}
                      />
                    )}

                    {/* Node circle — scale in from zero */}
                    <motion.g
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.28, delay: nodeDelay, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      <circle
                        cx={pos.x} cy={pos.y}
                        r={isActive ? 7 : 2}
                        fill={isActive ? meta.accentHex : 'white'}
                        fillOpacity={isActive ? 0.88 : 0.14}
                        filter={isActive ? `url(#${meta.filterId})` : undefined}
                        onMouseEnter={(e) =>
                          setTooltip({
                            label: opt.label,
                            quadrant: key,
                            strength,
                            x: e.clientX + 14,
                            y: e.clientY - 10,
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        style={{ cursor: 'default' }}
                      />
                    </motion.g>

                    {/* Label beside active nodes */}
                    {isActive && (
                      <motion.text
                        x={lbl.x}
                        y={lbl.y + 4}
                        textAnchor={lbl.anchor}
                        fill={meta.accentHex}
                        fontSize="7.5"
                        fontWeight="600"
                        letterSpacing="0.4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.88 }}
                        transition={{ duration: 0.3, delay: nodeDelay + 0.12 }}
                        style={{ pointerEvents: 'none' }}
                      >
                        {opt.label}
                      </motion.text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div
              className="rounded-lg border px-3 py-2 text-xs backdrop-blur-md"
              style={{
                background: 'var(--van-surface)',
                borderColor: 'var(--van-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              }}
            >
              <p
                className="font-semibold mb-1"
                style={{ color: QUADRANT_META[tooltip.quadrant].accentHex }}
              >
                {tooltip.label}
              </p>
              {tooltip.strength ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] tracking-wider"
                    style={{
                      color: QUADRANT_META[tooltip.quadrant].accentHex,
                      opacity: 0.7,
                    }}
                  >
                    {strengthDots(tooltip.strength)}
                  </span>
                  <span className="text-neutral-500">
                    {STRENGTH_LABEL[tooltip.strength]} affinity
                  </span>
                </div>
              ) : (
                <p className="text-neutral-500">No affinity data</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
