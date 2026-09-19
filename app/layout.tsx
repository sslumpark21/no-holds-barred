import type { Metadata } from "next"

import "./globals.css"

import { AudioProvider } from "@/components/audio/audio-provider"
import { AudioPlayer } from "@/components/audio/audio-player"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "no.holds.barred.",
  description:
    "no.holds.barred. is an independent creative brand and multidisciplinary collective.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AudioProvider>
          <SiteHeader />
          <div className="pb-20 md:pb-24">{children}</div>
          <AudioPlayer />
        </AudioProvider>
      </body>
    </html>
  )
}
