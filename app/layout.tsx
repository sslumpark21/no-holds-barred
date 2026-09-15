import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Anton, Inter } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AudioProvider } from '@/components/audio/audio-provider'
import { AudioPlayer } from '@/components/audio/audio-player'
import './globals.css'

const display = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'no.holds.barred — music / art / culture',
  description:
    'no.holds.barred is an independent music label and multidisciplinary creative collective. Artists, affiliates, releases, journal and events.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">
        <AudioProvider>
          <SiteHeader />
          <div className="min-h-screen pb-24">{children}</div>
          <SiteFooter />
          <AudioPlayer />
        </AudioProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
