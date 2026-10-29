// Estimates the chance a draft is approved, learned from past decisions
// (status "Approved" vs "Changes requested") in this workspace or browser.
// Bernoulli naive Bayes with Laplace smoothing. Pure functions.

export const MIN_HISTORY = 5;
export const GOOD_HISTORY = 15;

const countBucket = (count) => (count === 0 ? "n:0" : count <= 2 ? "n:1-2" : "n:3+");

export function featuresOf(review) {
  const set = new Set();
  const findings = Array.isArray(review?.findings) ? review.findings : [];
  findings.forEach((finding) => {
    if (finding?.category) set.add(`cat:${finding.category}`);
  });
  if (review?.contentType) set.add(`type:${review.contentType}`);
  set.add(countBucket(findings.length));
  return set;
}

function labelOf(review) {
  if (review?.status === "Approved") return 1;
  if (review?.status === "Changes requested") return 0;
  return null;
}

function describe(feature) {
  if (feature.startsWith("cat:")) return `“${feature.slice(4)}” findings`;
  if (feature.startsWith("type:")) return `${feature.slice(5)} drafts`;
  const names = {
    "n:0": "drafts with no findings",
    "n:1-2": "drafts with 1-2 findings",
    "n:3+": "drafts with 3 or more findings",
  };
  return names[feature] || feature;
}

export function predictApproval(draft, reviews, { excludeId } = {}) {
  const history = (reviews || [])
    .filter((review) => review && review.id !== excludeId)
    .map((review) => ({ label: labelOf(review), features: featuresOf(review) }))
    .filter((item) => item.label !== null);

  const total = history.length;
  const approved = history.filter((item) => item.label === 1).length;
  const rejected = total - approved;

  if (total < MIN_HISTORY || approved === 0 || rejected === 0) {
    return { ready: false, total, approved, rejected, needed: MIN_HISTORY };
  }

  const vocabulary = new Set();
  history.forEach((item) => item.features.forEach((feature) => vocabulary.add(feature)));
  const draftFeatures = featuresOf(draft);

  let logOdds = Math.log((approved + 1) / (rejected + 1));
  const reasons = [];

  for (const feature of vocabulary) {
    const withFeature = history.filter((item) => item.features.has(feature));
    const approvedWith = withFeature.filter((item) => item.label === 1).length;
    const rejectedWith = withFeature.length - approvedWith;
    const pApproved = (approvedWith + 1) / (approved + 2);
    const pRejected = (rejectedWith + 1) / (rejected + 2);
    const present = draftFeatures.has(feature);
    const contribution = present
      ? Math.log(pApproved / pRejected)
      : Math.log((1 - pApproved) / (1 - pRejected));
    logOdds += contribution;

    if (present && withFeature.length >= 2) {
      reasons.push({
        feature,
        contribution,
        direction: contribution >= 0 ? "up" : "down",
        text: `Past ${describe(feature)}: approved ${approvedWith} of ${withFeature.length} times`,
      });
    }
  }

  const probability = 1 / (1 + Math.exp(-logOdds));
  const percent = Math.min(95, Math.max(5, Math.round(probability * 100)));

  return {
    ready: true,
    percent,
    total,
    approved,
    rejected,
    confidence: total >= GOOD_HISTORY ? "Fair" : "Low",
    reasons: reasons.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 3),
  };
}