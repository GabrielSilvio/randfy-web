import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/error-boundary'
import SentryInit from './sentry-init'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563EB',
}

export const metadata: Metadata = {
  title: 'Randfy',
  description:
    'Sistema completo de gestão para clínicas com IA, automação de WhatsApp e prontuários inteligentes. Reduza faltas em 40% e foque no que importa: seus pacientes.',
  keywords: [
    'gestão de clínicas',
    'prontuário eletrônico',
    'telemedicina',
    'automação whatsapp',
    'IA para clínicas',
    'sistema médico',
    'agenda médica',
  ],
  authors: [{ name: 'Randfy Health Solutions' }],
  creator: 'Randfy Health Solutions',
  publisher: 'Randfy Health Solutions',
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
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://randfy.com.br',
    siteName: 'Randfy',
    title: 'Randfy - Gestão Inteligente de Clínicas',
    description:
      'Sistema completo de gestão para clínicas com IA e automação de WhatsApp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Randfy - Gestão Inteligente de Clínicas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Randfy - Gestão Inteligente de Clínicas',
    description:
      'Sistema completo de gestão para clínicas com IA e automação de WhatsApp',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SentryInit />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
