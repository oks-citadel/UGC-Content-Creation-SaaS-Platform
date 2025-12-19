import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'NEXUS - UGC & Marketing Platform',
    template: '%s | NEXUS',
  },
  description:
    'Transform how you create, manage, and monetize user-generated content with AI-powered tools.',
  keywords: [
    'UGC',
    'User Generated Content',
    'Marketing',
    'Creator',
    'Campaign',
    'AI Video',
    'Content Creation',
  ],
  authors: [{ name: 'NEXUS Team' }],
  creator: 'NEXUS',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexusugc.com',
    siteName: 'NEXUS',
    title: 'NEXUS - UGC & Marketing Platform',
    description:
      'Transform how you create, manage, and monetize user-generated content with AI-powered tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NEXUS Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEXUS - UGC & Marketing Platform',
    description:
      'Transform how you create, manage, and monetize user-generated content with AI-powered tools.',
    images: ['/og-image.png'],
    creator: '@nexusugc',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
