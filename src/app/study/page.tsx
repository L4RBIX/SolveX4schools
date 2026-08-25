import Link from "next/link";

const ROUTES = [
  {
    group: "brilliant.org — public",
    items: [
      { href: "/brilliant", label: "Homepage", note: "Hero, stats, feature rows — light surface" },
      { href: "/brilliant/courses", label: "Course map", note: "Learning paths, tiles, locked states — dark surface" },
      { href: "/brilliant/math", label: "Subject page", note: "Course tabs, chapter list" },
      { href: "/brilliant/about", label: "About", note: "Mission, team, careers" },
      { href: "/brilliant/faq", label: "FAQ", note: "Accordion, support links" },
      { href: "/brilliant/wiki", label: "Wiki", note: "Article index" },
      { href: "/brilliant/terms-of-use", label: "Terms of use", note: "Long-form legal" },
    ],
  },
  {
    group: "brilliant.org — authenticated",
    items: [
      { href: "/brilliant/app/home", label: "Home", note: "Streak rail, 3D course deck, thumbnail switcher" },
      { href: "/brilliant/app/courses", label: "Learning paths", note: "13 paths, carousels, course tiles" },
      { href: "/brilliant/app/you", label: "Dashboard", note: "Weekly summary, bar chart, strengths" },
      { href: "/brilliant/app/course", label: "Course gameboard", note: "Zig-zag lesson path, Koji node, sticky levels" },
      { href: "/brilliant/lesson", label: "Lesson player", note: "Scheduler interactive, verdict states, Koji" },
    ],
  },
];

export default function StudyIndex() {
  return (
    <main className="min-h-screen bg-[#0e0e0e] px-6 py-16 font-b-sans text-white sm:py-24">
      <div className="mx-auto w-full max-w-[820px]">
        <p className="b-eyebrow text-white/40">Frontend reverse engineering</p>
        <h1 className="mt-4 font-b-serif text-[2.5rem] leading-[1.1] font-medium tracking-[-0.02em] sm:text-[3.25rem]">
          Brilliant, recreated.
        </h1>
        <p className="mt-5 max-w-xl text-white/50">
          brilliant.org rebuilt in Next.js. Tokens, layout, interaction models and
          animations were extracted from the live pages rather than approximated.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {ROUTES.map((group) => (
            <section key={group.group}>
              <h2 className="b-eyebrow text-white/40">{group.group}</h2>
              <ul className="mt-5 flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-4 rounded-xl border-2 border-[#2a2a2a] bg-[#161616] px-5 py-4 transition-colors duration-150 hover:border-[#4c4c4c]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1.0625rem] font-medium">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-white/40">
                          {item.note}
                        </span>
                      </span>
                      <span className="font-b-mono text-xs text-white/30 transition-colors group-hover:text-white/60">
                        {item.href}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
