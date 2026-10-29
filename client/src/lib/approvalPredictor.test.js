import test from "node:test";
import assert from "node:assert/strict";
import { predictApproval } from "./approvalPredictor.js";

let counter = 0;
const make = (status, findings) => ({ id: `r${counter += 1}`, status, contentType: "Blog", findings });
const claim = { category: "Promotional claim" };

test("needs enough decided reviews", () => {
  assert.equal(predictApproval({ findings: [] }, [make("Approved", [])]).ready, false);
});

test("drafts with claims score lower than clean drafts", () => {
  const history = [
    ...Array.from({ length: 6 }, () => make("Approved", [])),
    ...Array.from({ length: 6 }, () => make("Changes requested", [claim, claim])),
  ];
  const clean = predictApproval({ contentType: "Blog", findings: [] }, history);
  const risky = predictApproval({ contentType: "Blog", findings: [claim] }, history);
  assert.ok(clean.percent > risky.percent);
});