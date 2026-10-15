const VRC_DOMAIN = "victron-remote-console";
const VRC_CARD_NAME = "victron-remote-console-card";
const VRC_EDITOR_NAME = "victron-remote-console-editor";

const VRC_VIEWS = ["overview", "brief"];

const VRC_SECTIONS = [
  { id: "battery", label: "Battery" },
  { id: "ac-input", label: "AC input (grid / genset / shore)" },
  { id: "solar", label: "Solar" },
  { id: "inverter", label: "Inverter / Charger" },
  { id: "loads", label: "Loads" },
  { id: "ev-charger", label: "EV Charger" },
  { id: "dc-sources", label: "DC sources" },
  { id: "environment", label: "Environment" },
];

const VRC_ELEMENTS = [
  // key, section, label, unit hint, type
  { key: "battery_soc", section: "battery", label: "State of charge", unit: "%", type: "gauge" },
  { key: "battery_power", section: "battery", label: "Battery power", unit: "W", type: "power", sign: "positive-charging" },
  { key: "battery_voltage", section: "battery", label: "Battery voltage", unit: "V" },
  { key: "battery_current", section: "battery", label: "Battery current", unit: "A" },
  { key: "battery_time_to_go", section: "battery", label: "Time to go", unit: "min" },
  { key: "battery_capacity", section: "battery", label: "Battery capacity", unit: "Ah" },
  { key: "battery_name", section: "battery", label: "Battery name (sensor with name)", type: "string" },
  { key: "ac_input_power", section: "ac-input", label: "AC input power", unit: "W", type: "power", sign: "positive-import" },
  { key: "ac_input_current", section: "ac-input", label: "AC input current", unit: "A" },
  { key: "ac_input_voltage", section: "ac-input", label: "AC input voltage", unit: "V" },
  { key: "ac_input_l1", section: "ac-input", label: "AC input L1 power", unit: "W", type: "power" },
  { key: "ac_input_l2", section: "ac-input", label: "AC input L2 power", unit: "W", type: "power" },
  { key: "ac_input_l3", section: "ac-input", label: "AC input L3 power", unit: "W", type: "power" },
  { key: "ac_input_source", section: "ac-input", label: "AC input source (grid/genset/shore)", type: "string" },
  { key: "solar_power", section: "solar", label: "Solar power", unit: "W", type: "power" },
  { key: "solar_yield_today", section: "solar", label: "Yield today", unit: "kWh" },
  { key: "solar_l1", section: "solar", label: "Solar L1 power", unit: "W", type: "power" },
  { key: "solar_l2", section: "solar", label: "Solar L2 power", unit: "W", type: "power" },
  { key: "solar_l3", section: "solar", label: "Solar L3 power", unit: "W", type: "power" },
  { key: "solar_yield_total", section: "solar", label: "Yield total", unit: "kWh" },
  { key: "inverter_power", section: "inverter", label: "Inverter/Charger power", unit: "W", type: "power", sign: "positive-charging" },
  { key: "inverter_state", section: "inverter", label: "Inverter state (Inverting/Charging/...)", type: "string" },
  { key: "ac_loads_power", section: "loads", label: "AC loads power", unit: "W", type: "power" },
  { key: "ac_loads_l1", section: "loads", label: "AC loads L1 power", unit: "W", type: "power" },
  { key: "ac_loads_l2", section: "loads", label: "AC loads L2 power", unit: "W", type: "power" },
  { key: "ac_loads_l3", section: "loads", label: "AC loads L3 power", unit: "W", type: "power" },
  { key: "ac_loads_critical_power", section: "loads", label: "Essential loads power", unit: "W", type: "power" },
  { key: "ac_loads_critical_l1", section: "loads", label: "Essential loads L1 power", unit: "W", type: "power" },
  { key: "ac_loads_critical_l2", section: "loads", label: "Essential loads L2 power", unit: "W", type: "power" },
  { key: "ac_loads_critical_l3", section: "loads", label: "Essential loads L3 power", unit: "W", type: "power" },
  { key: "dc_loads_power", section: "loads", label: "DC loads power", unit: "W", type: "power" },
  { key: "ev_power", section: "ev-charger", label: "EV charger power", unit: "W", type: "power" },
  { key: "ev_state", section: "ev-charger", label: "EV charger state", type: "string" },
  { key: "alternator_power", section: "dc-sources", label: "Alternator power", unit: "W", type: "power" },
  { key: "wind_power", section: "dc-sources", label: "Wind charger power", unit: "W", type: "power" },
  { key: "dc_generator_power", section: "dc-sources", label: "DC generator power", unit: "W", type: "power" },
  { key: "temperature", section: "environment", label: "Temperature", unit: "°C" },
];

const VRC_ELEMENT_MAP = {};
for (const el of VRC_ELEMENTS) VRC_ELEMENT_MAP[el.key] = el;

const VRC_DEFAULT_CONFIG = {
  type: `custom:${VRC_CARD_NAME}`,
  view: "overview",
  title: "",
  elements: {},
  invert: [],
  show_connectors: true,
  animate: true,
};

// Palette from gui-v2 themes/color/ColorDesign.json (dark scheme)
const VRC_STATUS_COLORS = {
  ok: "#387DC5",
  warning: "#F0962E",
  critical: "#F35C58",
  neutral: "#504F4B",
};
// Dark-variant track/background colors (color_darkOk etc.)
const VRC_DARK_COLORS = {
  ok: "#11263B",
  warning: "#482D0E",
  critical: "#491C1B",
  neutral: "#272622",
};

const VRC_SOC_THRESHOLDS = { warning: 20, critical: 10 };
const VRC_THEME = {
  color_page_background: "#1c1c1c",
  color_card_background: "#2d2d2d",
  color_font_primary: "#ffffff",
  color_font_secondary: "#9c9c9c",
  color_blue: "#4aa3ff",
  color_green: "#4bd966",
  color_orange: "#f5a623",
  color_red: "#eb4d4d",
};
