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
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 4px 48px;
  padding: 12px 4px 24px 4px;
  align-items: stretch;
  position: relative;
}
.vrc-ov-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.vrc-widget {
  border: 1px solid var(--vrc-line);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}
.vrc-widget-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .8rem;
  color: var(--vrc-fg2);
}
.vrc-widget-main { font-size: 1.15rem; }
.vrc-widget-sub { font-size: .8rem; color: var(--vrc-fg2); }
.vrc-widget.missing {
  opacity: .45;
  border-style: dashed;
}
.vrc-flow {
  stroke: var(--vrc-blue);
  fill: none;
  stroke-width: 2;
}
.vrc-flow.active {
  stroke-dasharray: 5 4;
  animation: vrc-dash 1s linear infinite;
}
@keyframes vrc-dash {
  to { stroke-dashoffset: -9; }
}
.vrc-power-badge {
  border-radius: 8px;
  padding: 1px 8px;
  font-size: .75rem;
}
@media (max-width: 640px) {
  .vrc-overview { grid-template-columns: 1fr; }
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
    const widgets = [];
    const addWidget = (id, title, main, sub, entity, flow) => {
      widgets.push({ id, title, main, sub, entity, flow, missing: !entity });
    };
    const acSource = str("ac_input_source", "Grid");
    if (e("ac_input_power") || e("ac_input_current"))
      addWidget(
        "ac-input",
        `AC input — ${acSource}`,
        formatPower(num("ac_input_power"), locale),
        [e("ac_input_current") ? formatCurrent(num("ac_input_current"), locale) : null,
         e("ac_input_voltage") ? formatVoltage(num("ac_input_voltage"), locale) : null]
          .filter(Boolean).join(" · "),
        e("ac_input_power"),
        num("ac_input_power") !== null && num("ac_input_power") > 0
      );
    if (e("solar_power") || e("solar_yield_today"))
      addWidget(
        "solar",
        "Solar",
        formatPower(num("solar_power"), locale),
        e("solar_yield_today") ? `Today: ${formatEnergy(num("solar_yield_today"), locale)}` : "",
        e("solar_power"),
        num("solar_power") !== null && num("solar_power") > 0
      );
    for (const [key, label] of [
      ["alternator_power", "Alternator"],
      ["wind_power", "Wind"],
      ["dc_generator_power", "DC generator"],
    ]) {
      if (e(key)) addWidget(key, label, formatPower(num(key), locale), "", e(key), num(key) > 0);
    }
    const invState = str("inverter_state", "");
    const evState = str("ev_state", "");
    addWidget(
      "inverter",
      "Inverter / Charger",
      formatPower(num("inverter_power"), locale),
      invState || "",
      e("inverter_power"),
      num("inverter_power") !== null && num("inverter_power") !== 0
    );
    const soc = num("battery_soc");
    addWidget(
      "battery",
      "Battery",
      formatPercent(soc, locale),
      [
        e("battery_voltage") ? formatVoltage(num("battery_voltage"), locale) : null,
        e("battery_current") ? formatCurrent(num("battery_current"), locale) : null,
        e("battery_time_to_go") && num("battery_time_to_go") !== null
          ? `Ttg ${formatTimeToGo(num("battery_time_to_go"))}` : null,
      ].filter(Boolean).join(" · "),
      e("battery_soc"),
      num("battery_power") !== null && num("battery_power") > 0
    );
    if (e("ac_loads_power") || e("ac_loads_critical_power"))
      addWidget(
        "ac-loads",
        "AC loads",
        formatPower(num("ac_loads_power"), locale),
        e("ac_loads_critical_power")
          ? `Critical: ${formatPower(num("ac_loads_critical_power"), locale)}` : "",
        e("ac_loads_power"),
        num("ac_loads_power") !== null && num("ac_loads_power") > 0
      );
    if (e("dc_loads_power"))
      addWidget("dc-loads", "DC loads", formatPower(num("dc_loads_power"), locale), "",
        e("dc_loads_power"), num("dc_loads_power") > 0);
    if (e("ev_power") || e("ev_state"))
      addWidget(
        "ev-charger",
        "EV charger",
        e("ev_power") ? formatPower(num("ev_power"), locale) : "",
        e("ev_state") ? evState : "",
        e("ev_power"),
        num("ev_power") > 0
      );
    const byId = Object.fromEntries(widgets.map((w) => [w.id, w]));
    const batteryId = byId.battery ? "battery" : null;
    const inverterId = byId.inverter ? "inverter" : null;
    const leftCol = ["ac-input", "solar", "alternator_power", "wind_power", "dc_generator_power"];
    const rightCol = ["ac-loads", "dc-loads", "ev-charger"];
    const flowLines = [];
    if (cfg.show_connectors) {
      const l2i = inverterId && byId["ac-input"]?.flow;
      const s2i = inverterId && byId.solar?.flow;
      const i2l = inverterId && byId["ac-loads"]?.flow;
      const i2b = inverterId && batteryId && byId.inverter?.flow && byId.battery?.flow;
      const s2b = batteryId && byId.solar?.flow;
      const b2l = batteryId && byId["ac-loads"]?.flow && !inverterId;
      if (l2i) flowLines.push(["ac-input", "inverter"]);
      if (s2i) flowLines.push(["solar", "inverter"]);
      if (i2l) flowLines.push(["inverter", "ac-loads"]);
      if (i2b) flowLines.push(["inverter", "battery"]);
      if (s2b) flowLines.push(["solar", "battery"]);
      if (b2l) flowLines.push(["battery", "ac-loads"]);
    }
    const widgetHtml = (w) => `
      <div class="vrc-widget ${w.missing ? "missing" : ""}" data-widget="${w.id}" ${w.entity ? `data-entity="${w.entity}"` : ""}>
        <div class="vrc-widget-title">${w.title}</div>
        <div class="vrc-widget-main">${w.main}</div>
        ${w.sub ? `<div class="vrc-widget-sub">${w.sub}</div>` : ""}
      </div>`;
    content.innerHTML = `
    <div class="vrc-overview">
      <div class="vrc-ov-col">${leftCol.filter((id) => byId[id]).map((id) => widgetHtml(byId[id])).join("")}</div>
      <div class="vrc-ov-col">
        ${inverterId ? widgetHtml(byId.inverter) : ""}
        ${batteryId ? widgetHtml(byId.battery) : ""}
      </div>
      <div class="vrc-ov-col">${rightCol.filter((id) => byId[id]).map((id) => widgetHtml(byId[id])).join("")}</div>
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
    return `<path class="vrc-flow active" d="M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}"/>`;
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
