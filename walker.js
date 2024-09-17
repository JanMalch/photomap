async function buildList(parent, dirHandle, list = []) {
  const path = parent + "/" + dirHandle.name;
  list.push({
    path,
    parent,
    name: dirHandle.name,
    dirHandle,
  });
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "directory") {
      await buildList(path, entry, list);
    }
  }
  return list;
}

self.onmessage = async function (e) {
  self.postMessage({
    directories: await buildList("", e.data.selectedDirectory),
  });
};
