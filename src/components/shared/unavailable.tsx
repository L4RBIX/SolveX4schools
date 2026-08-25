/**
 * Explicit "original unavailable" notice.
 *
 * The brief forbids substituting a reconstruction for a page we cannot reach.
 * Where the original sits behind authentication, this renders the finding
 * instead of a fabricated screen.
 */
export function Unavailable({
  route,
  original,
  evidence,
}: {
  route: string;
  original: string;
  evidence: string[];
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6 py-24 font-mono text-[13px] leading-[1.7] text-[#191F28]">
      <p className="text-[11px] font-bold tracking-[0.08em] text-[#8B95A1] uppercase">
        {route}
      </p>
      <h1 className="mt-4 font-sans text-[28px] leading-[1.2] font-bold tracking-[-0.02em]">
        Original component unavailable.
      </h1>
      <p className="mt-5 text-[#6B7684]">
        Source: <span className="text-[#191F28]">{original}</span>
      </p>
      <p className="mt-5 text-[#6B7684]">
        This page is not reconstructed. The original is gated behind
        authentication, so there is nothing to extract and nothing has been
        invented in its place.
      </p>
      <ul className="mt-5 flex flex-col gap-1.5 border-l-2 border-[#E5E8EB] pl-4 text-[#6B7684]">
        {evidence.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </main>
  );
}
