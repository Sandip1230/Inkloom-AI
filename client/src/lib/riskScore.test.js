import test from "node:test";
import assert from "node:assert/strict";
import { reviewContent } from "./governance.js";
import { scoreRisk } from "./riskScore.js";

test("clean text scores 0", () => {
  const risk = scoreRisk("We help teams write clearly.", []);
  assert.equal(risk.overall, 0);
  assert.equal(risk.lines.length, 0);
});

test("risky line is ranked first and counted as legal risk", () => {
  const content = "We are friendly.\nThis cream cures acne, guaranteed!!";
  const risk = scoreRisk(content, reviewContent(content));
  assert.ok(risk.lines[0].text.includes("cures"));
  assert.ok(risk.dimensions.find((item) => item.id === "legal").score >= 25);
  assert.ok(risk.overall > 0);
});