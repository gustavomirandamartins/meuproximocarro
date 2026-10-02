import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { PreventZoom } from '@/components/utilities/PreventZoom';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#070e20' },
  ],
};

export const metadata: Metadata = {
  title: 'Meu Próximo Carro',
  description: 'Ferramenta analítica e comparativa para decisão familiar de compra automotiva na Bahia com foco em híbridos, espaço traseiro ISOFIX e TCO.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meu Próximo Carro',
  },
  openGraph: {
    title: 'Meu Próximo Carro',
    description: 'Ferramenta analítica e comparativa para decisão familiar de compra automotiva na Bahia com foco em híbridos, espaço traseiro ISOFIX e TCO.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meu Próximo Carro',
    description: 'Ferramenta analítica e comparativa para decisão familiar de compra automotiva na Bahia com foco em híbridos, espaço traseiro ISOFIX e TCO.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="bg-slate-50 dark:bg-[#070e20]" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-[#070e20] touch-pan-x touch-pan-y min-h-screen text-slate-900 dark:text-slate-100" suppressHydrationWarning>
        <PreventZoom />
        {children}
      </body>
    </html>
  );
}
