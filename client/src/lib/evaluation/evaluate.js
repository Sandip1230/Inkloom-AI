import { reviewContent } from "../governance.js";

export const EVALUATION_NOTICE = "Evaluation measures how well the automated checks match labeled examples. It never approves, rejects or changes the status of any draft.";

export function checkOf(finding) {
  const id = String(finding.id || "");
  if (id.startsWith("claim-")) return "claim";
  if (id.startsWith("term-")) return "terminology";
  if (id === "tone-all-caps") return "all-caps";
  if (id === "accessibility-long-sentence") return "long-sentence";
  if (id.startsWith("accessibility-")) return "link-text";
  return "other";
}

export const WHOLE_CHECKS = new Set(["all-caps", "long-sentence"]);

export function keyOf(item) {
  const check = item.check || checkOf(item);
  if (WHOLE_CHECKS.has(check)) return check;
  return `${check}:${String(item.excerpt || "").trim().toLowerCase()}`;
}

function countKeys(items) {
  const counts = new Map();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator;
}

function summarize(tp, fp, fn) {
  const precision = ratio(tp, tp + fp);
  const recall = ratio(tp, tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, fp, fn, precision, recall, f1 };
}

export function evaluateSample(sample, analyze = reviewContent) {
  const findings = analyze(sample.content, sample.rules || {});
  const expected = countKeys(sample.expected || []);
  const actual = countKeys(findings);
  const falsePositives = [];
  const missed = [];
  let tp = 0;

  for (const key of new Set([...expected.keys(), ...actual.keys()])) {
    const want = expected.get(key) || 0;
    const got = actual.get(key) || 0;
    tp += Math.min(want, got);
    for (let i = 0; i < got - want; i += 1) falsePositives.push(key);
    for (let i = 0; i < want - got; i += 1) missed.push(key);
  }

  return {
    id: sample.id,
    title: sample.title,
    knownIssue: sample.knownIssue || null,
    passed: falsePositives.length === 0 && missed.length === 0,
    tp,
    fp: falsePositives.length,
    fn: missed.length,
    falsePositives,
    missed,
  };
}

export function evaluateAll(samples, analyze = reviewContent) {
  const results = samples.map((sample) => evaluateSample(sample, analyze));
  const totals = summarize(
    results.reduce((sum, result) => sum + result.tp, 0),
    results.reduce((sum, result) => sum + result.fp, 0),
    results.reduce((sum, result) => sum + result.fn, 0),
  );

  const perCheck = {};
  for (const result of results) {
    const sample = samples.find((item) => item.id === result.id);
    const keys = [
      ...(sample.expected || []).map(keyOf),
      ...result.falsePositives,
    ];
    for (const key of keys) {
      const check = key.split(":")[0];
      perCheck[check] ||= { tp: 0, fp: 0, fn: 0 };
    }
    const expectedKeys = new Set((sample.expected || []).map(keyOf));
    for (const key of expectedKeys) {
      const check = key.split(":")[0];
      const missedCount = result.missed.filter((item) => item === key).length;
      const wanted = (sample.expected || []).filter((item) => keyOf(item) === key).length;
      perCheck[check].tp += wanted - missedCount;
      perCheck[check].fn += missedCount;
    }
    for (const key of result.falsePositives) {
      perCheck[key.split(":")[0]].fp += 1;
    }
  }
  const byCheck = Object.fromEntries(
    Object.entries(perCheck).map(([check, counts]) => [check, summarize(counts.tp, counts.fp, counts.fn)]),
  );

  return {
    notice: EVALUATION_NOTICE,
    isApproval: false,
    sampleCount: samples.length,
    passedCount: results.filter((result) => result.passed).length,
    totals,
    byCheck,
    results,
  };
}