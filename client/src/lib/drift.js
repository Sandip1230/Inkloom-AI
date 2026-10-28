const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is",
  "it", "of", "on", "or", "that", "the", "this", "to", "we", "with", "you",
]);

const PROMISE_PATTERNS = [
  /\b(?:guarantee[sd]?|promise[sd]?|ensure[sd]?|will always|never fail|risk[- ]free|100%)\b/gi,
  /\b(?:the best|number one|#1|unbeatable|instant(?:ly)?)\b/gi,
];

const TONE_SIGNALS = {
  Warmth: /\b(?:welcome|thanks|thank you|together|community|support|care|glad)\b/gi,
  Assertiveness: /\b(?:must|always|never|guarantee[sd]?|ensure[sd]?|best|unbeatable|instantly)\b/gi,
  Caution: /\b(?:may|might|could|designed to|aim to|help|often|typically)\b/gi,
};

function wordTokens(text) {
  return String(text || "").toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) || [];
}

export function extractPhrases(text) {
  const words = wordTokens(text);
  const phrases = new Map();
  for (let size = 2; size <= 4; size += 1) {
    for (let start = 0; start <= words.length - size; start += 1) {
      const phraseWords = words.slice(start, start + size);
      if (phraseWords.every((word) => STOP_WORDS.has(word))) continue;
      const phrase = phraseWords.join(" ");
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  }
  return phrases;
}

function matches(pattern, text) {
  pattern.lastIndex = 0;
  return [...String(text || "").matchAll(pattern)].map((match) => match[0].toLocaleLowerCase());
}

export function compareDrafts(draft, approved) {
  const draftPhrases = extractPhrases(draft);
  const approvedPhrases = extractPhrases(approved);
  const allPhrases = new Set([...draftPhrases.keys(), ...approvedPhrases.keys()]);
  const shared = [...allPhrases].filter((phrase) => draftPhrases.has(phrase) && approvedPhrases.has(phrase));
  const added = [...draftPhrases.keys()].filter((phrase) => !approvedPhrases.has(phrase));
  const removed = [...approvedPhrases.keys()].filter((phrase) => !draftPhrases.has(phrase));
  const overlap = allPhrases.size ? Math.round((shared.length / allPhrases.size) * 100) : 100;
  const draftPromises = [...new Set(PROMISE_PATTERNS.flatMap((pattern) => matches(pattern, draft)))];
  const approvedPromises = [...new Set(PROMISE_PATTERNS.flatMap((pattern) => matches(pattern, approved)))];
  const tone = Object.fromEntries(Object.entries(TONE_SIGNALS).map(([name, pattern]) => [
    name,
    {
      draft: matches(pattern, draft).length,
      approved: matches(pattern, approved).length,
    },
  ]));

  return {
    overlap,
    added: added.sort((a, b) => (draftPhrases.get(b) || 0) - (draftPhrases.get(a) || 0)).slice(0, 12),
    removed: removed.sort((a, b) => (approvedPhrases.get(b) || 0) - (approvedPhrases.get(a) || 0)).slice(0, 12),
    draftPromises,
    approvedPromises,
    tone,
  };
}

export function reviewVersions(review) {
  if (!review) return [];
  const revisions = Array.isArray(review.revisionHistory) ? review.revisionHistory : [];
  const versions = revisions
    .filter((revision) => typeof revision.content === "string")
    .map((revision, index) => ({
      id: `${review.id}-revision-${index}`,
      content: revision.content,
      updatedAt: revision.updatedAt || 0,
      label: "Saved revision",
      findings: Array.isArray(revision.findings) ? revision.findings.length : 0,
    }));
  if (typeof review.content === "string") {
    versions.push({
      id: `${review.id}-current`,
      content: review.content,
      updatedAt: review.updatedAt || 0,
      label: review.status || "Current draft",
      findings: Array.isArray(review.findings) ? review.findings.length : 0,
    });
  }
  return versions.sort((a, b) => a.updatedAt - b.updatedAt);
}

/* ---------- time machine helpers ---------- */

// Word diffs are O(n*m); beyond this size we skip the diff instead of freezing the page.
const MAX_DIFF_WORDS = 1500;

function words(text) {
  return String(text || "").match(/\S+/g) || [];
}

// Word-level diff between two texts (longest common subsequence).
// Returns null when either text is too long to diff cheaply.
export function wordDiff(before, after) {
  const a = words(before);
  const b = words(after);
  if (a.length > MAX_DIFF_WORDS || b.length > MAX_DIFF_WORDS) return null;

  const cols = b.length + 1;
  const table = new Uint16Array((a.length + 1) * cols);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] = a[i] === b[j]
        ? table[(i + 1) * cols + j + 1] + 1
        : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }

  const raw = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      raw.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      raw.push({ type: "del", text: a[i] });
      i += 1;
    } else {
      raw.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) raw.push({ type: "del", text: a[i++] });
  while (j < b.length) raw.push({ type: "add", text: b[j++] });

  // Merge neighbouring words of the same kind into one span.
  const parts = [];
  raw.forEach((item) => {
    const last = parts[parts.length - 1];
    if (last && last.type === item.type) last.text += ` ${item.text}`;
    else parts.push({ ...item });
  });

  const added = raw.filter((item) => item.type === "add").length;
  const removed = raw.filter((item) => item.type === "del").length;
  return { parts, added, removed, unchanged: raw.length - added - removed };
}

// How much two texts differ, 0 (identical) to 100 (nothing in common).
export function driftPercent(before, after, diff = wordDiff(before, after)) {
  if (diff) {
    const total = diff.added + diff.removed + 2 * diff.unchanged;
    return total ? Math.round(((diff.added + diff.removed) / total) * 100) : 0;
  }
  return 100 - compareDrafts(before, after).overlap;
}

// Reviews that have saved wording, oldest first - the "rail" of the time machine.
export function buildTimeline(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  return list
    .filter((review) => review && typeof review.content === "string" && review.content.trim())
    .map((review) => ({
      id: review.id,
      contentType: review.contentType || "Content review",
      status: review.status || "Draft",
      updatedAt: review.updatedAt || 0,
      versionCount: reviewVersions(review).length,
      review,
    }))
    .sort((a, b) => a.updatedAt - b.updatedAt);
}

// Versions of one review with word count and the change from the version before it.
export function annotateVersions(versions) {
  return versions.map((version, index) => {
    const previous = versions[index - 1];
    const diff = previous ? wordDiff(previous.content, version.content) : null;
    return {
      ...version,
      words: words(version.content).length,
      diff,
      drift: previous ? driftPercent(previous.content, version.content, diff) : null,
    };
  });
}