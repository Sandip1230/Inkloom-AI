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

function findingAt(finding, start, excerpt) {
  return {
    ...finding,
    start,
    end: start + excerpt.length,
  };
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
      ...findingAt({}, match.index, phrase),
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
        ...findingAt({}, match.index, match[0]),
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
      ...findingAt({}, match.index, match[0]),
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
  if (
    Number.isInteger(finding.start)
    && Number.isInteger(finding.end)
    && content.slice(finding.start, finding.end).toLowerCase() === finding.excerpt.toLowerCase()
  ) {
    return `${content.slice(0, finding.start)}${finding.replacement}${content.slice(finding.end)}`;
  }
  const escaped = finding.excerpt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.replace(new RegExp(escaped, "i"), finding.replacement);
}

function capitalizeFirst(text) {
  return text.replace(/^(\s*)(\p{L})/u, (_, whitespace, letter) => `${whitespace}${letter.toLocaleUpperCase()}`);
}

function splitLongSentences(content) {
  const edits = [];
  const sentences = [...content.matchAll(/[^.!?]+[.!?]+|[^.!?]+$/g)];

  for (const match of sentences) {
    const sentence = match[0];
    if (sentence.trim().split(/\s+/).length <= 35 || !sentence.includes(";")) continue;

    const parts = sentence.trim().split(/\s*;\s*/);
    if (parts.length < 2 || parts.some((part) => part.split(/\s+/).length > 35)) continue;

    const leadingWhitespace = sentence.match(/^\s*/)?.[0] || "";
    const ending = parts[parts.length - 1].match(/[.!?]+$/)?.[0] || ".";
    parts[parts.length - 1] = parts[parts.length - 1].replace(/[.!?]+$/, "");
    const replacement = parts
      .map((part, index) => `${index === 0 ? part : capitalizeFirst(part)}${index === parts.length - 1 ? ending : "."}`)
      .join(" ");
    edits.push({
      start: match.index,
      end: match.index + sentence.length,
      replacement: `${leadingWhitespace}${replacement}`,
    });
  }

  return edits.reduceRight(
    (result, edit) => `${result.slice(0, edit.start)}${edit.replacement}${result.slice(edit.end)}`,
    content,
  );
}

function replaceCommonFiller(content) {
  const phrases = [
    [/\bin order to\b/gi, "to"],
    [/\bat this point in time\b/gi, "now"],
    [/\bdue to the fact that\b/gi, "because"],
    [/\ba large number of\b/gi, "many"],
    [/\bin the event that\b/gi, "if"],
    [/\bhas the ability to\b/gi, "can"],
  ];

  return phrases.reduce((result, [pattern, replacement]) => result.replace(pattern, (match) => (
    /^[A-Z]/.test(match) ? capitalizeFirst(replacement) : replacement
  )), content);
}

function applyFindingReplacements(content, findings, categories) {
  const edits = findings
    .filter((finding) => categories.includes(finding.category) && finding.replacement && Number.isInteger(finding.start))
    .map((finding) => ({
      start: finding.start,
      end: finding.end,
      replacement: finding.replacement,
    }))
    .sort((first, second) => second.start - first.start);

  return edits.reduce(
    (result, edit) => `${result.slice(0, edit.start)}${edit.replacement}${result.slice(edit.end)}`,
    content,
  );
}

export function createBrandSafeRemixes(content, findings, rules = {}) {
  const candidates = [
    {
      id: "on-brand",
      title: "More on-brand",
      description: "Apply configured preferred terms and cautious wording for flagged claims.",
      content: applyFindingReplacements(content, findings, ["Terminology", "Promotional claim"]),
    },
    {
      id: "accessible",
      title: "More accessible",
      description: "Split long semicolon-separated sentences into shorter statements.",
      content: splitLongSentences(content),
    },
    {
      id: "concise",
      title: "More concise",
      description: "Replace a few common wordy phrases without changing their intended meaning.",
      content: replaceCommonFiller(content),
    },
  ];

  return candidates
    .filter((candidate) => candidate.content !== content)
    .map((candidate) => {
      const remainingFindings = reviewContent(candidate.content, rules);
      const categories = [...new Set(findings.map((finding) => finding.category))];
      const clearedCategories = categories.filter((category) => (
        !remainingFindings.some((finding) => finding.category === category)
      ));

      return {
        ...candidate,
        remainingFindings,
        clearedCategories,
      };
    });
}

export function createBrandTwinDebate(findings) {
  const voiceFindings = findings.filter((finding) => ["Terminology", "Tone"].includes(finding.category));
  const claimFindings = findings.filter((finding) => finding.category === "Promotional claim");
  const accessibilityFindings = findings.filter((finding) => finding.category === "Accessibility");
  const examples = (items) => items
    .slice(0, 3)
    .map((finding) => `“${finding.excerpt}”`)
    .join(", ");

  const guardian = voiceFindings.length
    ? `Configured brand-voice checks flagged ${examples(voiceFindings)}. Resolve these before calling the draft aligned.`
    : "No configured terminology or tone mismatches were detected. That is a narrow signal, not proof of brand fit.";

  let skeptic = claimFindings.length
    ? `Claims such as ${examples(claimFindings)} have no approved evidence attached in this review. The checker flags wording; it cannot verify truth.`
    : "No selected promotional-claim pattern was flagged. This review does not verify factual accuracy or legal compliance.";
  if (accessibilityFindings.length) {
    skeptic += ` Accessibility checks also flagged ${examples(accessibilityFindings)}.`;
  }

  return {
    guardian,
    skeptic,
    verdict: findings.length
      ? `${findings.length} configured finding${findings.length === 1 ? "" : "s"} need human consideration; the checks do not decide brand fit.`
      : "No configured checks were triggered; a human still decides whether the draft fits the brand.",
  };
}
