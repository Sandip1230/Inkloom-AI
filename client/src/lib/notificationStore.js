const KEY = "inkloom-notifications";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // notifications are removed 24 hours after they were created

function readAll() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function isFresh(note) {
  const created = new Date(note && note.createdAt).getTime();
  return Number.isFinite(created) && Date.now() - created < MAX_AGE_MS;
}

// Only notifications younger than 24 hours are ever returned.
function read() {
  return readAll().filter(isFresh);
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  window.dispatchEvent(new Event("inkloom-notifications-changed"));
}

export function getNotifications() {
  const all = readAll();
  const fresh = all.filter(isFresh);
  // Also delete the expired ones from storage, so they do not pile up.
  if (fresh.length !== all.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(fresh));
    } catch {
      /* storage blocked: the expired ones are still hidden */
    }
  }
  return fresh;
}

export function addNotification(message) {
  const list = read();
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
  write(list);
}

export function markAllRead() {
  write(read().map((note) => ({ ...note, read: true })));
}

export function removeNotification(id) {
  write(read().filter((note) => note.id !== id));
}

export function clearNotifications() {
  write([]);
}