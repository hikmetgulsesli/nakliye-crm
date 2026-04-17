import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './index.css';

// FOUC onleme: persist'ten tema okuyup mount oncesi uygula
try {
  const stored = localStorage.getItem('nakliye-crm-theme');
  const parsed = stored ? JSON.parse(stored) : null;
  const theme: 'light' | 'dark' =
    parsed?.state?.theme ??
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (theme === 'dark') document.documentElement.classList.add('dark');
} catch {
  // ignore, default = light
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
