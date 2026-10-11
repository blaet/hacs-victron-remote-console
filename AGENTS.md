# AGENTS.md — orientation for coding agents working on this repo

A Home Assistant HACS Lovelace card that recreates the Victron Remote Console v2
Overview and Brief views, driven entirely by user-configured HA entities.

## Mental model

- `src/const.js` — element catalog (the 25 configurable slots), sections, palette, thresholds. Everything data-driven lives here.
- `src/helpers.js` — state resolution (`resolveNumber`/`resolveString` apply the `invert` list) + Victron-style formatting (W/kW switching, time-to-go).
- `src/victron-remote-console-card.js` — the card. `_renderBrief` and `_renderOverview` build innerHTML per state change; `setConfig`/`hass` setter gate the first render. Flow connectors are computed from `getBoundingClientRect` after innerHTML is set.
- `src/victron-remote-console-editor.js` — visual editor (`getConfigElement`), grouped entity pickers + invert toggles.
- `dist/victron-remote-console.js` — concatenated bundle (strips imports, single shared scope). **Regenerate after every src change**: `node tools/bundle.js`. CI fails if dist is stale.
- `tools/demo.html` — renders the card with mocked hass states (edit its STATES/CONFIG to test scenarios).
- `tools/verify.js` — self-bootstrapping screenshot harness (installs deps repo-locally on first run).
- `docs/reference/*.png` — current reference screenshots, embedded in README.

## Commands

- `npm run build` — bundle src → dist.
- `npm run verify` — render + screenshot both views (desktop + mobile).
- `npm run check` — build + verify. Run this before committing.
- `npm run clean` — remove all repo-local dev state.

## Local-run isolation policy (do not break)

Everything stays inside the repo: `.npmrc` pins the npm cache to `./.npm-cache`,
deps to `./node_modules`, Playwright browsers to `./.cache` (verify.js sets
`PLAYWRIGHT_BROWSERS_PATH`). Never install anything globally, never write to
`~/.npm` or `~/.cache`, never add dependencies beyond the pinned `playwright`
devDependency. `npm run clean` must fully undo a local setup.

## Design reference: gui-v2

The authoritative design source is Victron's open-source console
https://github.com/victronenergy/gui-v2 (license: "Victron Energy OS license v1" —
attribution + field-of-use conditions; **never copy its code into this repo**, we
only read it). Key locations when re-checking a design detail:

- Colors: `themes/color/ColorDesign.json`, `themes/color/Dark.json`
- Geometry (gauge angles, sizes): `themes/geometry/SevenInch.json`
- Gauge arc math: `components/Gauges.js`, `components/SideGauge.qml`
- Brief page composition: `pages/BriefPage_Landscape.qml`
- Overview widget placement rules: `pages/OverviewPage_Landscape.qml`
- SOC status thresholds: `src/theme.cpp` (`getValueStatus`: critical ≤10, warning ≤20)

Extracted values are recorded in `docs/design-tokens.md` so day-to-day work
does not require cloning gui-v2.

## Verification loop (use it; it catches real bugs)

1. Edit `src/`.
2. `node tools/bundle.js`.
3. Render demo + screenshot (`npm run verify` or the inline node snippets used
   in git history) and inspect DOM structure, not only pixel output: widget
   ids per column, flow path coordinates (they must have sane x/y spans — a
   6px path means the grid gap ate the connector), label percentages, formatted
   values. Two real bugs were found this way (missing `|| fallback` on
   `resolveString`, zero-length connectors).
4. Null-handling: unset entity → element hidden/omitted, never "null" text.
   `resolveString` returns null for unset; call sites must apply fallback.

## Known environment gotchas

- Repo-local headless Chromium needs system libs. In the dev sandbox they were
  extracted to `/tmp/chromium-libs` and used via
  `LD_LIBRARY_PATH=/tmp/chromium-libs/usr/lib/x86_64-linux-gnu`. On a normal
  laptop `sudo npx playwright install-deps chromium` once; the verify script
  prints this hint on failure.
- `node --check` fails on src files (ES modules + package.json without
  `"type":"module"`); use `node --input-type=module --check < file`.
- Screenshotting the demo requires serving over http (module import CORS on
  file://); verify.js embeds a loopback server — keep it.
- The bundle is plain concatenation with import-stripping; a new top-level
  `const` name in one file that collides with another will break at runtime.
  Keep shared names unique (VRC_ prefix, helper functions).

## Conventions

- Vanilla web components, no lit, no bundler, no dependencies shipped.
- HA theming via CSS vars (`--card-background-color` etc.) with Victron
  palette hardcoded only where the console look demands it (gauge colors).
- Commit style: short imperative subject. CI pins third-party actions to full
  commit SHAs — keep new actions pinned too.
