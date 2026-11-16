#!/usr/bin/env node
// Bundles src/*.js into a single ES module: dist/victron-remote-console.js
// Strategy: single shared scope. Files declare module-level names via `const`;
// to avoid redeclaration across files, top-level const names are prefixed per
// file only if colliding (they don't by convention: VRC_* in const.js, helpers
// use function declarations, card/editor files define classes once).
// ES module imports between files are stripped; all names are top-level here.

const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src");
const outFile = path.join(__dirname, "..", "dist", "victron-remote-console.js");

const files = [
  "const.js",
  "helpers.js",
  "victron-remote-console-card.js",
  "victron-remote-console-editor.js",
  "victron-remote-console.js",
];

let out = "// Bundled by tools/bundle.js — do not edit. See src/.\n";
for (const f of files) {
  let code = fs.readFileSync(path.join(srcDir, f), "utf8");
  code = code.replace(/^import\s+[^;]+;?\s*$/gm, "/* inlined import */");
  out += `\n// ==== src/${f} ====\n${code}\n`;
}
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log(`Wrote ${outFile} (${out.length} bytes)`);
