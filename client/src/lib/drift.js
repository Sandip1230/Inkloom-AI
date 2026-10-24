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
    }));
  if (typeof review.content === "string") {
    versions.push({
      id: `${review.id}-current`,
      content: review.content,
      updatedAt: review.updatedAt || 0,
      label: review.status || "Current draft",
    });
  }
  return versions.sort((a, b) => a.updatedAt - b.updatedAt);
}
