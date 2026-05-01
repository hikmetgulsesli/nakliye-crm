import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

/**
 * Renkler iki katmanli kuruldu:
 *  1) Mevcut hardcoded paletler korundu (geriye donuk uyum, tum sayfalardaki
 *     bg-primary / bg-bg-light / text-text-main vb. class'lar bozulmasin).
 *  2) `surface`, `accent-soft`, `text-token`, `magenta` vb. yeni renkler
 *     :root CSS degiskenlerine bagli — accent ve density toggle'lari runtime'da
 *     calisacak. Yeni componentler bunlari kullanacak.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backwards-compatible primary palette (var olan class'lar icin)
        primary: {
          DEFAULT: 'var(--accent)',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: 'var(--accent)',
          600: 'var(--accent-hover)',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: '#f8fafc',
        'bg-light': '#f6f6f8',
        'bg-dark': '#0b1220',
        'sidebar-dark': '#0f172a',
        'text-main': '#1e293b',
        'text-dark': '#e2e8f0',

        // ---- Token-driven (Haven design) ----
        // Yeni componentler bunlari kullanir; tema/aksan degisince anlik degisir.
        token: {
          bg: 'var(--bg)',
          'bg-elev': 'var(--bg-elev)',
          'bg-panel': 'var(--bg-panel)',
          'bg-subtle': 'var(--bg-subtle)',
          'bg-hover': 'var(--bg-hover)',
          'bg-active': 'var(--bg-active)',
          border: 'var(--border)',
          'border-strong': 'var(--border-strong)',
          text: 'var(--text)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
        },
        brand: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          fg: 'var(--accent-fg)',
        },
        magenta: {
          DEFAULT: 'var(--magenta)',
          soft: 'var(--magenta-soft)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
        },
      },
      fontFamily: {
        display: ['Geist', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Geist', '"Source Sans 3"', 'system-ui', 'sans-serif'],
        sans: ['Geist', '"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '1.5rem',
        '2xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        token: 'var(--shadow)',
        'token-sm': 'var(--shadow-sm)',
        'token-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [forms],
};

export default config;
