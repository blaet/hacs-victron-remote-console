#!/usr/bin/env node
// Visual verification: renders tools/demo.html with mocked hass states at
// desktop and mobile widths, screenshots each view into docs/reference/.
const path = require("path");

(async () => {
  const { chromium } = require("/tmp/node_modules/playwright");
  const fs = require("fs");
  const outDir = path.join(__dirname, "..", "docs", "reference");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  // Serve over http to avoid file:// CORS restrictions on module scripts.
  const http = require("http");
  const fs2 = require("fs");
  const root = path.join(__dirname, "..");
  const server = http.createServer((req, res) => {
    const file = path.join(root, req.url.split("?")[0].replace(/^\/+/, ""));
    fs2.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "Content-Type": file.endsWith(".js") ? "text/javascript" : "text/html" });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const url = `http://127.0.0.1:${port}/tools/demo.html`;
  await page.goto(url);
  await page.waitForTimeout(500);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const card = await page.$("victron-remote-console-card");
  if (!card) throw new Error("card element not found (registration failed?)");

  await card.evaluate((el) => el._setView("overview"));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "overview-desktop.png"), fullPage: true });

  await card.evaluate((el) => el._setView("brief"));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "brief-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(url);
  await mobile.waitForTimeout(400);
  const mcard = await mobile.$("victron-remote-console-card");
  await mcard.evaluate((el) => el._setView("brief"));
  await mobile.waitForTimeout(300);
  await mobile.screenshot({ path: path.join(outDir, "brief-mobile.png"), fullPage: true });

  await browser.close();
  server.close();
  if (errors.length) {
    console.error("Page errors:", errors);
    process.exit(1);
  }
  console.log("Screenshots written to docs/reference/");
})();
