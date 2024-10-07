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
  _handle;
  /**
   * @type {File}
   */
  _file;
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
   * @param {string | Image} parentOrImage
   * @param {string?} path
   * @param {string?} name
   * @param {FileSystemFileHandle | File?} handle
   * @param {LatLng?} latlng
   * @param {Date?} date
   */
  constructor(parentOrImage, path, name, handle, latlng, date) {
    if (arguments.length === 1 && typeof parentOrImage === 'object') {
      Object.assign(this, parentOrImage);
      return this;
    }
    if (latlng == null) {
      throw new Error(`Received no LatLng for file ${path}.`);
    }
    this.parent = parentOrImage;
    this.path = path;
    this.name = name;
    if (handle instanceof FileSystemFileHandle) {
      this._handle = handle;
    } else {
      this._file = handle;
    }
    this.coordinates = latlng;
    this.date = date;
  }


  /**
   * @returns {Promise<File>}
   */
  getFile() {
    return this._file ? Promise.resolve(this._file) : this._handle.getFile();
  }
}
