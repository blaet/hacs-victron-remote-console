#!/usr/bin/env node
// Serves the repo on a loopback port and opens the demo harness in your
// browser. All dependencies stay inside the repo (see .npmrc / AGENTS.md).
// Usage: npm run demo [-- port]
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const port = Number(process.argv[2] || 8128);

const server = http.createServer((req, res) => {
  let file = path.join(root, req.url.split("?")[0].replace(/^\/+/, ""));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "tools/demo.html");
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(file);
    res.writeHead(200, {
      "Content-Type": ext === ".js" ? "text/javascript"
        : ext === ".html" ? "text/html" : "application/octet-stream",
    });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/tools/demo.html`;
  console.log(`Serving repo at  http://127.0.0.1:${port}/`);
  console.log(`Demo card at     ${url}`);
  console.log("(Ctrl-C to stop; only loopback, nothing leaves your machine)");
  // Try to open the browser; ignore failures (headless environments).
  const { exec } = require("child_process");
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} ${url}`, () => {});
});
