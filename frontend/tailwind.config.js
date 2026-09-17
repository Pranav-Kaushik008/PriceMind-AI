/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pm: {
          // Canvas & Surfaces
          bg: 'var(--pm-bg-app)',
          surface: 'var(--pm-bg-surface)',
          elevated: 'var(--pm-bg-elevated)',
          subtle: 'var(--pm-bg-subtle)',
          hover: 'var(--pm-bg-hover)',
          active: 'var(--pm-bg-active)',
          selected: 'var(--pm-bg-selected)',

          // Backward compatibility aliases
          darkest: 'var(--pm-bg-app)',
          darker: 'var(--pm-bg-subtle)',
          card: 'var(--pm-bg-surface)',
          cardHover: 'var(--pm-bg-hover)',
          cardActive: 'var(--pm-bg-active)',

          // Borders
          border: 'var(--pm-border-default)',
          borderSubtle: 'var(--pm-border-subtle)',
          borderStrong: 'var(--pm-border-strong)',
          borderFocus: 'var(--pm-border-focus)',
          borderAccent: 'var(--pm-border-accent)',

          // Text hierarchy
          text: 'var(--pm-text-primary)',
          textPrimary: 'var(--pm-text-primary)',
          textSecondary: 'var(--pm-text-secondary)',
          textMuted: 'var(--pm-text-muted)',
          textDim: 'var(--pm-text-dim)',
          textInverse: 'var(--pm-text-inverse)',

          // Semantic states
          positive: 'var(--pm-positive)',
          positiveHover: 'var(--pm-positive-hover)',
          positiveBg: 'var(--pm-positive-subtle)',
          positiveBorder: 'var(--pm-positive-border)',
          positiveText: 'var(--pm-positive-text)',
          lift: 'var(--pm-positive)',
          liftBg: 'var(--pm-positive-subtle)',

          negative: 'var(--pm-negative)',
          negativeHover: 'var(--pm-negative-hover)',
          negativeBg: 'var(--pm-negative-subtle)',
          negativeBorder: 'var(--pm-negative-border)',
          negativeText: 'var(--pm-negative-text)',
          risk: 'var(--pm-negative)',
          riskBg: 'var(--pm-negative-subtle)',

          warning: 'var(--pm-warning)',
          warningHover: 'var(--pm-warning-hover)',
          warningBg: 'var(--pm-warning-subtle)',
          warningBorder: 'var(--pm-warning-border)',
          warningText: 'var(--pm-warning-text)',

          info: 'var(--pm-info)',
          infoHover: 'var(--pm-info-hover)',
          infoBg: 'var(--pm-info-subtle)',
          infoBorder: 'var(--pm-info-border)',
          infoText: 'var(--pm-info-text)',

          accent: 'var(--pm-accent)',
          accentHover: 'var(--pm-accent-hover)',
          accentBg: 'var(--pm-accent-subtle)',
          accentBorder: 'var(--pm-accent-border)',
          accentText: 'var(--pm-accent-text)',
          accentLight: 'var(--pm-accent-text)',

          cyan: 'var(--pm-cyan)',
          cyanBg: 'var(--pm-cyan-subtle)',
          cyanBorder: 'var(--pm-cyan-border)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'sm': 'var(--pm-shadow-sm)',
        'md': 'var(--pm-shadow-md)',
        'lg': 'var(--pm-shadow-lg)',
        'drawer': 'var(--pm-shadow-drawer)',
        'subtle': 'var(--pm-shadow-sm)',
        'elevated': 'var(--pm-shadow-md)',
        'panel': '0 0 0 1px var(--pm-border-subtle), var(--pm-shadow-sm)',
      },
      borderRadius: {
        'sm': '3px',
        'DEFAULT': '5px',
        'md': '6px',
        'lg': '8px',
      }
    },
  },
  plugins: [],
}
