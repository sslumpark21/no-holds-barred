import Link from "next/link"

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  href?: string
  hrefLabel?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, href, hrefLabel = "View all", className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 border-b border-line pb-4 ${className}`}>
      <div>
        {eyebrow ? <p className="eyebrow text-muted-ink mb-3">{eyebrow}</p> : null}
        <h2 className="font-display display-huge text-4xl md:text-6xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="eyebrow link-underline shrink-0 pb-2 whitespace-nowrap">
          {hrefLabel} →
        </Link>
      ) : null}
    </div>
  )
}
