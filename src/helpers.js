import { VRC_ELEMENT_MAP, VRC_STATUS_COLORS, VRC_SOC_THRESHOLDS } from "./const.js";

export function getNumber(stateObj) {
  if (!stateObj) return null;
  if (["unavailable", "unknown", "none", ""].includes(stateObj.state)) return null;
  const n = Number(stateObj.state);
  return Number.isFinite(n) ? n : null;
}

export function getString(stateObj, fallback = "--") {
  if (!stateObj) return fallback;
  if (["unavailable", "unknown", "none", ""].includes(stateObj.state)) return fallback;
  return stateObj.state;
}

export function formatPower(watts, locale) {
  if (watts === null || watts === undefined || Number.isNaN(watts)) return "--";
  const abs = Math.abs(watts);
  const sign = watts < 0 ? "-" : "";
  const localeTag = locale || undefined;
  if (abs >= 10000) return `${sign}${(abs / 1000).toLocaleString(localeTag, { maximumFractionDigits: 1 })} kW`;
  return `${sign}${Math.round(abs).toLocaleString(localeTag)} W`;
}

export function formatEnergy(kwh, locale) {
  if (kwh === null || kwh === undefined || Number.isNaN(kwh)) return "--";
  return `${kwh.toLocaleString(locale || undefined, { maximumFractionDigits: 2 })} kWh`;
}

export function formatPercent(value, locale) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value).toLocaleString(locale || undefined)}%`;
}

export function formatVoltage(v, locale) {
  if (v === null || v === undefined || Number.isNaN(v)) return "--";
  return `${v.toLocaleString(locale || undefined, { maximumFractionDigits: 1 })} V`;
}

export function formatCurrent(a, locale) {
  if (a === null || a === undefined || Number.isNaN(a)) return "--";
  return `${a.toLocaleString(locale || undefined, { maximumFractionDigits: 1 })} A`;
}

export function formatTimeToGo(minutes, locale) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return "--";
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm}m`;
  return `${h}h ${String(mm).padStart(2, "0")}m`;
}

export function socStatus(soc) {
  if (soc === null) return "neutral";
  if (soc <= VRC_SOC_THRESHOLDS.critical) return "critical";
  if (soc <= VRC_SOC_THRESHOLDS.warning) return "warning";
  return "ok";
}

export function statusColor(status) {
  return VRC_STATUS_COLORS[status] || VRC_STATUS_COLORS.neutral;
}

export function resolveElement(hass, config, key) {
  const el = VRC_ELEMENT_MAP[key];
  if (!el) return null;
  const entityId = config?.elements?.[key];
  if (!entityId) return null;
  const stateObj = hass?.states?.[entityId] || null;
  const invert = (config?.invert || []).includes(key);
  return { el, entityId, stateObj, invert };
}

export function resolveNumber(hass, config, key) {
  const r = resolveElement(hass, config, key);
  if (!r || !r.stateObj) return null;
  let n = getNumber(r.stateObj);
  if (n === null) return null;
  if (r.invert) n = -n;
  return n;
}

export function resolveString(hass, config, key, fallback) {
  const r = resolveElement(hass, config, key);
  if (!r || !r.stateObj) return null;
  return getString(r.stateObj, fallback);
}
