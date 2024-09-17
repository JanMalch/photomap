import { Image } from "./models.js";

const dateFormatter = new Intl.DateTimeFormat(navigator.language, {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
});

export class Store {
  /** @type {Record<'north' | 'south' | 'east' | 'west', Image | undefined>} */
  compass = {
    north: undefined,
    south: undefined,
    west: undefined,
    east: undefined,
  };
  #images = [];
  /** @type {{ date: string, label: string } | undefined} */
  minDate;
  /** @type {{ date: string, label: string } | undefined} */
  maxDate;

  getAllImages() {
    return this.#images;
  }

  /**
   *
   * @param {Image[]} images
   * @returns
   */
  addImages(images) {
    if (images.length === 0) {
      return;
    }
    images.forEach((image) => {
      this.#images.push(image);
      const dateKey = image.date.toISOString().substring(0, 10);
      const dateLabel = dateFormatter.format(image.date);

      if (!this.minDate || dateKey < this.minDate.date) {
        this.minDate = { date: dateKey, label: dateLabel };
      }
      if (!this.maxDate || dateKey > this.maxDate.date) {
        this.maxDate = { date: dateKey, label: dateLabel };
      }

      if (this.compass.north == null) {
        this.compass.north = image;
        this.compass.south = image;
        this.compass.east = image;
        this.compass.west = image;
      } else {
        if (this.compass.north.coordinates.lat < image.coordinates.lat) {
          this.compass.north = image;
        }
        if (this.compass.south.coordinates.lat > image.coordinates.lat) {
          this.compass.south = image;
        }
        if (this.compass.east.coordinates.lng < image.coordinates.lng) {
          this.compass.east = image;
        }
        if (this.compass.west.coordinates.lng > image.coordinates.lng) {
          this.compass.west = image;
        }
      }
    });
  }
}
