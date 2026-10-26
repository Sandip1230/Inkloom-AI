import assert from "node:assert/strict";
import test from "node:test";
import { GOLDEN_SET } from "./goldenSet.js";
import { EVALUATION_NOTICE, evaluateAll, evaluateSample } from "./evaluate.js";

// Quality floors for the current checks. Raise these when the checks improve.
const BASELINE = { precision: 0.84, recall: 0.73 };

test("golden set is well formed", () => {
  const ids = GOLDEN_SET.map((sample) => sample.id);
  assert.equal(new Set(ids).size, ids.length, "sample ids must be unique");
  for (const sample of GOLDEN_SET) {
    assert.equal(typeof sample.content, "string");
    assert.ok(Array.isArray(sample.expected), `${sample.id} needs an expected array`);
  }
});

test("samples without a known issue match their labels exactly", () => {
  const report = evaluateAll(GOLDEN_SET);
  const regressions = report.results.filter((result) => !result.knownIssue && !result.passed);
  assert.deepEqual(
    regressions.map((result) => ({ id: result.id, falsePositives: result.falsePositives, missed: result.missed })),
    [],
    "A check changed and now disagrees with a labeled sample",
  );
});

test("known issues are still real gaps, so fixed ones must be unmarked", () => {
  const report = evaluateAll(GOLDEN_SET);
  const nowPassing = report.results.filter((result) => result.knownIssue && result.passed);
  assert.deepEqual(
    nowPassing.map((result) => result.id),
    [],
    "These samples now pass: remove their knownIssue field and raise BASELINE",
  );
});

test("overall precision and recall do not fall below the baseline", () => {
  const { totals } = evaluateAll(GOLDEN_SET);
  assert.ok(totals.precision >= BASELINE.precision, `precision ${totals.precision} fell below ${BASELINE.precision}`);
  assert.ok(totals.recall >= BASELINE.recall, `recall ${totals.recall} fell below ${BASELINE.recall}`);
});

test("scoring counts false positives and missed issues", () => {
  const sample = { id: "x", title: "x", content: "ignored", expected: [{ check: "claim", excerpt: "best" }] };
  const extra = evaluateSample(sample, () => [
    { id: "claim-0", excerpt: "best" },
    { id: "claim-9", excerpt: "guarantee" },
  ]);
  assert.equal(extra.tp, 1);
  assert.equal(extra.fp, 1);
  assert.equal(extra.fn, 0);

  const none = evaluateSample(sample, () => []);
  assert.equal(none.tp, 0);
  assert.equal(none.fn, 1);
  assert.deepEqual(none.missed, ["claim:best"]);
});

test("evaluation is never an approval", () => {
  const report = evaluateAll(GOLDEN_SET);
  assert.equal(report.isApproval, false);
  assert.equal(report.notice, EVALUATION_NOTICE);
  assert.match(report.notice, /never approves/);
  const serialized = JSON.stringify(report).toLowerCase();
  assert.equal(serialized.includes("\"status\""), false);
  assert.equal(serialized.includes("\"approved\""), false);
});