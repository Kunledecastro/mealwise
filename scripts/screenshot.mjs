import { chromium } from "@playwright/test";
const out = process.argv[2];
const routes = process.argv.slice(3);
const b = await chromium.launch();
const errors = [];
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1280, height: 860 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: "Africa/Lagos" });
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errors.push(`${name} ${p.url()}: ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`${name} ${p.url()}: ${e.message}`));
  for (const r of routes) {
    await p.goto("http://localhost:3100" + r, { waitUntil: "networkidle" });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${name}-${r.replace(/[\/?=]/g, "_") || "root"}.png`, fullPage: true });
  }
  await ctx.close();
}
await b.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
