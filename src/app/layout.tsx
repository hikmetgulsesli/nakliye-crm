<<<<<<< HEAD
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nakliye CRM",
  description: "Uluslararası Nakliye CRM Sistemi",
=======
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nakliye CRM',
  description: 'Uluslararası nakliye operasyonları için CRM uygulaması',
>>>>>>> origin/feature/crm-core-modules
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
<<<<<<< HEAD
      <body className="antialiased">
        {children}
      </body>
=======
      <body className="antialiased">{children}</body>
>>>>>>> origin/feature/crm-core-modules
    </html>
  );
}
