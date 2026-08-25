import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * Development surfaces.
 *
 * Not in the product navigation, and not reachable in production at all — the
 * 404 below is a route-level refusal, not a hidden link. These pages show a
 * learner's raw evidence and the system's internal reasoning, which is exactly
 * the material that must not be one guessed URL away from a student.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();

  const tabs = [
    { href: "/dev/intelligence", label: "Intelligence" },
    { href: "/dev/nova", label: "Nova" },
    { href: "/dev/execution", label: "Execution" },
  ];

  return (
    <div className="min-h-dvh bg-b-bg font-b-sans text-white">
      <header className="border-b border-white/20 bg-b-panel px-8">
        <div className="mx-auto flex h-16 w-full max-w-[1216px] items-center gap-6">
          <span className="text-[15px] font-bold tracking-wide text-b-warn-icon uppercase">
            Dev
          </span>
          <nav className="flex gap-6">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="text-white/60 hover:text-white">
                {t.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-white/40 hover:text-white">
            ← product
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1216px] px-8 py-8">{children}</main>
    </div>
  );
}
