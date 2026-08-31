"use client";

import { useEffect, useRef } from "react";

/**
 * `.wiki-self-citation` — `clear: both; margin: 48px 0; font-size 12px;
 * line-height 1.2em`.
 *
 * `app/wiki:getCitationTime` fills the empty `.retrieval-time` span at load
 * from the underscore template in `#retrieval-time-content`:
 *
 *   <%- hour %>:<%- minute %>, <%- month %> <%- day %>, <%- year %>,
 *
 * i.e. zero-padded hour and minute on the viewer's local clock, full month
 * name, un-padded day, and a trailing comma that belongs to the template — so
 * the line reads "Retrieved 14:07, August 21, 2026, from https://…".
 *
 * The span ships empty and is written to directly, exactly as the original
 * controller does, which also keeps the server render and the first client
 * render identical.
 */
export function SelfCitation() {
  const retrievalTime = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = retrievalTime.current;
    if (!node) return;

    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const month = now.toLocaleString("en-US", { month: "long" });
    node.textContent = `${hour}:${minute}, ${month} ${now.getDate()}, ${now.getFullYear()},`;
  }, []);

  return (
    <div className="my-12 clear-both text-[12px] leading-[1.2em]">
      <strong className="font-semibold">Cite as:</strong> Logarithms.{" "}
      <em className="italic">Brilliant.org</em>. Retrieved <span ref={retrievalTime} /> from{" "}
      <a
        href="https://brilliant.org/wiki/logarithms/"
        className="text-[#456DFF] transition-colors hover:text-[#1245ff]"
      >
        https://brilliant.org/wiki/logarithms/
      </a>
    </div>
  );
}
