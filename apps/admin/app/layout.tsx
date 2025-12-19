import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NEXUS Admin Dashboard',
  description: 'Internal administration dashboard for NEXUS Platform',
  robots: 'noindex, nofollow', // Prevent indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
