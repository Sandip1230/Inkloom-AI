// Rule-based PR / legal / tone risk score (0-100) with a per-line breakdown.
// Pure functions: no React, no browser APIs.

const DIMENSIONS = [
  { id: "legal", label: "Legal risk" },
  { id: "pr", label: "PR / backlash" },
  { id: "tone", label: "Tone mismatch" },
];

const RULES = [
  // ----- Legal -----
  { dim: "legal", points: 22, pattern: /\b(clinically proven|scientifically proven|doctor[- ]recommended|FDA[- ]approved)\b/gi, reason: "Unverified proof or approval claim" },
  { dim: "legal", points: 22, pattern: /\b(no side effects|no risk)\b/gi, reason: "Absolute safety claim" },
  { dim: "legal", points: 28, pattern: /\b(guaranteed (?:returns?|results?|income)|get rich|double your money)\b/gi, reason: "Financial or result promise" },
  { dim: "legal", points: 14, pattern: /\byou(?:'ll| will) (?:definitely |certainly )?(?:earn|lose|gain|save|make)\b/gi, reason: "Promise of a personal outcome" },
  { dim: "legal", points: 10, pattern: /\b(cures?|heals?|prevents?|treats?)\b/gi, reason: "Possible health claim, check with legal" },
  { dim: "legal", points: 6, pattern: /\b(free|win|prize|giveaway)\b/gi, reason: "Promotion wording often needs terms" },

  // ----- PR / backlash -----
  { dim: "pr", points: 18, pattern: /\b(crazy|insane|lame|stupid|dumb|idiot\w*|crippl\w*|retarded|psycho\w*|schizo\w*|suicid\w*|falls? on deaf ears|blind to)\b/gi, reason: "Wording that may offend" },
  { dim: "pr", points: 10, pattern: /\b(better than|worse than|unlike|beats)\b/gi, reason: "Direct comparison or competitor jab" },
  { dim: "pr", points: 8, pattern: /\b(war|pandemic|tragedy|disaster|crisis)\b/gi, reason: "Sensitive topic, avoid piggybacking" },
  { dim: "pr", points: 8, pattern: /\b(revolutionary|game[- ]?changing|world[- ]class|unbeatable|life[- ]changing|miracle)\b/gi, reason: "Hype wording invites pushback" },
  { dim: "pr", points: 6, pattern: /\b(always|never|everyone|nobody)\b/gi, reason: "Absolute wording invites pushback" },

  // ----- Tone -----
  { dim: "tone", points: 10, pattern: /!{2,}/g, reason: "Repeated exclamation marks" },
  { dim: "tone", points: 6, pattern: /\?{2,}/g, reason: "Repeated question marks" },
  { dim: "tone", points: 10, pattern: /\b(act now|hurry|don['’]t miss|last chance|limited time|today only)\b/gi, reason: "Pressure or urgency wording" },
];

export function splitSegments(text) {
  const segments = [];
  for (const match of text.matchAll(/[^.!?\n]+[.!?]*/g)) {
    if (match[0].trim()) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0].trim(),
        points: 0,
        hits: [],
      });
    }
  }
  return segments;
}

function levelFor(score) {
  if (score < 20) return "Low";
  if (score < 45) return "Moderate";
  if (score < 70) return "High";
  return "Severe";
}

export function scoreRisk(content, findings = []) {
  const text = String(content || "");
  const segments = splitSegments(text);
  const totals = { legal: 0, pr: 0, tone: 0 };

  const add = (index, dim, points, reason) => {
    const segment = segments.find((item) => index >= item.start && index < item.end);
    if (!segment) return;
    if (segment.hits.some((hit) => hit.index === index && hit.reason === reason)) return;
    segment.hits.push({ index, dim, points, reason });
    segment.points += points;
    totals[dim] += points;
  };

  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) add(match.index, rule.dim, rule.points, rule.reason);
  }

  // Several ALL-CAPS words in one sentence read as shouting.
  for (const segment of segments) {
    const caps = segment.text.match(/\b[A-Z]{4,}\b/g) || [];
    if (caps.length >= 2) add(segment.start, "tone", 10, "ALL-CAPS words read as shouting");
  }

  // Reuse the rule findings that already know exactly where the problem is.
  for (const finding of findings) {
    if (!Number.isInteger(finding?.start)) continue;
    if (finding.category === "Promotional claim") {
      if (/guarant|100%|risk-free|never fail/i.test(finding.excerpt || "")) {
        add(finding.start, "legal", 25, "Absolute guarantee wording");
      } else {
        add(finding.start, "pr", 10, "Unsupported superlative");
      }
    } else if (finding.category === "Terminology") {
      add(finding.start, "tone", 8, "Off-brand terminology");
    }
  }

  const dimensions = DIMENSIONS.map((item) => ({ ...item, score: Math.min(100, totals[item.id]) }));
  // Combine like independent risks: 1 - (1-a)(1-b)(1-c)
  const overall = Math.round(
    100 * (1 - dimensions.reduce((product, item) => product * (1 - item.score / 100), 1)),
  );

  const totalPoints = segments.reduce((sum, segment) => sum + segment.points, 0);
  const lines = segments
    .filter((segment) => segment.points > 0)
    .map((segment) => ({
      text: segment.text,
      points: segment.points,
      share: totalPoints ? Math.round((100 * segment.points) / totalPoints) : 0,
      hits: segment.hits.map(({ dim, reason }) => ({ dim, reason })),
    }))
    .sort((a, b) => b.points - a.points);

  return { overall, level: levelFor(overall), dimensions, lines };
}