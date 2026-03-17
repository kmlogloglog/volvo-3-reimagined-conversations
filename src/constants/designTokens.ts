/**
 * Design tokens — source of truth for the Vän Dashboard design system.
 * Derived from ui-references/01_core_crm_dashboard.html (primary)
 * and ui-references/02_crm_analytics_variant.html (secondary).
 */

export const colors = {
  base: '#030303',
  card: '#0A0A0A',
  accent: {
    amber: '#FBBF24',     // amber-500
    amberLight: '#FDE68A', // amber-200
    amberMid: '#FBBF24',   // amber-400
    sky: '#BAE6FD',        // sky-200
    skyMid: '#7DD3FC',     // sky-300
  },
  state: {
    positive: '#34D399',   // emerald-400
    warning: '#FBBF24',    // amber-500
    negative: '#F87171',   // red-400
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A3A3A3',  // neutral-400
    muted: '#737373',      // neutral-500
    faint: '#525252',      // neutral-600
  },
  border: {
    default: 'rgba(255, 255, 255, 0.05)',  // white/5
    hover: 'rgba(255, 255, 255, 0.10)',     // white/10
  },
} as const;

export const stageColors: Record<string, string> = {
  awareness: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  consideration: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  decision: 'bg-green-500/10 text-green-400 border-green-500/20',
} as const;

export const strengthColors: Record<string, string> = {
  high: 'text-amber-400',
  medium: 'text-neutral-300',
  low: 'text-neutral-500',
} as const;

/** Chart color palette — primary amber, secondary neutral */
export const chartPalette = {
  primary: '#FBBF24',
  primaryFaded: 'rgba(251, 191, 36, 0.2)',
  secondary: '#A3A3A3',
  secondaryFaded: 'rgba(163, 163, 163, 0.1)',
  grid: 'rgba(255, 255, 255, 0.05)',
} as const;

/** Badge variant class map — used by StatusBadge */
export const badgeVariants = {
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/10',  dot: 'bg-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/10', dot: 'bg-emerald-400' },
  neutral: { bg: 'bg-neutral-500/10', text: 'text-neutral-500', border: 'border-neutral-500/20', dot: 'bg-neutral-500' },
  sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20',     dot: 'bg-sky-400' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  dot: 'bg-purple-400' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    dot: 'bg-blue-400' },
  green:   { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20',   dot: 'bg-green-400' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    dot: 'bg-rose-400' },
} as const;

export type BadgeVariant = keyof typeof badgeVariants;
