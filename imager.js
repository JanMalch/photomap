import ExifReader from "exifreader";
import { Image, LatLng } from "./models.js";

// low bulk sizes are more fun to watch
// bigger bulk sizes are slightly more performant, due to less message serializing
const BULK_SIZE = 10;

if (!globalThis.DOMParser) {
  class NopDOMParser {
    #dummy = new XMLDocument();
    parseFromString(string, mimeType) {
      return this.#dummy;
    }
  }
  globalThis.DOMParser = NopDOMParser;
}

async function buildImages(parent, dirHandle, notify) {
  notify({ type: "directory", directory: parent });
  const bulk = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind !== "file") {
      continue;
    }
    try {
      const file = await entry.getFile();
      if (!file.type.startsWith("image/")) {
        continue;
      }
      // Limit to regular Exif tags, so we can most probably get by with only reading the first 128 kB.
      // This is also a _massive_ speed up, like 45-60x
      const exifPart = file.slice(0, 128 * 1024);
      const tags = await ExifReader.load(await exifPart.arrayBuffer(), {
        expanded: true,
      });
      delete tags.exif?.["MakerNote"]; // It can be really large for some manufacturers.
      if (
        tags.gps == null ||
        !Number.isFinite(tags.gps.Latitude) ||
        !Number.isFinite(tags.gps.Longitude)
      ) {
        continue;
      }
      const latlng = new LatLng(
        tags.gps.Latitude,
        tags.gps.Longitude,
        tags.gps.Altitude,
      );
      let dateStr = tags.exif.DateTime?.description;
      if (dateStr) {
        const chars = dateStr.split("");
        chars[4] = ".";
        chars[7] = ".";
        dateStr = chars.join("");
      }
      const date = dateStr ? new Date(dateStr) : new Date(file.lastModified);
      const image = new Image(
        parent,
        parent + "/" + entry.name,
        entry.name,
        entry,
        latlng,
        date,
        /*{
          camera:
            (
              (tags.exif?.Make?.description ?? '') +
              ' ' +
              (tags.exif?.Model?.description ?? '')
            ).trim() || undefined,
          fNumber: tags.exif?.FNumber?.description?.replace('f/', 'ƒ/'),
          width:
            tags.exif?.ImageWidth?.value ?? tags.file?.['Image Width']?.value,
          height:
            tags.exif?.ImageLength?.value ??
            tags.file?.['Image Height']?.value,
          focalLength: tags.exif?.FocalLength?.description,
        },*/
      );
      bulk.push(image);
      if (bulk.length === BULK_SIZE) {
        notify({ type: "images", bulk, directoryPath: parent });
        bulk.length = 0;
      }
    } catch (e) {
      console.error(
        "Error while processing image",
        entry.name,
        "in",
        parent,
        ". Skipping this file ...",
        e,
      );
    }
  }

  if (bulk.length > 0) {
    notify({ type: "images", bulk, directoryPath: parent });
  }
  notify({ type: "directory-done", path: parent });
}

self.onmessage = async function (e) {
  const { directories } = e.data;

  for (const dir of directories) {
    await buildImages(dir.path, dir.dirHandle, (notification) => {
      self.postMessage(notification);
    });
  }

  self.postMessage({ type: "done" });
};
