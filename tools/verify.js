#!/usr/bin/env node
// Visual verification: renders tools/demo.html with mocked hass states at
// desktop and mobile widths, screenshots each view into docs/reference/.
//
// Local-run isolation: everything (npm cache, node_modules, playwright package
// and downloaded browsers) lives inside this repository:
//   - devDependencies install to ./node_modules with the npm cache in
//     ./.npm-cache (see .npmrc)
//   - Playwright browsers download to ./.cache/ms-playwright
// No writes to the user's home directory, no global installs, no sudo.
//
// All gitignored; deleting node_modules/, .npm-cache/ and .cache/ fully
// cleans up ("npm run clean").
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.join(__dirname, "..");
const localCache = path.join(repoRoot, ".cache");

function ensurePlaywright() {
  let pw;
  try {
    pw = require(path.join(repoRoot, "node_modules", "playwright"));
  } catch {
    // Bootstrap once: install devDependencies repo-locally, then download the
    // headless browser shell into the repo-local cache.
    console.log("Bootstrapping repo-local dependencies (first run only)...");
    execFileSync("npm", ["install", "--no-fund", "--no-audit"], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    execFileSync(
      path.join(repoRoot, "node_modules", ".bin", "playwright"),
      ["install", "chromium", "--only-shell"],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: localCache },
      }
    );
    pw = require(path.join(repoRoot, "node_modules", "playwright"));
  }
  return pw;
}


function launchChromium(chromium) {
  // If the repo-local chromium download fails to start because of missing OS
  // libraries, print actionable guidance instead of a raw Playwright stack.
  return chromium.launch().catch((e) => {
    const msg = String(e && e.message ? e.message : e);
    if (/error while loading shared libraries/.test(msg)) {
      console.error(
        "Chromium was downloaded into .cache/ but is missing OS libraries.\n" +
        "Install them with:  sudo npx playwright install-deps chromium\n" +
        "Nothing was installed outside this repository."
      );
    }
    throw e;
  });
}

const outDir = path.join(repoRoot, "docs", "reference");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const { chromium } = ensurePlaywright();
  const browser = await launchChromium(chromium);

  // Serve over http to avoid file:// CORS restrictions on module scripts.
  const http = require("http");
  const server = http.createServer((req, res) => {
    const file = path.join(repoRoot, req.url.split("?")[0].replace(/^\/+/, ""));
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, {
        "Content-Type": file.endsWith(".js") ? "text/javascript" : "text/html",
      });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/tools/demo.html`);
  await page.waitForTimeout(500);
  const card = await page.$("victron-remote-console-card");
  if (!card) throw new Error("card element not found (registration failed?)");

  await card.evaluate((el) => el._setView("overview"));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "overview-desktop.png"), fullPage: true });

  await card.evaluate((el) => el._setView("brief"));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "brief-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`http://127.0.0.1:${port}/tools/demo.html`);
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
