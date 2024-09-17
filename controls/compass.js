import L from "leaflet";

const ICON = `
        <svg xmlns="http://www.w3.org/2000/svg" 
        height="32px"
        width="32px"
        fill="currentColor"
        viewBox="0 0 24 24"><path d="M15 9L12 0L9 9L0 12L9 15L12 24L15 15L24 12L15 9M4 12L10 10L11 12H4M12 20L10 14L12 13V20M12 4L14 10L12 11V4M14 14L13 12H20L14 14M8.7 17.3L5 19L6.7 15.3L8.3 15.8L8.7 17.3M17.3 15.3L19 19L15.3 17.3L15.8 15.7L17.3 15.3M6.7 8.7L5 5L8.7 6.7L8.2 8.2L6.7 8.7M15.3 6.7L19 5L17.3 8.7L15.7 8.2L15.3 6.7Z" /></svg>
        `;

function button(direction) {
  return `<button id="compass-${direction}" aria-label="Go to ${direction}ern most image" data-direction="${direction}"></button>`;
}

function letter(letter) {
  return `<strong id="compass-letter-${letter.toLowerCase()}" class="compass__letter" aria-hidden="true">${letter}</strong>`;
}

L.Control.Compass = L.Control.extend({
  onAdd: function (map) {
    const div = L.DomUtil.create("div");
    div.id = "compass";
    div.classList.add("leaflet-bar");
    div.innerHTML = `
      <div id="compass-btns">
      ${button("north")}
      ${button("east")}
      ${button("west")}
      ${button("south")}
      </div>
      <div id="compass-icon">${ICON}</div>
      ${letter("N")}
      ${letter("E")}
      ${letter("W")}
      ${letter("S")}
`;

    div.addEventListener("click", (el) => {
      const selected = this.options.compass[el.target.dataset["direction"]];
      if (selected) {
        map.flyTo(selected.coordinates, 18);
        // FIXME: open popup
      }
    });
    return div;
  },

  onRemove: function (map) {
    // nothing to do
  },
});

L.control.compass = function (opts) {
  return new L.Control.Compass(opts);
};
