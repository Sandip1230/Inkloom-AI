const KEY = "inkloom-notifications";

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  window.dispatchEvent(new Event("inkloom-notifications-changed"));
}

export function getNotifications() {
  return read();
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

export function clearNotifications() {
  write([]);
}