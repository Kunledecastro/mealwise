import { chromium } from "@playwright/test";
const out = process.argv[2];
const routes = process.argv.slice(3);
const b = await chromium.launch();
const errors = [];
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1280, height: 860 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: "Africa/Lagos" });
  const p = await ctx.newPage();
  // Photo hosts are unreachable from the build machine: show a stand-in so layout can be reviewed.
  await p.route("**/_next/image**", (r) => r.fulfill({ path: "tests/e2e/fixtures/photo.jpg", contentType: "image/jpeg" }));
  p.on("console", (m) => m.type() === "error" && errors.push(`${name} ${p.url()}: ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`${name} ${p.url()}: ${e.message}`));
  for (const r of routes) {
    await p.goto("http://localhost:3100" + r, { waitUntil: "networkidle" });
    // Scroll through the page so scroll-triggered reveals run, then let animations settle.
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${name}-${r.replace(/[\/?=]/g, "_") || "root"}.png`, fullPage: true });
  }
  await ctx.close();
}
await b.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
