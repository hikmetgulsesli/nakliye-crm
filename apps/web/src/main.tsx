import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initSentry } from './config/sentry';
import './i18n';
import './index.css';
import { useBrandStore } from './stores/brandStore';

initSentry();

// Brand'i mount oncesi async fetch — dondurmeyiz, gelir gelmez logo/title/renk
// uygulanir. Default 'NakliyeCRM' boyunca gozukur (FOUC ihmal edilebilir).
useBrandStore.getState().fetch();

// FOUC onleme: persist'ten tema/aksan/yogunluk okuyup mount oncesi uygula
try {
  const stored = localStorage.getItem('nakliye-crm-theme');
  const parsed = stored ? JSON.parse(stored) : null;
  const root = document.documentElement;

  const theme: 'light' | 'dark' =
    parsed?.state?.theme ??
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const accent: 'blue' | 'magenta' | 'lime' = parsed?.state?.accent ?? 'blue';
  const density: 'comfortable' | 'compact' = parsed?.state?.density ?? 'comfortable';

  if (theme === 'dark') root.classList.add('dark');
  root.dataset.theme = theme;
  root.dataset.accent = accent;
  root.dataset.density = density;
} catch {
  // ignore, default = light/blue/comfortable
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
