// projectsStore.js — persists brand projects in the browser's localStorage.
// No backend needed; each project lives only in the browser that created it.

const STORAGE_KEY = "brandloom-projects";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // localStorage unavailable (private browsing, quota full) - fails silently,
    // the app still works for the current session, just won't persist.
  }
}

export function listProjects() {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id) {
  if (!id) return null;
  return readAll()[id] || null;
}

export function saveProject(project) {
  const projects = readAll();
  projects[project.id] = { ...project, updatedAt: Date.now() };
  writeAll(projects);
  return projects[project.id];
}

export function deleteProject(id) {
  const projects = readAll();
  delete projects[id];
  writeAll(projects);
}

export function createProjectId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}