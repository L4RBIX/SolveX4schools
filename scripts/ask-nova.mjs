const body = {
  blockId: process.env.BLOCK ?? "m1.l1.b2",
  message: process.argv[2] ?? "Где ошибка?",
  requestedLevel: Number(process.env.LEVEL ?? 1),
  locale: "ru",
  draft: process.env.CODE ? { code: process.env.CODE } : { selectedOptionId: '"2 + 2"' },
};

const res = await fetch(`${process.env.BASE ?? "http://localhost:3000"}/api/nova/hint`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

console.log("status", res.status);
if (!res.body) {
  console.log(await res.text());
  process.exit(1);
}

const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = "";
let text = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const frames = buf.split("\n\n");
  buf = frames.pop() ?? "";
  for (const f of frames) {
    const ev = /^event: (.+)$/m.exec(f)?.[1];
    const data = /^data: (.+)$/m.exec(f)?.[1];
    if (!ev || !data) continue;
    const p = JSON.parse(data);
    if (ev === "policy") console.log("POLICY", JSON.stringify(p));
    if (ev === "token") text += p.text;
    if (ev === "error") console.log("ERROR", JSON.stringify(p));
  }
}
console.log("\n--- NOVA SAID ---\n" + text);
