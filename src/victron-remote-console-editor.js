import { VRC_EDITOR_NAME, VRC_ELEMENTS, VRC_SECTIONS, VRC_VIEWS, VRC_DEFAULT_CONFIG } from "./const.js";

const EDITOR_STYLES = `
:host { display: block; }
.vrc-ed-root { padding: 8px 4px; font-family: var(--paper-font-body1_-_font-family, Roboto, Noto, sans-serif); }
.vrc-ed-section {
  border: 1px solid var(--divider-color, #444);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 10px;
}
.vrc-ed-section-title {
  font-weight: 500;
  margin-bottom: 6px;
  font-size: .95rem;
}
.vrc-ed-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
.vrc-ed-label { flex: 0 0 40%; font-size: .85rem; }
.vrc-ed-label small { color: var(--secondary-text-color, #9c9c9c); }
ha-entity-picker { flex: 1; }
.vrc-ed-toggle { flex: 1; display: flex; align-items: center; justify-content: flex-end; }
.vrc-ed-top { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
.vrc-ed-select { margin-right: 16px; }
.vrc-ed-hint { font-size: .8rem; color: var(--secondary-text-color, #9c9c9c); margin-bottom: 8px; }
`;

function entityPicker(value, label, onPick) {
  const picker = document.createElement("ha-entity-picker");
  picker.entity = { value: value || "" };
  picker.label = label;
  picker.allowCustomEntity = true;
  picker.addEventListener("value-changed", (ev) => onPick(ev.detail.value || ""));
  return picker;
}

function invertToggle(checked, onToggle) {
  const haSwitch = document.createElement("ha-switch");
  haSwitch.checked = !!checked;
  haSwitch.addEventListener("change", () => onToggle(haSwitch.checked));
  return haSwitch;
}

class VictronRemoteConsoleEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...VRC_DEFAULT_CONFIG, ...config };
    if (!this._config.elements) this._config.elements = {};
    if (!this._config.invert) this._config.invert = [];
    this._render();
  }

  hassChanged(hass, _oldHass) {
    if (this._hass === undefined || hass.locale?.language !== _oldHass?.locale?.language) {
      this._hass = hass;
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _changed() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      composed: true,
      bubbles: true,
    });
    this.dispatchEvent(event);
  }

  _setElement(key, value) {
    if (value) this._config.elements[key] = value;
    else delete this._config.elements[key];
    this._changed();
  }

  _setInvert(key, checked) {
    const set = new Set(this._config.invert || []);
    if (checked) set.add(key);
    else set.delete(key);
    this._config.invert = [...set];
    this._changed();
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const root = this.shadowRoot;
    root.innerHTML = `<style>${EDITOR_STYLES}</style><div class="vrc-ed-root"></div>`;
    const container = root.querySelector(".vrc-ed-root");

    const top = document.createElement("div");
    top.className = "vrc-ed-top";

    const viewLabel = document.createElement("span");
    viewLabel.textContent = "Default view:";
    top.appendChild(viewLabel);

    const viewSelect = document.createElement("ha-select");
    viewSelect.className = "vrc-ed-select";
    viewSelect.label = "View";
    VRC_VIEWS.forEach((v, i) => {
      const item = document.createElement("mwc-list-item");
      item.value = v;
      item.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      viewSelect.appendChild(item);
    });
    viewSelect.value = this._config.view;
    viewSelect.setAttribute("fixedMenuPosition", "");
    viewSelect.addEventListener("value-changed", () => {
      if (VRC_VIEWS.includes(viewSelect.value)) {
        this._config.view = viewSelect.value;
        this._changed();
      }
    });
    top.appendChild(viewSelect);

    const titleInput = document.createElement("ha-textfield");
    titleInput.label = "Title";
    titleInput.value = this._config.title || "";
    titleInput.addEventListener("input", () => {
      this._config.title = titleInput.value;
      this._changed();
    });
    top.appendChild(titleInput);
    container.appendChild(top);

    const hint = document.createElement("div");
    hint.className = "vrc-ed-hint";
    hint.textContent =
      "Pick a Home Assistant entity for each console element. Elements without an entity are hidden (Overview) or omitted (Brief). Use the invert toggle when a power value has the opposite sign convention (e.g. negative for charging).";
    container.appendChild(hint);

    for (const section of VRC_SECTIONS) {
      const els = VRC_ELEMENTS.filter((el) => el.section === section.id);
      if (!els.length) continue;
      const box = document.createElement("div");
      box.className = "vrc-ed-section";
      const title = document.createElement("div");
      title.className = "vrc-ed-section-title";
      title.textContent = section.label;
      box.appendChild(title);
      for (const el of els) {
        const row = document.createElement("div");
        row.className = "vrc-ed-row";
        const label = document.createElement("div");
        label.className = "vrc-ed-label";
        label.innerHTML = `${el.label}<br/><small>${el.unit ? `(${el.unit})` : ""} ${el.sign ? el.sign === "positive-charging" ? "· positive = charging" : "· positive = import" : ""}</small>`;
        row.appendChild(label);
        row.appendChild(
          entityPicker(this._config.elements[el.key], el.label, (value) => this._setElement(el.key, value))
        );
        if (el.sign) {
          const toggleWrap = document.createElement("div");
          toggleWrap.className = "vrc-ed-toggle";
          toggleWrap.appendChild(
            invertToggle((this._config.invert || []).includes(el.key), (checked) => this._setInvert(el.key, checked))
          );
          const tlabel = document.createElement("span");
          tlabel.textContent = " invert";
          tlabel.style.fontSize = ".8rem";
          toggleWrap.appendChild(tlabel);
          row.appendChild(toggleWrap);
        }
        box.appendChild(row);
      }
      container.appendChild(box);
    }
  }
}

if (!customElements.get(VRC_EDITOR_NAME)) {
  customElements.define(VRC_EDITOR_NAME, VictronRemoteConsoleEditor);
}

window.customCards = window.customCards || [];
