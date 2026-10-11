# Design tokens extracted from Victron gui-v2

Source: https://github.com/victronenergy/gui-v2 (read-only reference; its code is
NOT copied into this project — values below are uncopyrightable facts used to
match the console's look).

## Colors (`themes/color/ColorDesign.json`, dark scheme)

| Token | Value | Used for |
|---|---|---|
| `color_blue` (ok) | `#387DC5` | SOC gauge when ok, AC-input/solar progress arcs, flow lines |
| `color_green` | `#72B84C` | focus highlight, charge direction accents |
| `color_orange` (warning) | `#F0962E` | SOC ≤20%, warnings |
| `color_red` (critical) | `#F35C58` | SOC ≤10%, critical |
| `color_gray1` | `#141414` | page background |
| `color_gray2` | `#272622` | card background / gauge track |
| `color_gray3` | `#504F4B` | disabled/neutral |
| `color_gray5` | `#969591` | secondary text |
| Dark variants (`color_darkOk` etc.) | `#11263B` / `#482D0E` / `#491C1B` | gauge track behind each status color |

Mirrored in `src/const.js` (`VRC_STATUS_COLORS`, `VRC_DARK_COLORS`).

## SOC status thresholds (`src/theme.cpp`, getValueStatus)

Falling percentage (battery SOC): critical ≤ 10, warning ≤ 20, else ok.
Mirrored in `VRC_SOC_THRESHOLDS`.

## Brief page geometry (`themes/geometry/SevenInch.json`, `components/Gauges.js`)

- Central (main) gauge: 400px (`geometry_mainGauge_size`), padding 30.
- Edge gauges: arc **radius 456** (`geometry_briefPage_edgeGauge_radius`), i.e.
  concentric large-radius arcs hugging the central gauge — NOT standalone
  semicircles. Side column height 420 (`largeEdgeGauge_height`), width 80.
- Side angle span: max 53° (`largeEdgeGauge_maxAngle`), 270° = straight up;
  left gauges start at 270 − 53/2 = 243.5° and run clockwise-up, right side is
  mirrored. Per-gauge segment = (53 − 4·(n−1)) / n with 4° spacing
  (`edgeGauge_spacingAngle`).
- Arc stroke width 8 (`geometry_arc_strokeWidth`).
- Gauge order: left = AC input (top) then DC input then solar; right = AC loads
  (top) then DC loads. AC input shown even when disconnected if source valid.
- Charging: animated "shine" sweep on the SOC arc
  (`centerGauge_shine_highlightPosition` 0.8).
- SOC center text: large light-weight %; battery name; time-to-go below.

Mirrored in `src/victron-remote-console-card.js` (`VRC_GAUGE`, `edgeArcPath`,
`briefSideSvg`, `briefSideLabels`).

## Overview page (`pages/OverviewPage_Landscape.qml`)

- Three columns: left inputs (AC input priority, other AC input, solar mid,
  DC sources bottom: alternator/fuel cell/DC charger/wind...), center
  inverter/charger (top) + battery (bottom), right loads (AC loads, EV charger,
  DC loads).
- Widgets auto-size XS–XL by count per column (see `_resetWidgetSizes`).
- Connectors: paths between widget edges with animated flow dots; direction
  follows actual power sign; absent devices have no widget.

## Formatting (`src/units.cpp`)

- Watts: < 10 000 → "W" (integer), ≥ 10 000 → "kW" with 1 decimal.
- Values with magnitude < 1 W are floored to 0 W.
