import "./victron-remote-console-card.js";
import "./victron-remote-console-editor.js";

import { VRC_CARD_NAME, VRC_EDITOR_NAME } from "./const.js";
// Hook the editor into the card for HA's visual editor (getConfigElement).
const cardCtor = customElements.get(VRC_CARD_NAME);
if (cardCtor && !cardCtor.prototype.getConfigElement) {
  cardCtor.prototype.getConfigElement = () => document.createElement(VRC_EDITOR_NAME);
}
if (cardCtor && !cardCtor.prototype.getStubConfig) {
  cardCtor.prototype.getStubConfig = () => VictronRemoteConsoleCard.getStubConfig();
}
