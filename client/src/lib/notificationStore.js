const KEY = "inkloom-notifications";
const OPEN_FLAG = "inkloom-open-notifications";
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
  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.unshift(note);
  write(list);
  // Tells the slide-in popup that a brand new notification has arrived.
  window.dispatchEvent(new CustomEvent("inkloom-notification-added", { detail: note }));
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

// Called when the user taps a popup: asks the top bar to open the notification box.
// The flag is also saved so it still works if the top bar is not on screen yet
// (for example when the popup is tapped before the dashboard has opened).
export function requestOpenNotifications() {
  try {
    sessionStorage.setItem(OPEN_FLAG, "1");
  } catch {
    /* storage blocked: the event below still works if the top bar is mounted */
  }
  window.dispatchEvent(new Event("inkloom-open-notifications"));
}

// Returns true once if an "open the notification box" request is waiting, then clears it.
export function consumeOpenNotificationsRequest() {
  try {
    if (sessionStorage.getItem(OPEN_FLAG) === "1") {
      sessionStorage.removeItem(OPEN_FLAG);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}