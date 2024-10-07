import { PopupContent } from "/components.js";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.fullscreen";
import "./controls/compass.js";
import "./controls/randomizer.js";
import AppImager from "./imager.js?worker";
import { Image } from "./models.js";
import { Store } from "./store.js";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.fullscreen/Control.FullScreen.css";
import "./styles.css";
import AppWalker from "./walker.js?worker";

let walker = new AppWalker();
const worker1 = new AppImager();
const worker2 = new AppImager();

let importReportEl = document.getElementById("import-report");
const lightboxEl = document.getElementById("lightbox");
const dateRangeEl = document.getElementById("date-range");
let dateRangeElVisible = false;

const store = new Store();

const markers = L.markerClusterGroup();

/**
 *
 * @param {Image[]} bulk
 */
function onReceiveImages(bulk) {
  if (bulk.length === 0) {
    return;
  }
  const revived = bulk.map(x => new Image(x))
  store.addImages(revived);
  renderDateRange();

  const newMarkers = revived.map((image) =>
    L.marker(image.coordinates).bindPopup(
      () => new PopupContent(image, lightboxEl),
    ),
  );
  markers.addLayers(newMarkers);
}

function renderDateRange() {
  const firstDate = store.minDate;
  if (!firstDate) {
    return;
  }
  if (!dateRangeElVisible) {
    dateRangeElVisible = true;
    dateRangeEl.style.setProperty("display", "block");
  }
  const lastDate = store.maxDate;

  if (firstDate.label === lastDate.label) {
    dateRangeEl.innerHTML = `${firstDate.label}`;
    return;
  }
  dateRangeEl.innerHTML = `${firstDate.label} &ndash; ${lastDate.label}`;
}

function beginProcessing(worker, directories) {
  return new Promise((resolve) => {
    worker.onmessage = function (e) {
      // TODO: what to do with import report?
      switch (e.data.type) {
        case "done":
          resolve();
          break;
        case "directory":
          importReportEl.textContent = e.data.directory.path;
          break;
        case "images":
          importReportEl.textContent = e.data.directoryPath;
          onReceiveImages(e.data.bulk);
          break;
      }
    };
    // TODO: make this nicer
    if (directories[0] instanceof FileSystemDirectoryHandle) {
      worker.postMessage({
        directories,
      });
    } else {
      worker.postMessage({
        files: directories,
      });
    }
  });
}

walker.onmessage = function (e) {
  const { directories } = e.data;
  const first = directories.slice(0, Math.floor(directories.length / 2));
  const second = directories.slice(Math.floor(directories.length / 2));
  walker.terminate();
  walker = undefined;
  Promise.all([
    beginProcessing(worker1, first),
    beginProcessing(worker2, second),
  ])
    .then(() => {
      importReportEl.remove();
      importReportEl = undefined;
    })
    .catch((err) =>
      console.error("Error while handling directories", directories, err),
    )
    .finally(() => console.timeEnd("import"));
};

async function onSelectDirectory() {
  /** @type {FileSystemDirectoryHandle} */
  const selectedDirectory = await window
    .showDirectoryPicker({ id: "photomap", startIn: "pictures" })
    .catch(() => null); // e.g. AbortError
  if (selectedDirectory == null) {
    return;
  }
  console.time("import");
  walker.postMessage({ selectedDirectory });
  document.getElementById("welcome").close();
  importReportEl.style.display = "block";
  importReportEl.textContent = selectedDirectory.name;
}

/**
 * @param {FileList | undefined | null} files
 */
function onFilesPicked(files) {
  if (!files || files.length === 0) {
    return;
  }
  walker.terminate();
  walker = undefined;
  console.time("import");
  const fileArray = Array.from(files);
  const first = fileArray.slice(0, Math.floor(fileArray.length / 2));
  const second = fileArray.slice(Math.floor(fileArray.length / 2));
  Promise.all([
    beginProcessing(worker1, first),
    beginProcessing(worker2, second),
  ])
    .then(() => {
      importReportEl.remove();
      importReportEl = undefined;
    })
    .catch((err) =>
      console.error("Error while handling files", fileArray, err),
    )
    .finally(() => console.timeEnd("import"));
  document.getElementById("welcome").close();
}

function main() {
  const map = L.map("map", {
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: "bottomright",
    },
    zoomControl: false,
  }).setView([0, 0], 3);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | PhotoMap is <a href="https://github.com/JanMalch/PhotoMap">open source</a>',
  }).addTo(map);

  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  markers.addTo(map);

  L.control
    .randomizer({
      provideAllImages: () => store.getAllImages(),
      position: "bottomright",
    })
    .addTo(map);

  L.control
    .compass({
      position: "bottomleft",
      compass: store.compass,
    })
    .addTo(map);

  const selectDirectoryBtn = document.getElementById("select-directory");
  if (selectDirectoryBtn) {
  selectDirectoryBtn.disabled = false;
  selectDirectoryBtn.addEventListener("click", () => onSelectDirectory());
  }

  const pickFilesInput = document.getElementById("pick-files");
  pickFilesInput.disabled = false;
  pickFilesInput.addEventListener("change", (ev) => {
    onFilesPicked(ev.target.files)
  });

  lightboxEl.addEventListener("toggle", (e) => {
    if (e.newState === "closed") {
      URL.revokeObjectURL(lightboxEl.querySelector("img")?.src);
      lightboxEl.innerHTML = "";
      lightboxEl.style.width = "";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => main());
