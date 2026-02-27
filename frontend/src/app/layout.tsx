import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TruVis.info — Verified Business Directory',
    template: '%s | TruVis.info',
  },
  description:
    'Discover verified businesses and trusted corporate partners in the UAE and beyond. TruVis.info is the premier verified business ecosystem platform.',
  keywords: ['business directory', 'verified companies', 'UAE business', 'corporate services', 'TruVis'],
  authors: [{ name: 'TruVis Corporate Services' }],
  creator: 'TruVis',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://truvis.info'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://truvis.info',
    siteName: 'TruVis.info',
    title: 'TruVis.info — Verified Business Directory',
    description: 'The trusted business ecosystem platform for UAE and international companies.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TruVis.info',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TruVis.info — Verified Business Directory',
    description: 'The trusted business ecosystem platform.',
    images: ['/og-image.png'],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
