import ExifReader from "exifreader/dist/exif-reader.js";
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

/**
 *
 * @param {File} file
 * @param {string} parent
 * @param {string} name
 * @param {FileSystemFileHandle?} handle
 * @returns {Promise<Image | undefined>}
 */
async function fileToImage(file, parent, name, handle) {
  if (!file.type.startsWith("image/")) {
    return
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
    return;
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
  return new Image(
    parent,
    parent + "/" + name,
    name,
    handle ?? file,
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
}

async function buildImagesFromDirectory(parent, dirHandle, notify) {
  notify({ type: "directory", directory: parent });
  const bulk = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind !== "file") {
      continue;
    }
    try {
      const image = await fileToImage(
        await entry.getFile(),
        parent,
        entry.name,
        entry
      );
      if (image == null) {
        continue;
      }
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

async function buildImagesFromList(files, notify) {
  const parent = '/'
  notify({ type: "directory", directory: parent });
  const bulk = [];

  for (const file of files) {
    try {
      const image = await fileToImage(
        file,
        parent,
        file.name,
      );
      if (image == null) {
        continue;
      }
      bulk.push(image);
      if (bulk.length === BULK_SIZE) {
        notify({ type: "images", bulk, directoryPath: parent });
        bulk.length = 0;
      }
    } catch (e) {
      console.error(
        "Error while processing image",
        file.name,
        "in file list. Skipping this file ...",
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
  const { directories, files } = e.data;

  const notify = (notification) => {
    self.postMessage(notification);
  }

  if (directories) {
    for (const dir of directories) {
      await buildImagesFromDirectory(dir.path, dir.dirHandle, notify);
    }
  } else if (files) {
    await buildImagesFromList(files, notify)
  } else {
    return
  }

  self.postMessage({ type: "done" });
};
