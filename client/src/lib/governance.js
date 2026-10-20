const CLAIM_REPLACEMENTS = [
  [/\bguaranteed\b/gi, "designed to support"],
  [/\bguarantees\b/gi, "may help deliver"],
  [/\bguarantee\b/gi, "aim to deliver"],
  [/\b#1\b/gi, "leading"],
  [/\bnumber one\b/gi, "leading"],
  [/\bbest\b/gi, "high-quality"],
  [/\brisk-free\b/gi, "lower-risk"],
];

function addFinding(findings, finding) {
  if (!findings.some((existing) => existing.id === finding.id)) findings.push(finding);
}

export function reviewContent(content, rules = {}) {
  const findings = [];
  const text = content.trim();
  if (!text) return findings;

  const claims = /(?:\b(best|number one|guaranteed|guarantees|guarantee|100%|risk-free|never fail)\b|#1)/gi;
  for (const match of text.matchAll(claims)) {
    const phrase = match[0];
    const replacement = CLAIM_REPLACEMENTS.find(([pattern]) => {
      pattern.lastIndex = 0;
      return pattern.test(phrase);
    })?.[1];
    const proposedTerm = replacement;
    addFinding(findings, {
      id: `claim-${match.index}`,
      category: "Promotional claim",
      severity: "Needs evidence",
      excerpt: phrase,
      replacement: proposedTerm,
      explanation: `“${phrase}” is an absolute or comparative claim. No approved evidence was supplied to substantiate it.`,
      source: "Inkloom check: support promotional claims with an approved source",
      suggestion: proposedTerm
        ? `Consider replacing “${phrase}” with “${proposedTerm}”, or provide an approved source.`
        : "Add a verifiable, approved source for this claim or qualify the wording.",
    });
  }

  const termPairs = (rules.preferredTerms || "")
    .split(/\r?\n/)
    .map((line) => line.split(/\s*(?:->|→)\s*/))
    .filter(([from, to]) => from?.trim() && to?.trim());

  for (const [from, to] of termPairs) {
    const escaped = from.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    for (const match of text.matchAll(pattern)) {
      addFinding(findings, {
        id: `term-${from.trim().toLowerCase()}-${match.index}`,
        category: "Terminology",
        severity: "Guideline mismatch",
        excerpt: match[0],
        replacement: to.trim(),
        explanation: `Use the approved term “${to.trim()}” instead of “${from.trim()}” for consistent brand language.`,
        source: "Your terminology guidelines",
        suggestion: `Replace “${match[0]}” with “${to.trim()}”.`,
      });
    }
  }

  const inaccessibleLinkText = /\b(click here|read more|learn more)\b/gi;
  for (const match of text.matchAll(inaccessibleLinkText)) {
    addFinding(findings, {
      id: `accessibility-${match.index}`,
      category: "Accessibility",
      severity: "Review",
      excerpt: match[0],
      explanation: "Link text should describe its destination or action so it makes sense when read out of context.",
      source: "Inkloom check: descriptive link text",
      suggestion: "Replace this phrase with a specific destination or action, such as “View the accessibility guide.”",
    });
  }

  const allCaps = text.match(/\b[A-Z]{4,}\b/g) || [];
  if (allCaps.length >= 2) {
    addFinding(findings, {
      id: "tone-all-caps",
      category: "Tone",
      severity: "Review",
      excerpt: allCaps.slice(0, 4).join(", "),
      explanation: "Several all-caps words can read as shouting and may conflict with a calm, trustworthy brand voice.",
      source: "Inkloom check: readable, consistent tone",
      suggestion: "Use sentence case for emphasis and reserve capitals for names or acronyms.",
    });
  }

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  if (sentences.some((sentence) => sentence.trim().split(/\s+/).length > 35)) {
    addFinding(findings, {
      id: "accessibility-long-sentence",
      category: "Accessibility",
      severity: "Suggestion",
      excerpt: "A sentence contains more than 35 words",
      explanation: "Long sentences can make important information harder to scan and understand.",
      source: "Inkloom check: plain-language readability",
      suggestion: "Split the sentence into shorter statements while keeping the same key information.",
    });
  }

  return findings;
}

export function applySuggestion(content, finding) {
  if (!finding.excerpt || !finding.replacement) return content;
  const escaped = finding.excerpt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.replace(new RegExp(escaped, "i"), finding.replacement);
}
