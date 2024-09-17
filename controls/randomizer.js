import L from "leaflet";

L.Control.Randomizer = L.Control.extend({
  onAdd: function (map) {
    const btn = L.DomUtil.create("button");
    btn.classList.add("leaflet-bar");
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M300-240q25 0 42.5-17.5T360-300q0-25-17.5-42.5T300-360q-25 0-42.5 17.5T240-300q0 25 17.5 42.5T300-240Zm0-360q25 0 42.5-17.5T360-660q0-25-17.5-42.5T300-720q-25 0-42.5 17.5T240-660q0 25 17.5 42.5T300-600Zm180 180q25 0 42.5-17.5T540-480q0-25-17.5-42.5T480-540q-25 0-42.5 17.5T420-480q0 25 17.5 42.5T480-420Zm180 180q25 0 42.5-17.5T720-300q0-25-17.5-42.5T660-360q-25 0-42.5 17.5T600-300q0 25 17.5 42.5T660-240Zm0-360q25 0 42.5-17.5T720-660q0-25-17.5-42.5T660-720q-25 0-42.5 17.5T600-660q0 25 17.5 42.5T660-600ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>`;

    let prev;
    btn.addEventListener("click", () => {
      const allImages = this.options.provideAllImages();
      if (allImages.length === 0) {
        return;
      }
      if (allImages.length === 1) {
        map.flyTo(allImages[0].coordinates, 16);
      }
      let next;
      const len = allImages.length;
      do {
        next = allImages[Math.floor(Math.random() * len)];
      } while (prev?.path === next.path);
      prev = next;
      map.flyTo(next.coordinates, 16);
    });
    return btn;
  },

  onRemove: function (map) {
    // Nothing to do here
  },
});

L.control.randomizer = function (opts) {
  return new L.Control.Randomizer(opts);
};
