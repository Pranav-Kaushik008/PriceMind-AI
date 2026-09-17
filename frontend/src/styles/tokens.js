/**
 * PriceMind AI — Design System Token Constants
 * Programmatic access to color palettes, chart tokens, and typography styles.
 */

export const tokens = {
  colors: {
    bg: {
      app: 'var(--pm-bg-app)',
      surface: 'var(--pm-bg-surface)',
      elevated: 'var(--pm-bg-elevated)',
      subtle: 'var(--pm-bg-subtle)',
      hover: 'var(--pm-bg-hover)',
      active: 'var(--pm-bg-active)',
      selected: 'var(--pm-bg-selected)',
    },
    border: {
      subtle: 'var(--pm-border-subtle)',
      default: 'var(--pm-border-default)',
      strong: 'var(--pm-border-strong)',
      focus: 'var(--pm-border-focus)',
      accent: 'var(--pm-border-accent)',
    },
    text: {
      primary: 'var(--pm-text-primary)',
      secondary: 'var(--pm-text-secondary)',
      muted: 'var(--pm-text-muted)',
      dim: 'var(--pm-text-dim)',
      inverse: 'var(--pm-text-inverse)',
    },
    positive: {
      DEFAULT: 'var(--pm-positive)',
      hover: 'var(--pm-positive-hover)',
      subtle: 'var(--pm-positive-subtle)',
      border: 'var(--pm-positive-border)',
      text: 'var(--pm-positive-text)',
    },
    negative: {
      DEFAULT: 'var(--pm-negative)',
      hover: 'var(--pm-negative-hover)',
      subtle: 'var(--pm-negative-subtle)',
      border: 'var(--pm-negative-border)',
      text: 'var(--pm-negative-text)',
    },
    warning: {
      DEFAULT: 'var(--pm-warning)',
      hover: 'var(--pm-warning-hover)',
      subtle: 'var(--pm-warning-subtle)',
      border: 'var(--pm-warning-border)',
      text: 'var(--pm-warning-text)',
    },
    info: {
      DEFAULT: 'var(--pm-info)',
      hover: 'var(--pm-info-hover)',
      subtle: 'var(--pm-info-subtle)',
      border: 'var(--pm-info-border)',
      text: 'var(--pm-info-text)',
    },
    accent: {
      DEFAULT: 'var(--pm-accent)',
      hover: 'var(--pm-accent-hover)',
      subtle: 'var(--pm-accent-subtle)',
      border: 'var(--pm-accent-border)',
      text: 'var(--pm-accent-text)',
    },
    cyan: {
      DEFAULT: 'var(--pm-cyan)',
      subtle: 'var(--pm-cyan-subtle)',
      border: 'var(--pm-cyan-border)',
    },
  },

  // Direct hex values for Recharts SVG renders & Canvas calculations
  chart: {
    dark: {
      grid: '#182030',
      axis: '#64748B',
      tooltipBg: '#131A27',
      tooltipBorder: '#222D42',
      primary: '#6366F1',
      cyan: '#06B6D4',
      positive: '#10B981',
      negative: '#EF4444',
      warning: '#F59E0B',
      neutral: '#94A3B8',
      competitor: '#EC4899',
      benchmark: '#E2E8F0',
    },
    light: {
      grid: '#E2E8F0',
      axis: '#94A3B8',
      tooltipBg: '#FFFFFF',
      tooltipBorder: '#CBD5E1',
      primary: '#4F46E5',
      cyan: '#0891B2',
      positive: '#059669',
      negative: '#DC2626',
      warning: '#D97706',
      neutral: '#64748B',
      competitor: '#DB2777',
      benchmark: '#1E293B',
    }
  },

  typography: {
    display: 'font-sans text-2xl font-bold tracking-tight',
    h1: 'font-sans text-xl font-bold tracking-tight',
    h2: 'font-sans text-lg font-semibold tracking-tight',
    h3: 'font-sans text-base font-semibold',
    h4: 'font-sans text-sm font-semibold',
    body: 'font-sans text-sm font-normal leading-relaxed',
    bodySmall: 'font-sans text-xs font-normal leading-normal',
    caption: 'font-sans text-[11px] font-medium tracking-wide uppercase',
    mono: 'font-mono text-xs font-medium tracking-tight',
    tabular: 'font-mono font-medium tracking-tight tabular-nums',
  }
};

export default tokens;
