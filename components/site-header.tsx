"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const NAV = [
  { label: "Artists", href: "/artists" },
  { label: "Affiliates", href: "/affiliates" },
  { label: "Releases", href: "/releases" },
  { label: "Journal", href: "/journal" },
  { label: "Events", href: "/events" },
  { label: "About", href: "/about" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="font-display text-lg leading-none tracking-tight py-4 md:py-5"
          aria-label="no.holds.barred home"
        >
          no.holds.barred
        </Link>

        <nav className="hidden md:flex items-stretch">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`eyebrow px-4 py-6 border-l border-line hover-invert ${
                  active ? "bg-ink text-paper" : ""
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden eyebrow px-3 py-4 -mr-3"
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 top-[57px] z-40 bg-paper border-t border-line">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-display text-4xl uppercase px-4 py-5 border-b border-line"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
