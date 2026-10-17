// Renders app/icon.svg to PNG app icons using the local Chromium.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const svg = readFileSync("app/icon.svg", "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [["icon-192.png", 192, 0], ["icon-512.png", 512, 0], ["icon-maskable-512.png", 512, 64], ["apple-touch-icon.png", 180, 0]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:#0d1411"><div style="padding:${pad}px">${svg.replace("<svg", `<svg width="${size - pad * 2}" height="${size - pad * 2}"`)}</div></body>`);
  await page.screenshot({ path: `public/${name}`, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log("icons written");
