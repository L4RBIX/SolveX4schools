import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brilliant | Learn by doing",
};

export default function BrilliantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-site="brilliant" className="font-b-sans text-b-ink">
      {children}
    </div>
  );
}
