const REVIEW_KEY = "inkloom-reviews";
const GUIDELINE_KEY = "inkloom-guidelines";
const LEGACY_REVIEW_KEY = "brandloom-reviews";
const LEGACY_GUIDELINE_KEY = "brandloom-guidelines";

export function getGuidelines() {
  const stored = localStorage.getItem(GUIDELINE_KEY) || localStorage.getItem(LEGACY_GUIDELINE_KEY);
  return stored ? JSON.parse(stored) : { preferredTerms: "" };
}

export function saveGuidelines(guidelines) {
  localStorage.setItem(GUIDELINE_KEY, JSON.stringify(guidelines));
}

export function listReviews() {
  const stored = localStorage.getItem(REVIEW_KEY) || localStorage.getItem(LEGACY_REVIEW_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveReview(review) {
  const reviews = listReviews();
  const previous = reviews.find((item) => item.id === review.id);
  const revisionHistory = [...(previous?.revisionHistory || [])];
  if (previous && previous.content !== review.content) {
    revisionHistory.unshift({
      content: previous.content,
      findings: previous.findings || [],
      updatedAt: previous.updatedAt,
    });
  }
  const saved = { ...review, revisionHistory, updatedAt: Date.now() };
  const index = reviews.findIndex((item) => item.id === review.id);
  if (index === -1) reviews.unshift(saved);
  else reviews[index] = saved;
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
  return saved;
}

export function createReviewId() {
  return `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
