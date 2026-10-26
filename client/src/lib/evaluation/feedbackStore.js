import { WHOLE_CHECKS } from "./evaluate.js";

const FEEDBACK_KEY = "inkloom-finding-feedback";
const MAX_RECORDS = 500;
const MAX_NOTE = 500;
const MAX_CONTEXT = 240;

export const FEEDBACK_TYPES = {
  INCORRECT_FINDING: "incorrect-finding",
  MISSED_ISSUE: "missed-issue",
};

export const FEEDBACK_CHECKS = {
  claim: "Promotional claim",
  terminology: "Terminology",
  "link-text": "Link text",
  "all-caps": "All-caps tone",
  "long-sentence": "Long sentence",
  other: "Other",
};

export const TRIAGE_STATES = ["new", "added-to-golden-set", "dismissed"];

export function createMemoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
  };
}

let fallbackStorage;
function defaultStorage() {
  if (typeof globalThis.localStorage !== "undefined") return globalThis.localStorage;
  fallbackStorage ||= createMemoryStorage();
  return fallbackStorage;
}

export function listFeedback(storage = defaultStorage()) {
  try {
    const stored = storage.getItem(FEEDBACK_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(records, storage) {
  storage.setItem(FEEDBACK_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
}

// A short window of text around the excerpt. The whole draft is never stored.
export function contextAround(content, excerpt) {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const at = excerpt ? text.toLowerCase().indexOf(String(excerpt).toLowerCase()) : -1;
  if (at === -1) return text.slice(0, MAX_CONTEXT);
  const start = Math.max(0, at - Math.floor((MAX_CONTEXT - excerpt.length) / 2));
  return text.slice(start, start + MAX_CONTEXT);
}

export function createFeedback(input) {
  const type = input?.type;
  if (!Object.values(FEEDBACK_TYPES).includes(type)) {
    throw new Error("Choose whether the finding is incorrect or an issue was missed.");
  }
  const check = input.check;
  if (!Object.hasOwn(FEEDBACK_CHECKS, check)) {
    throw new Error("Choose which check this feedback is about.");
  }
  const excerpt = String(input.excerpt || "").trim();
  if (!excerpt && !WHOLE_CHECKS.has(check)) {
    throw new Error("Include the exact text this feedback is about.");
  }
  const note = String(input.note || "").trim().slice(0, MAX_NOTE);
  if (type === FEEDBACK_TYPES.MISSED_ISSUE && !note) {
    throw new Error("Describe the issue that was missed.");
  }

  return {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    check,
    excerpt,
    note,
    reviewId: input.reviewId || null,
    reviewerName: String(input.reviewerName || "").trim().slice(0, 80),
    context: contextAround(input.content, excerpt),
    createdAt: Date.now(),
    triage: "new",
  };
}

function sameReport(first, second) {
  return first.reviewId === second.reviewId
    && first.type === second.type
    && first.check === second.check
    && first.excerpt.toLowerCase() === second.excerpt.toLowerCase();
}

export function addFeedback(input, storage = defaultStorage()) {
  const record = createFeedback(input);
  const records = listFeedback(storage);
  const existing = records.find((item) => sameReport(item, record));
  if (existing) return { record: existing, duplicate: true };
  save([record, ...records], storage);
  return { record, duplicate: false };
}

export function updateTriage(id, triage, storage = defaultStorage()) {
  if (!TRIAGE_STATES.includes(triage)) throw new Error("Unknown triage state.");
  const records = listFeedback(storage);
  const index = records.findIndex((item) => item.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], triage };
  save(records, storage);
  return records[index];
}

export function summarizeFeedback(records = listFeedback()) {
  const byCheck = {};
  for (const record of records) {
    byCheck[record.check] ||= { incorrect: 0, missed: 0 };
    if (record.type === FEEDBACK_TYPES.INCORRECT_FINDING) byCheck[record.check].incorrect += 1;
    else byCheck[record.check].missed += 1;
  }
  return {
    total: records.length,
    incorrect: records.filter((item) => item.type === FEEDBACK_TYPES.INCORRECT_FINDING).length,
    missed: records.filter((item) => item.type === FEEDBACK_TYPES.MISSED_ISSUE).length,
    awaitingTriage: records.filter((item) => item.triage === "new").length,
    byCheck,
  };
}

// Builds a candidate labeled sample from reviewer feedback. A person must confirm the
// labels before it is added to the golden set; nothing is added automatically.
export function toGoldenSampleDraft(record) {
  return {
    id: `feedback-${record.id}`,
    title: record.type === FEEDBACK_TYPES.INCORRECT_FINDING
      ? `Reviewer reported an incorrect ${FEEDBACK_CHECKS[record.check].toLowerCase()} finding`
      : `Reviewer reported a missed ${FEEDBACK_CHECKS[record.check].toLowerCase()} issue`,
    content: record.context,
    expected: record.type === FEEDBACK_TYPES.INCORRECT_FINDING
      ? []
      : [WHOLE_CHECKS.has(record.check) ? { check: record.check } : { check: record.check, excerpt: record.excerpt }],
    needsHumanConfirmation: true,
    reviewerNote: record.note,
  };
}