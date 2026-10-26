// Labeled sample drafts. "expected" lists what a human reviewer would want flagged.
// Samples with a knownIssue describe real gaps in today's automated checks.
export const GOLDEN_SET = [
  {
    id: "clean-plain",
    title: "Clean draft with no issues",
    content: "Our team publishes a weekly guide for small business owners.",
    expected: [],
  },
  {
    id: "claim-best-guarantees",
    title: "Two promotional claims",
    content: "Our product is the best and guarantees results.",
    expected: [
      { check: "claim", excerpt: "best" },
      { check: "claim", excerpt: "guarantees" },
    ],
  },
  {
    id: "claim-risk-free-never-fail",
    title: "Risk-free and never-fail claims",
    content: "Try our risk-free trial today. We never fail to deliver.",
    expected: [
      { check: "claim", excerpt: "risk-free" },
      { check: "claim", excerpt: "never fail" },
    ],
  },
  {
    id: "claim-capitalized",
    title: "Capitalized claim wording",
    content: "Guaranteed delivery on every order.",
    expected: [{ check: "claim", excerpt: "Guaranteed" }],
  },
  {
    id: "claim-hundred-percent",
    title: "Percentage claim before a space",
    content: "Get 100% accuracy with every report.",
    expected: [{ check: "claim", excerpt: "100%" }],
    knownIssue: "The claim pattern ends with a word boundary, which does not match after a percent sign.",
  },
  {
    id: "claim-synonyms",
    title: "Superlatives that use other words",
    content: "Unbeatable quality and unmatched speed for your team.",
    expected: [
      { check: "claim", excerpt: "Unbeatable" },
      { check: "claim", excerpt: "unmatched" },
    ],
    knownIssue: "Only a fixed list of claim words is checked; synonyms are not detected.",
  },
  {
    id: "claim-false-positive-best-practices",
    title: "The word best used in a neutral phrase",
    content: "Read our best practices guide for onboarding.",
    expected: [],
    knownIssue: "The word best is flagged even when it is not a promotional claim.",
  },
  {
    id: "term-users",
    title: "Preferred terminology",
    content: "Users love it. Our users return.",
    rules: { preferredTerms: "users -> customers" },
    expected: [
      { check: "terminology", excerpt: "Users" },
      { check: "terminology", excerpt: "users" },
    ],
  },
  {
    id: "term-word-boundary",
    title: "Preferred term inside other words",
    content: "Superusers and user guides help every team.",
    rules: { preferredTerms: "users -> customers" },
    expected: [],
  },
  {
    id: "link-text",
    title: "Non-descriptive link text",
    content: "Click here to learn more about pricing.",
    expected: [
      { check: "link-text", excerpt: "Click here" },
      { check: "link-text", excerpt: "learn more" },
    ],
  },
  {
    id: "tone-all-caps",
    title: "Shouting tone",
    content: "LIMITED OFFER, ACT TODAY for better results.",
    expected: [{ check: "all-caps" }],
  },
  {
    id: "tone-all-caps-short-words",
    title: "Shouting made of short capital words",
    content: "ACT NOW and SAVE BIG on every order.",
    expected: [{ check: "all-caps" }],
    knownIssue: "Only capital words of four or more letters are counted, so short shouted words are missed.",
  },
  {
    id: "tone-acronyms",
    title: "Legitimate acronyms",
    content: "NASA, UNICEF and NOAA publish open climate data.",
    expected: [],
    knownIssue: "Real acronyms count as capital words and can be flagged as shouting.",
  },
  {
    id: "long-sentence",
    title: "Very long sentence",
    content: "Our platform brings together every document, approval, comment, revision and reminder that a busy marketing team needs so that nobody has to search through scattered folders, old email threads or private chats before publishing a single message.",
    expected: [{ check: "long-sentence" }],
  },
];