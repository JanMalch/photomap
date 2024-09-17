const OPEN_IN_NEW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" height="16px" width="16px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;

const dateFormatter = new Intl.DateTimeFormat(navigator.language, {
  weekday: "short",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export class PopupContent extends HTMLElement {
  /** @type {string | undefined} */
  #url;
  /** @type {Image} */
  #image;
  #isDisconnected = false;
  /** @type {HTMLElement} */
  #lightbox;

  /**
   * @param {Image} image
   * @param {HTMLElement} lightbox
   */
  constructor(image, lightbox) {
    super();
    this.#image = image;
    this.#lightbox = lightbox;
  }

  #onClick() {
    // TODO: use viewTransition API
    //   https://glitch.com/edit/#!/simple-set-demos?path=7-expanding-image-ratio%2Fscript.js%3A1%3A0
    this.#image.handle
      .getFile()
      .then((file) => {
        // URL is revoked in main file via event listener
        const lightboxUrl = URL.createObjectURL(file);
        const imgEl = document.createElement("img");
        imgEl.addEventListener("load", () => {
          this.#lightbox.style.width =
            imgEl.getBoundingClientRect().width.toString(10) + "px";
        });
        imgEl.src = lightboxUrl;
        imgEl.alt = this.#image.path;
        this.#lightbox.appendChild(imgEl);
      })
      .catch((err) =>
        console.error(
          "Error while loading",
          this.#image.path,
          "into image element.",
          err,
        ),
      );
    this.#lightbox.showPopover();
  }

  connectedCallback() {
    this.#isDisconnected = false;
    this.innerHTML = `<span class="map-popup__parent">${this.#image.parent.substring(1)}</span>
<strong class="map-popup__name">${this.#image.name}</strong>
<div class="map-popup__image"></div>
<div class="map-popup__footer">
     <span class="map-popup__date">${dateFormatter.format(this.#image.date)}</span>
     <a class="map-popup__coords"
      href="https://www.google.com/maps/place/${this.#image.coordinates.lat},${this.#image.coordinates.lng}"
      target="_blank"
      rel="noopener"
      >${this.#image.coordinates.lat.toFixed(5)}, ${this.#image.coordinates.lng.toFixed(5)} ${OPEN_IN_NEW}</a>
</div>`;
    const imgContainerEl = this.querySelector(".map-popup__image");
    imgContainerEl.addEventListener("click", () => this.#onClick());

    this.#image.handle
      .getFile()
      .then((file) => {
        if (this.#isDisconnected) {
          return;
        }
        this.#url = URL.createObjectURL(file);
        imgContainerEl.innerHTML = `<img src="${this.#url}" alt="${this.#image.name}">`;
      })
      .catch((err) =>
        console.error(
          "Error while loading",
          this.#image.path,
          "into image element.",
          err,
        ),
      );
  }

  disconnectedCallback() {
    this.#isDisconnected = true;
    URL.revokeObjectURL(this.#url);
  }
}

if ("customElements" in window) {
  customElements.define("app-popup-content", PopupContent);
} else {
  alert("Use a modern browser.");
}
