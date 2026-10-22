import assert from "node:assert/strict";
import test from "node:test";
import { applySuggestion, createBrandSafeRemixes, reviewContent } from "./governance.js";

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

test("creates an on-brand remix for every flagged occurrence and rechecks it", () => {
  const content = "Users chose the best service. Users recommend it.";
  const rules = { preferredTerms: "users -> customers" };
  const findings = reviewContent(content, rules);
  const remix = createBrandSafeRemixes(content, findings, rules).find((candidate) => candidate.id === "on-brand");

  assert.equal(remix.content, "customers chose the high-quality service. customers recommend it.");
  assert.deepEqual(remix.remainingFindings, []);
  assert.deepEqual(remix.clearedCategories, ["Promotional claim", "Terminology"]);
});

test("creates accessible and concise remixes only for supported deterministic edits", () => {
  const longSentence = "We share useful product information with customers every week and provide clear examples and practical steps for teams that want to understand each update before deciding; readers can use these steps to get started today and confidently apply the guidance to their next project.";
  const findings = reviewContent(longSentence);
  const remixes = createBrandSafeRemixes(longSentence, findings);
  const accessible = remixes.find((candidate) => candidate.id === "accessible");
  assert.ok(accessible);
  assert.equal(accessible.remainingFindings.some((finding) => finding.id === "accessibility-long-sentence"), false);

  const wordy = "In order to help, we act at this point in time.";
  const concise = createBrandSafeRemixes(wordy, reviewContent(wordy)).find((candidate) => candidate.id === "concise");
  assert.equal(concise.content, "To help, we act now.");
  assert.equal(createBrandSafeRemixes("Click here.", reviewContent("Click here.")).length, 0);
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
