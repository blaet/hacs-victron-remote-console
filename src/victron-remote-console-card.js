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
  --vrc-blue: #4aa3ff;
  --vrc-green: #4bd966;
  --vrc-orange: #f5a623;
  --vrc-red: #eb4d4d;
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
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 8px 24px 8px;
}
.vrc-brief-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 26%;
}
.vrc-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.vrc-gauge svg { width: 100%; max-width: 150px; height: auto; }
.vrc-gauge-label {
  font-size: .75rem;
  color: var(--vrc-fg2);
  text-transform: uppercase;
  letter-spacing: .05em;
}
.vrc-gauge-value { font-size: 1rem; }
.vrc-brief-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.vrc-soc-big {
  font-size: clamp(2rem, 8vw, 3.4rem);
  font-weight: 300;
  line-height: 1.1;
}
.vrc-brief-battery-name {
  color: var(--vrc-fg2);
  font-size: .8rem;
  margin-top: 4px;
}
.vrc-brief-sub { margin-top: 6px; font-size: .95rem; }
.vrc-ttg { color: var(--vrc-fg2); font-size: .85rem; margin-top: 2px; }
@media (max-width: 480px) {
  .vrc-brief { flex-direction: column; }
  .vrc-brief-col { width: 100%; flex-direction: row; justify-content: center; }
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

function gaugeSvg(value, max, color, label, valueText) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  return `
  <svg viewBox="0 0 110 66" role="img" aria-label="${label}: ${valueText}">
    <path d="M 11 55 A ${r} ${r} 0 0 1 99 55" fill="none" stroke="var(--vrc-line)" stroke-width="7" stroke-linecap="round"/>
    <path d="M 11 55 A ${r} ${r} 0 0 1 99 55" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${(c / 2) * frac} ${c}" class="vrc-arc"/>
    <text x="55" y="52" text-anchor="middle" fill="currentColor" font-size="15">${valueText}</text>
  </svg>`;
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
    const soc = resolveNumber(hass, cfg, "battery_soc");
    const power = resolveNumber(hass, cfg, "battery_power");
    const ttg = resolveNumber(hass, cfg, "battery_time_to_go");
    const name = resolveString(hass, cfg, "battery_name", "Battery");
    const solar = resolveNumber(hass, cfg, "solar_power");
    const acIn = resolveNumber(hass, cfg, "ac_input_power");
    const loads = resolveNumber(hass, cfg, "ac_loads_power");
    const dcLoads = resolveNumber(hass, cfg, "dc_loads_power");
    const status = socStatus(soc);
    const color = statusColor(status);
    const charging = power !== null && power > 0;
    const sub = power !== null
      ? `${charging ? "▲" : "▼"} ${formatPower(Math.abs(power), hass?.locale?.language)}`
      : "--";
    const left = [
      { label: "AC input", value: acIn, max: 10000, el: "ac_input_power" },
      { label: "Solar", value: solar, max: 10000, el: "solar_power" },
    ].filter((g) => cfg.elements[g.el]);
    const right = [
      { label: "AC loads", value: loads, max: 10000, el: "ac_loads_power" },
      { label: "DC loads", value: dcLoads, max: 10000, el: "dc_loads_power" },
    ].filter((g) => cfg.elements[g.el]);
    content.innerHTML = `
    <div class="vrc-brief">
      <div class="vrc-brief-col">
        ${left.map((g) => `
          <div class="vrc-gauge" data-entity="${cfg.elements[g.el] || ""}">
            ${gaugeSvg(g.value || 0, g.max, "var(--vrc-blue)", g.label, formatPower(g.value, hass?.locale?.language))}
            <div class="vrc-gauge-label">${g.label}</div>
          </div>`).join("")}
      </div>
      <div class="vrc-brief-center">
        ${gaugeSvg(soc || 0, 100, color, "Battery SOC", formatPercent(soc, hass?.locale?.language))}
        <div class="vrc-soc-big">${formatPercent(soc, hass?.locale?.language)}</div>
        <div class="vrc-brief-battery-name">${name || "Battery"}</div>
        <div class="vrc-brief-sub">${sub}</div>
        <div class="vrc-ttg">${ttg !== null ? `Time to go: ${formatTimeToGo(ttg)}` : ""}</div>
      </div>
      <div class="vrc-brief-col">
        ${right.map((g) => `
          <div class="vrc-gauge" data-entity="${cfg.elements[g.el] || ""}">
            ${gaugeSvg(g.value || 0, g.max, "var(--vrc-orange)", g.label, formatPower(g.value, hass?.locale?.language))}
            <div class="vrc-gauge-label">${g.label}</div>
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
