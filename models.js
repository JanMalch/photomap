export class LatLng {
  /**
   * Creates a new coordinate with optional altitude.
   * @param {number} lat N/S
   * @param {number} lng E/W
   * @param {number|undefined|null} alt
   */
  constructor(lat, lng, alt) {
    if (lat < -90 || lat > 90) {
      throw new Error(`Latitude must be in -90..90 but is ${lat}.`);
    }
    if (lng < -180 || lng > 180) {
      throw new Error(`Longitude must be in -180..180 but is ${lng}.`);
    }
    this.lat = lat;
    this.lng = lng;
    this.alt = alt ?? undefined;
  }
}

export class Image {
  /**
   * @type {FileSystemFileHandle}
   */
  handle;
  /**
   * @type {string}
   */
  parent;
  /**
   * @type {string}
   */
  path;
  /**
   * @type {string}
   */
  name;
  /**
   * @type {LatLng}
   */
  coordinates;
  /**
   * @type {Date}
   */
  date;

  /**
   * Creates a new file.
   * @param {string} parent
   * @param {string} path
   * @param {string} name
   * @param {FileSystemFileHandle} handle
   * @param {LatLng} latlng
   * @param {Date} date
   */
  constructor(parent, path, name, handle, latlng, date) {
    if (latlng == null) {
      throw new Error(`Received no LatLng for file ${path}.`);
    }
    this.parent = parent;
    this.path = path;
    this.name = name;
    this.handle = handle;
    this.coordinates = latlng;
    this.date = date;
  }
}
