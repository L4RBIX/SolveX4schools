/**
 * White footer: hairline top rule, wordmark, four link columns, and a bottom
 * bar with the copyright line and a row of small social glyphs.
 */

interface FooterColumn {
  title: string;
  links: readonly string[];
}

const COLUMNS: readonly FooterColumn[] = [
  {
    title: "Company",
    links: ["About", "Careers", "Newsroom", "Contact us"],
  },
  {
    title: "Resources",
    links: ["Help center", "Blog", "Gift Brilliant", "Community", "Stories"],
  },
  {
    title: "Courses",
    links: ["Math", "Data analysis", "Computer science", "Programming & AI", "Science & engineering"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Cookie preferences", "Accessibility"],
  },
];

function GlyphX() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M12.3 1.5h2.3l-5 5.7 5.9 7.8h-4.6L7.3 9.3l-4.1 4.7H.9l5.4-6.1L.6 1.5h4.7l3.3 4.3 3.7-4.3Zm-.8 11.1h1.3L4.6 2.8H3.2l8.3 9.8Z"
      />
    </svg>
  );
}

function GlyphCamera() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.4" y="1.4" width="13.2" height="13.2" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
    </svg>
  );
}

function GlyphPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="0.8" y="3" width="14.4" height="10" rx="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.6 5.9 10.6 8l-4 2.1V5.9Z" fill="currentColor" />
    </svg>
  );
}

function GlyphNetwork() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.6 6.6v5M4.6 4.4v.1M7.7 11.6V6.6m0 1.8c0-1 .8-1.8 1.8-1.8s1.9.8 1.9 1.8v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const SOCIALS = [
  { label: "X", glyph: <GlyphX /> },
  { label: "Instagram", glyph: <GlyphCamera /> },
  { label: "YouTube", glyph: <GlyphPlay /> },
  { label: "LinkedIn", glyph: <GlyphNetwork /> },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-b-line bg-b-white">
      <div className="b-shell py-14 lg:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <a
            href="/brilliant"
            className="font-b-sans text-[26px] font-bold leading-none tracking-[-0.02em] text-b-ink"
          >
            Brilliant
          </a>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:gap-x-16"
          >
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-[15px] font-semibold leading-[22px] text-b-ink">
                  {column.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="/brilliant"
                        className="text-[15px] leading-[22px] text-b-muted transition-colors hover:text-b-ink"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start gap-6 border-t border-b-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-[20px] text-b-muted">
            &copy; 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo
            are trademarks of Brilliant Worldwide, Inc.
          </p>
          <ul className="flex items-center gap-5">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href="/brilliant"
                  aria-label={social.label}
                  className="inline-flex text-b-muted transition-colors hover:text-b-ink"
                >
                  {social.glyph}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
