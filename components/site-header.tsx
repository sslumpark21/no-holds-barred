"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  {
    label: "Affiliates",
    href: "/affiliates",
  },
  {
    label: "Releases",
    href: "/releases",
  },
  {
    label: "Merch",
    href: "/merch",
  },
  {
    label: "About",
    href: "/about",
  },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] border-b border-[#d5bb8a]/10 bg-[#050504]/80 text-[#ded2b8] backdrop-blur-md">

      <div className="flex min-h-[58px] items-center justify-between gap-8 px-4 md:px-7">

        <Link
          href="/"
          className="font-display text-lg tracking-[-0.04em] text-[#ded2b8]"
        >
          no.holds.barred.
        </Link>

        <nav className="flex items-center gap-4 overflow-x-auto md:gap-7">

          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  whitespace-nowrap
                  font-mono
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  transition-colors
                  ${
                    active
                      ? "text-[#e6c67d]"
                      : "text-[#c9bba1]/60 hover:text-[#ead8b4]"
                  }
                `}
              >
                {item.label}
              </Link>
            )
          })}

        </nav>

      </div>

    </header>
  )
}
