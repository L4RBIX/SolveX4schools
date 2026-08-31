/**
 * Downloads the reference sites' own assets into public/assets/original/.
 *
 * Reads a newline-delimited URL list and mirrors each file, preserving the
 * source path so nothing collides. Runs four at a time and reports every
 * failure rather than silently skipping it.
 *
 *   node scripts/download-original-assets.mjs <urls.txt> <outDir> [originStrip]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const [, , listPath, outDir] = process.argv;
if (!listPath || !outDir) {
  console.error("usage: node scripts/download-original-assets.mjs <urls.txt> <outDir>");
  process.exit(1);
}

const { readFile } = await import("node:fs/promises");
const urls = (await readFile(listPath, "utf8"))
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

/** Mirror the remote path so two files named 1.png never overwrite each other. */
function localPathFor(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  return join(outDir, host, u.pathname.replace(/^\//, ""));
}

let ok = 0;
const failures = [];

async function fetchOne(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*" } });
    if (!res.ok) {
      failures.push(`${res.status} ${url}`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) {
      failures.push(`empty ${url}`);
      return;
    }
    const dest = localPathFor(url);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    ok += 1;
    process.stdout.write(`\r  ${ok}/${urls.length}   `);
  } catch (error) {
    failures.push(`${String(error).slice(0, 80)} ${url}`);
  }
}

const CONCURRENCY = 4;
for (let i = 0; i < urls.length; i += CONCURRENCY) {
  await Promise.all(urls.slice(i, i + CONCURRENCY).map(fetchOne));
}

console.log(`\ndownloaded ${ok}/${urls.length} -> ${outDir}`);
if (failures.length) {
  console.log(`failed ${failures.length}:`);
  failures.slice(0, 25).forEach((f) => console.log("  " + f));
}
