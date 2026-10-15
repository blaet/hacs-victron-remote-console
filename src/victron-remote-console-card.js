import {
  VRC_CARD_NAME,
  VRC_DEFAULT_CONFIG,
  VRC_VIEWS,
} from "./const.js";
import {
  resolveNumber,
  resolveString,
  resolveElement,
  formatPower,
  formatEnergy,
  formatPercent,
  formatVoltage,
  formatCurrent,
  formatTimeToGo,
  socStatus,
  statusColor,
} from "./helpers.js";

const STYLES = `
:host {
  display: block;
}
.vrc-root {
  --vrc-bg: var(--card-background-color, #2d2d2d);
  --vrc-fg: var(--primary-text-color, #ffffff);
  --vrc-fg2: var(--secondary-text-color, #9c9c9c);
  --vrc-line: var(--divider-color, #444);
  --vrc-blue: #387DC5;
  --vrc-green: #72B84C;
  --vrc-orange: #F0962E;
  --vrc-red: #F35C58;
  color: var(--vrc-fg);
  font-family: var(--paper-font-body1_-_font-family, Roboto, Noto, sans-serif);
  background: var(--background-color, transparent);
}
.vrc-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 16px 0 16px;
}
.vrc-title {
  font-size: 1.1rem;
  font-weight: 500;
}
.vrc-viewtabs {
  display: flex;
  gap: 4px;
}
.vrc-tab {
  border: 1px solid var(--vrc-line);
  background: transparent;
  color: var(--vrc-fg2);
  border-radius: 10px;
  padding: 2px 10px;
  font-size: .8rem;
  cursor: pointer;
  text-transform: capitalize;
}
.vrc-tab[aria-selected="true"] {
  color: var(--vrc-fg);
  border-color: var(--vrc-fg);
}
.vrc-unconfigured {
  padding: 24px 16px;
  color: var(--vrc-fg2);
  text-align: center;
  font-size: .9rem;
}
`;

const BRIEF_STYLES = `
.vrc-brief {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 8px 28px 8px;
  min-height: 300px;
}

.vrc-brief-side {
  position: relative;
  flex: 1;
  height: 230px;
  align-self: center;
}
.vrc-brief-side svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.vrc-brief-center {
  flex: 1.4;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.vrc-brief-gauge-label {
  position: absolute;
  font-size: 1.05rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.vrc-brief-gauge-label.left { left: 0; }
.vrc-brief-gauge-label.right { right: 0; align-items: flex-end; }
.vrc-brief-gauge-label .qty { font-weight: 500; }
.vrc-brief-gauge-label .unit { color: var(--vrc-fg2); font-size: .8rem; }
.vrc-soc-big {
  font-size: clamp(2.4rem, 9vw, 4rem);
  font-weight: 300;
  line-height: 1.05;
}
.vrc-brief-battery-name {
  color: var(--vrc-fg2);
  font-size: .95rem;
  margin-top: 4px;
}
.vrc-brief-sub { margin-top: 10px; font-size: 1.05rem; }
.vrc-ttg { color: var(--vrc-fg2); font-size: .9rem; margin-top: 4px; }
.vrc-shine {
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 10 220;
  animation: vrc-shine 2.2s linear infinite;
}
@keyframes vrc-shine {
  0% { stroke-dashoffset: 230; }
  100% { stroke-dashoffset: -10; }
}
@media (max-width: 480px) {
  .vrc-brief { flex-direction: column; padding-bottom: 16px; }
  .vrc-brief-side { width: 100%; flex: none; height: 220px; }
  .vrc-brief-center { width: 100%; }
}
`;


const OVERVIEW_STYLES = `
.vrc-overview {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 2px 56px;
  padding: 12px 4px 24px 4px;
  align-items: stretch;
  position: relative;
  background: transparent;
}
.vrc-ov-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vrc-widget {
  border: 1px solid var(--vrc-widget-border, #22374e);
  border-radius: 8px;
  background: var(--vrc-widget-bg, #0d1b29);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}
.vrc-widget-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .78rem;
  color: var(--vrc-fg2);
  white-space: nowrap;
}
.vrc-widget-main { font-size: 1.25rem; font-weight: 500; }
.vrc-widget-main .neg { color: var(--vrc-green); }
.vrc-phases {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: .72rem;
  color: var(--vrc-fg2);
  margin-top: 2px;
}
.vrc-phases span b { color: var(--vrc-fg); font-weight: 400; }
.vrc-widget-sub { font-size: .78rem; color: var(--vrc-fg2); }
.vrc-widget.missing {
  opacity: .45;
  border-style: dashed;
}
/* Central column: inverter tile ~2x height of side tiles, battery below */
.vrc-widget.inverter {
  min-height: 96px;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.vrc-widget.inverter .vrc-widget-main { font-size: 1rem; font-weight: 400; }
.vrc-widget.battery .vrc-widget-main { font-size: 1.9rem; font-weight: 300; }
.vrc-widget.battery { align-items: center; text-align: center; }
.vrc-widget.battery .vrc-widget-sub { color: var(--vrc-fg2); }
/* Connector lines: thin blue curves with animated dots (3 per line) */
.vrc-flow {
  stroke: var(--vrc-blue);
  fill: none;
  stroke-width: 1.5;
}
.vrc-flow-dot {
  fill: var(--vrc-blue);
}
.vrc-flow-dot.active {
  animation: vrc-dot 1.6s linear infinite;
}
@keyframes vrc-dot {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -12; }
}
@media (max-width: 640px) {
  .vrc-overview { grid-template-columns: 1fr; gap: 8px; }
}
`;


// Arc geometry per gui-v2 components/Gauges.js + themes/geometry/SevenInch.json:
// central gauge 400px, edge-gauge arc radius 456, max side angle 53deg,
// gauge spacing angle 4deg, arc stroke 8px.
const VRC_GAUGE = {
  mainSize: 400,
  edgeRadius: 456,
  maxSideAngle: 53,
  spacingAngle: 4,
  strokeWidth: 8,
};

function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// One edge-gauge arc segment, drawn with a single SVG path.
// cx/cy: center of the large circle; radius: 456-scale radius.
// start/end angles in degrees, 270 = pointing up in this coordinate system
// (we rotate so 270deg = top). Direction handled via sweep flag.
function edgeArcPath(cx, cy, radius, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, radius, startDeg);
  const [x2, y2] = polar(cx, cy, radius, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// Returns SVG markup for one side of the brief view (left or right).
// gauges: [{label, valueText, unit, value, max, status}]
// side: "left" | "right"
function briefSideSvg(gauges, side) {
  if (!gauges.length) return "";
  const count = gauges.length;
  const totalSpacing = VRC_GAUGE.spacingAngle * (count - 1);
  const segment = count === 1 ? VRC_GAUGE.maxSideAngle
    : (VRC_GAUGE.maxSideAngle - totalSpacing) / count;
  // Base angles: left gauges span the top-left arc starting at 243.5deg
  // (270 - 53/2) going clockwise-up; right gauges mirror that.
  const base = 270 - VRC_GAUGE.maxSideAngle / 2;
  const ns = "http://www.w3.org/2000/svg";
  const svgParts = [];
  const cx = 50;
  const radius = VRC_GAUGE.edgeRadius / 5.6;
  const cy = radius + 4; // circle center below the visible arc: top of arc at y=4
  for (let i = 0; i < count; i++) {
    const start = base + i * (segment + VRC_GAUGE.spacingAngle);
    const end = start + segment;
    const g = gauges[i];
    const frac = g.max ? Math.max(0, Math.min(1, Math.abs(g.value) / g.max)) : 0;
    const progressEnd = start + (end - start) * frac;
    const dark = g.status === "neutral" ? "#272622"
      : g.status === "ok" ? "#11263B"
      : g.status === "warning" ? "#482D0E" : "#491C1B";
    const bright = g.status === "neutral" ? "#504F4B"
      : g.status === "ok" ? "#387DC5"
      : g.status === "warning" ? "#F0962E" : "#F35C58";
    const track = edgeArcPath(cx, cy, radius, start, end);
    let progress = "";
    if (frac > 0) {
      progress = edgeArcPath(cx, cy, radius, start, progressEnd);
    }
    svgParts.push(`<path d="${track}" fill="none" stroke="${dark}" stroke-width="6" stroke-linecap="round"/>`);
    if (progress) svgParts.push(`<path d="${progress}" fill="none" stroke="${bright}" stroke-width="6" stroke-linecap="round"/>`);
  }
  return svgParts.join("\n");
}

// Compute the label position for edge gauge i on a side.
function briefSideLabels(gauges, side) {
  const count = gauges.length;
  const totalSpacing = VRC_GAUGE.spacingAngle * (count - 1);
  const segment = count === 1 ? VRC_GAUGE.maxSideAngle
    : (VRC_GAUGE.maxSideAngle - totalSpacing) / count;
  const base = 270 - VRC_GAUGE.maxSideAngle / 2;
  return gauges.map((g, i) => {
    const start = base + i * (segment + VRC_GAUGE.spacingAngle);
    const mid = start + segment / 2;
    // Map angle (deg, 270=top) to vertical position within the side box.
    // angle 243.5 -> top of box, 296.5 -> bottom.
    const t = (mid - base) / VRC_GAUGE.maxSideAngle; // 0..1
    const topPct = 8 + t * (count === 1 ? 42 : 78);
    return { ...g, topPct };
  });
}

class VictronRemoteConsoleCard extends HTMLElement {
  static getStubConfig() {
    return { view: "brief", elements: {} };
  }

  setConfig(config) {
    if (!config || !config.type) throw new Error("Invalid config");
    this._config = { ...VRC_DEFAULT_CONFIG, ...config };
    if (!VRC_VIEWS.includes(this._config.view)) this._config.view = "overview";
    if (!this._config.elements) this._config.elements = {};
    if (!this._config.invert) this._config.invert = [];
    this._hass = this._hass || null;
    this._needsRender = true;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._needsRender) {
      this._needsRender = false;
      this._build();
    }
    this._update();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 12, rows: "auto" };
  }

  connectedCallback() {
    this._needsRender = true;
    if (this._hass) {
      this._needsRender = false;
      this._build();
      this._update();
    }
  }

  _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const root = this.shadowRoot;
    root.innerHTML = `
    <style>${STYLES}${BRIEF_STYLES}${OVERVIEW_STYLES}</style>
    <div class="vrc-root">
      <div class="vrc-header">
        <div class="vrc-title"></div>
        <div class="vrc-viewtabs">
          <button class="vrc-tab" data-view="overview" type="button">Overview</button>
          <button class="vrc-tab" data-view="brief" type="button">Brief</button>
        </div>
      </div>
      <div class="vrc-content"></div>
    </div>`;
    root.querySelector('[data-view="overview"]').addEventListener("click", () => this._setView("overview"));
    root.querySelector('[data-view="brief"]').addEventListener("click", () => this._setView("brief"));
    root.querySelector(".vrc-content").addEventListener("click", (ev) => {
      const widget = ev.target.closest("[data-entity]");
      if (widget && this._hass && widget.dataset.entity) {
        const ev2 = new CustomEvent("hass-more-info", {
          composed: true,
          bubbles: true,
          detail: { entityId: widget.dataset.entity },
        });
        this.dispatchEvent(ev2);
      }
    });
    this._update();
  }

  _setView(view) {
    this._config = { ...this._config, view };
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const root = this.shadowRoot;
    const hass = this._hass;
    const cfg = this._config;
    root.querySelectorAll(".vrc-tab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.view === cfg.view))
    );
    const titleEl = root.querySelector(".vrc-title");
    titleEl.textContent = cfg.title || "Remote Console";
    const content = root.querySelector(".vrc-content");
    const hasAny = Object.values(cfg.elements || {}).some((v) => !!v);
    if (!hasAny) {
      content.innerHTML = `<div class="vrc-unconfigured">
        No entities configured yet. Open the card options (Configure) to pick entities,
        or set <code>elements:</code> in YAML.</div>`;
      return;
    }
    if (cfg.view === "brief") this._renderBrief(content, hass, cfg);
    else this._renderOverview(content, hass, cfg);
  }

  _renderBrief(content, hass, cfg) {
    const locale = hass?.locale?.language;
    const soc = resolveNumber(hass, cfg, "battery_soc");
    const power = resolveNumber(hass, cfg, "battery_power");
    const ttg = resolveNumber(hass, cfg, "battery_time_to_go");
    const name = resolveString(hass, cfg, "battery_name", "Battery") || "Battery";
    const status = socStatus(soc);
    const color = statusColor(status);
    const charging = power !== null && power > 0;
    const sub = power !== null
      ? `${charging ? "▲" : "▼"} ${formatPower(Math.abs(power), locale)}`
      : "--";
    const left = [];
    if (cfg.elements.ac_input_power) {
      left.push({
        label: "AC input", value: resolveNumber(hass, cfg, "ac_input_power"),
        max: 10000, status: "ok", el: "ac_input_power",
        unit: "W",
      });
    }
    if (cfg.elements.solar_power) {
      left.push({
        label: "Solar", value: resolveNumber(hass, cfg, "solar_power"),
        max: 10000, status: "ok", el: "solar_power", unit: "W",
      });
    }
    const right = [];
    if (cfg.elements.ac_loads_power) {
      right.push({
        label: "AC loads", value: resolveNumber(hass, cfg, "ac_loads_power"),
        max: 10000, status: "ok", el: "ac_loads_power", unit: "W",
      });
    }
    if (cfg.elements.dc_loads_power) {
      right.push({
        label: "DC loads", value: resolveNumber(hass, cfg, "dc_loads_power"),
        max: 10000, status: "ok", el: "dc_loads_power", unit: "W",
      });
    }
    const leftGauges = left.map((g) => ({
      ...g, valueText: formatPower(g.value, locale),
    }));
    const rightGauges = right.map((g) => ({
      ...g, valueText: formatPower(g.value, locale),
    }));
    const leftLabels = briefSideLabels(leftGauges, "left");
    const rightLabels = briefSideLabels(rightGauges, "right");
    // Central gauge: 270deg arc from 135 to 405 (clockwise), track + progress.
    const socFrac = soc === null ? 0 : Math.max(0, Math.min(100, soc)) / 100;
    const cx = 100, cy = 100, r = 84;
    const [ax1, ay1] = polar(cx, cy, r, 135);
    const [ax2, ay2] = polar(cx, cy, r, 405);
    const [px2, py2] = polar(cx, cy, r, 135 + 270 * socFrac);
    const shine = charging && cfg.animate !== false;
    content.innerHTML = `
    <div class="vrc-brief">
      <div class="vrc-brief-side">
        ${leftGauges.length ? `<svg viewBox="0 0 100 112" preserveAspectRatio="xMidYMax meet">
          ${briefSideSvg(leftGauges, "left")}
        </svg>` : ""}
        ${leftLabels.map((g) => `
          <div class="vrc-brief-gauge-label left" style="top:${g.topPct}%">
            <span class="qty">${g.valueText}</span>
            <span class="unit">${g.label}</span>
          </div>`).join("")}
      </div>
      <div class="vrc-brief-center">
        <svg viewBox="0 0 200 200" style="width:min(46vw,220px);height:auto;">
          <path d="${edgeArcPath(cx, cy, r, 135, 405)}" fill="none" stroke="#272622" stroke-width="10" stroke-linecap="round"/>
          ${socFrac > 0 ? `<path d="${edgeArcPath(cx, cy, r, 135, 135 + 270 * socFrac)}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>` : ""}
          ${shine ? `<path class="vrc-shine" d="${edgeArcPath(cx, cy, r, 135, 135 + 270 * socFrac)}"/>` : ""}
        </svg>
        <div class="vrc-soc-big" style="margin-top:-${socFrac > 0.5 ? 58 : 52}%">${formatPercent(soc, locale)}</div>
        <div class="vrc-brief-battery-name">${name}</div>
        <div class="vrc-brief-sub">${sub}</div>
        <div class="vrc-ttg">${ttg !== null ? `Time to go: ${formatTimeToGo(ttg)}` : ""}</div>
      </div>
      <div class="vrc-brief-side">
        ${rightGauges.length ? `<svg viewBox="0 0 100 112" preserveAspectRatio="xMidYMax meet">
          <g transform="translate(100,0) scale(-1,1)">${briefSideSvg(rightGauges, "right")}</g>
        </svg>` : ""}
        ${rightLabels.map((g) => `
          <div class="vrc-brief-gauge-label right" style="top:${g.topPct}%">
            <span class="qty">${g.valueText}</span>
            <span class="unit">${g.label}</span>
          </div>`).join("")}
      </div>
    </div>`;
  }

  _renderOverview(content, hass, cfg) {
    const locale = hass?.locale?.language;
    const e = (k) => cfg.elements[k];
    const num = (k) => resolveNumber(hass, cfg, k);
    const str = (k, f) => resolveString(hass, cfg, k, f) || f;

    // Helper: phase rows (L1/L2/L3) shown under a main value.
    const phaseRows = (l1, l2, l3) => {
      if (!e(l1) && !e(l2) && !e(l3)) return "";
      const rows = [
        e(l1) ? `<span>L1 <b>${formatPower(num(l1), locale)}</b></span>` : "",
        e(l2) ? `<span>L2 <b>${formatPower(num(l2), locale)}</b></span>` : "",
        e(l3) ? `<span>L3 <b>${formatPower(num(l3), locale)}</b></span>` : "",
      ].filter(Boolean);
      return rows.length ? `<div class="vrc-phases">${rows.join("")}</div>` : "";
    };
    // Negative values render green (feed-in), like the real console.
    const mainValue = (k) => {
      const v = num(k);
      if (v === null) return "--";
      const cls = v < 0 ? "neg" : "";
      return `<span class="${cls}">${formatPower(v, locale)}</span>`;
    };

    const widgets = [];
    const addWidget = (w) => { widgets.push(w); };

    // Left column: Grid (AC input), Solar
    const acSource = str("ac_input_source", "Grid");
    if (e("ac_input_power") || e("ac_input_current") || e("ac_input_l1"))
      addWidget({
        id: "ac-input", title: acSource, col: "left",
        main: e("ac_input_power") ? mainValue("ac_input_power") : "--",
        extra: phaseRows("ac_input_l1", "ac_input_l2", "ac_input_l3"),
        sub: "", entity: e("ac_input_power"),
        flow: num("ac_input_power") !== null && num("ac_input_power") !== 0,
      });
    if (e("solar_power") || e("solar_l1"))
      addWidget({
        id: "solar", title: "Solar", col: "left",
        main: e("solar_power") ? mainValue("solar_power") : "--",
        extra: phaseRows("solar_l1", "solar_l2", "solar_l3"),
        sub: e("solar_yield_today") ? `Today: ${formatEnergy(num("solar_yield_today"), locale)}` : "",
        entity: e("solar_power"),
        flow: num("solar_power") !== null && num("solar_power") > 0,
      });
    for (const [key, label] of [
      ["alternator_power", "Alternator"],
      ["wind_power", "Wind"],
      ["dc_generator_power", "DC generator"],
    ]) {
      if (e(key)) addWidget({
        id: key, title: label, col: "left",
        main: mainValue(key), extra: "", sub: "", entity: e(key),
        flow: num(key) > 0,
      });
    }

    // Center column: Inverter/Charger (state only, like the real console) + Battery
    const invState = str("inverter_state", "");
    addWidget({
      id: "inverter", title: "Inverter / Charger", col: "center",
      main: invState || (e("inverter_power") ? formatPower(num("inverter_power"), locale) : "--"),
      extra: "", sub: "", entity: e("inverter_power") || e("inverter_state"),
      stateWidget: true,
      flow: e("inverter_power") && num("inverter_power") !== null && num("inverter_power") !== 0,
    });
    const soc = num("battery_soc");
    const bPower = num("battery_power");
    const battState = bPower === null ? "" : (bPower > 0 ? "Charging" : "Discharging");
    const ttg = num("battery_time_to_go");
    const vaRow = [
      e("battery_voltage") ? formatVoltage(num("battery_voltage"), locale) : null,
      e("battery_current") ? formatCurrent(num("battery_current"), locale) : null,
      e("battery_power") ? formatPower(bPower, locale) : null,
    ].filter(Boolean).join("  ");
    addWidget({
      id: "battery", title: "Battery", col: "center",
      main: soc === null ? "--" : formatPercent(soc, locale),
      extra: "",
      sub: [
        battState,
        ttg !== null ? formatTimeToGo(ttg) : "",
      ].filter(Boolean).join("  "),
      sub2: vaRow,
      entity: e("battery_soc"),
      batteryWidget: true,
      flow: bPower !== null && bPower !== 0,
    });

    // Right column: AC loads, Essential loads, DC loads, EV charger
    if (e("ac_loads_power") || e("ac_loads_l1"))
      addWidget({
        id: "ac-loads", title: "AC Loads", col: "right",
        main: e("ac_loads_power") ? mainValue("ac_loads_power") : "--",
        extra: phaseRows("ac_loads_l1", "ac_loads_l2", "ac_loads_l3"),
        sub: "", entity: e("ac_loads_power"),
        flow: num("ac_loads_power") > 0,
      });
    if (e("ac_loads_critical_power") || e("ac_loads_critical_l1"))
      addWidget({
        id: "essential-loads", title: "Essential Loads", col: "right",
        main: e("ac_loads_critical_power") ? mainValue("ac_loads_critical_power") : "--",
        extra: phaseRows("ac_loads_critical_l1", "ac_loads_critical_l2", "ac_loads_critical_l3"),
        sub: "", entity: e("ac_loads_critical_power"),
        flow: num("ac_loads_critical_power") > 0,
      });
    if (e("dc_loads_power"))
      addWidget({
        id: "dc-loads", title: "DC Loads", col: "right",
        main: mainValue("dc_loads_power"), extra: "", sub: "",
        entity: e("dc_loads_power"), flow: num("dc_loads_power") > 0,
      });
    if (e("ev_power") || e("ev_state"))
      addWidget({
        id: "ev-charger", title: "EV Charger", col: "right",
        main: e("ev_power") ? mainValue("ev_power") : "",
        extra: "", sub: str("ev_state", "") || "", entity: e("ev_power"),
        flow: num("ev_power") > 0,
      });

    const byId = Object.fromEntries(widgets.map((w) => [w.id, w]));
    // Connector paths as in the real console: Grid→Inv, Solar→Inv,
    // Inv→AC loads, Inv→Essential loads, Inv→Battery.
    const flowLines = [];
    if (cfg.show_connectors !== false) {
      if (byId["ac-input"]?.flow && byId.inverter) flowLines.push(["ac-input", "inverter"]);
      if (byId.solar?.flow && byId.inverter) flowLines.push(["solar", "inverter"]);
      if (byId.inverter?.flow && byId["ac-loads"]) flowLines.push(["inverter", "ac-loads"]);
      if (byId.inverter?.flow && byId["essential-loads"]) flowLines.push(["inverter", "essential-loads"]);
      if (byId.inverter && byId.battery && (byId.inverter.flow || byId.battery.flow)) flowLines.push(["inverter", "battery"]);
    }

    const widgetHtml = (w) => `
      <div class="vrc-widget ${w.stateWidget ? "inverter" : ""} ${w.batteryWidget ? "battery" : ""} ${!w.entity ? "missing" : ""}"
           data-widget="${w.id}" ${w.entity ? `data-entity="${w.entity}"` : ""}>
        <div class="vrc-widget-title">${w.title}</div>
        <div class="vrc-widget-main">${w.main}</div>
        ${w.extra || ""}
        ${w.sub ? `<div class="vrc-widget-sub">${w.sub}</div>` : ""}
        ${w.sub2 ? `<div class="vrc-widget-sub">${w.sub2}</div>` : ""}
      </div>`;

    const leftIds = widgets.filter((w) => w.col === "left").map((w) => w.id);
    const centerIds = widgets.filter((w) => w.col === "center").map((w) => w.id);
    const rightIds = widgets.filter((w) => w.col === "right").map((w) => w.id);

    content.innerHTML = `
    <div class="vrc-overview">
      <div class="vrc-ov-col">${leftIds.map((id) => widgetHtml(byId[id])).join("")}</div>
      <div class="vrc-ov-col">${centerIds.map((id) => widgetHtml(byId[id])).join("")}</div>
      <div class="vrc-ov-col">${rightIds.map((id) => widgetHtml(byId[id])).join("")}</div>
      ${flowLines.length ? `<svg class="vrc-ov-flows" style="position:absolute;inset:0;pointer-events:none;overflow:visible;">
        ${flowLines.map(([a, b]) => this._flowPath(a, b, content)).filter(Boolean).join("")}
      </svg>` : ""}
    </div>`;
  }

  _flowPath(a, b, content) {
    const elA = content.querySelector(`[data-widget="${a}"]`);
    const elB = content.querySelector(`[data-widget="${b}"]`);
    if (!elA || !elB) return "";
    const grid = content.querySelector(".vrc-overview");
    const ra = elA.getBoundingClientRect();
    const rb = elB.getBoundingClientRect();
    const rg = grid.getBoundingClientRect();
    const x1 = ra.right - rg.left;
    const y1 = ra.top + ra.height / 2 - rg.top;
    const x2 = rb.left - rg.left;
    const y2 = rb.top + rb.height / 2 - rg.top;
    const mid = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
    // Three dots moving along the line (as on the real console).
    const dots = [0, 1, 2].map((i) => {
      const t = i / 3;
      // approximate point on the cubic bezier
      const bx = (1-t)*(1-t)*(1-t)*x1 + 3*(1-t)*(1-t)*t*mid + 3*(1-t)*t*t*mid + t*t*t*x2;
      const by = (1-t)*(1-t)*(1-t)*y1 + 3*(1-t)*(1-t)*t*y1 + 3*(1-t)*t*t*y2 + t*t*t*y2;
      return `<circle class="vrc-flow-dot active" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="2.5"/>`;
    }).join("");
    return `<path class="vrc-flow" d="${d}"/>${dots}`;
  }
}

if (!customElements.get(VRC_CARD_NAME)) {
  customElements.define(VRC_CARD_NAME, VictronRemoteConsoleCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: VRC_CARD_NAME,
  name: "Victron Remote Console",
  description: "Overview and Brief views mimicking the Victron v2 remote console.",
});
