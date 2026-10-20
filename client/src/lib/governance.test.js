import assert from "node:assert/strict";
import test from "node:test";
import { applySuggestion, reviewContent } from "./governance.js";

test("flags unsupported promotional claims and suggests cautious wording", () => {
  const findings = reviewContent("Our product is the best and guarantees results.");
  assert.equal(findings.filter((finding) => finding.category === "Promotional claim").length, 2);
  assert.match(findings[0].suggestion, /approved source/);
});

test("applies a preferred term only to the flagged occurrence", () => {
  const findings = reviewContent("Users trust us. Users return.", { preferredTerms: "users -> customers" });
  assert.equal(findings.length, 2);
  assert.equal(applySuggestion("Users trust us. Users return.", findings[0]), "customers trust us. Users return.");
});

test("identifies accessibility and tone signals", () => {
  const findings = reviewContent("Click here. BUY NOW!!! THIS IS FREE.");
  assert.ok(findings.some((finding) => finding.category === "Accessibility"));
  assert.ok(findings.some((finding) => finding.category === "Tone"));
});

test("does not produce findings for an empty or neutral draft", () => {
  assert.deepEqual(reviewContent(""), []);
  assert.deepEqual(reviewContent("Our team shares product updates every Friday."), []);
});
