const REVIEW_LENSES = [
  {
    id: "Brand voice",
    title: "Brand voice",
    description: "Terminology and tone",
    categories: ["Terminology", "Tone"],
    accent: "red",
  },
  {
    id: "Claims",
    title: "Claims & support",
    description: "Promotional wording",
    categories: ["Promotional claim"],
    accent: "amber",
  },
  {
    id: "Accessibility",
    title: "Accessibility",
    description: "Readable, descriptive copy",
    categories: ["Accessibility"],
    accent: "teal",
  },
];

export default function BranchingReviewSummary({ findings, activeCategory, onSelect }) {
  const unmatchedCount = findings.filter(
    (finding) => !REVIEW_LENSES.some((lens) => lens.categories.includes(finding.category)),
  ).length;

  return (
    <section className="review-branches" aria-labelledby="review-branches-title">
      <div className="review-branches__header">
        <div>
          <p className="review-branches__eyebrow">Branching review</p>
          <h3 id="review-branches-title">A few paths to check</h3>
        </div>
        <span className="review-branches__count">{findings.length} signals</span>
      </div>

      <div className="review-branches__grid">
        {REVIEW_LENSES.map((lens) => {
          const count = findings.filter((finding) => lens.categories.includes(finding.category)).length;
          const active = activeCategory === lens.id;
          return (
            <button
              key={lens.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? null : lens.id)}
              className={`review-branch review-branch--${lens.accent}${active ? " is-active" : ""}`}
            >
              <span className="review-branch__topline">
                <span>{lens.description}</span>
                <span className="review-branch__number">{String(count).padStart(2, "0")}</span>
              </span>
              <span className="review-branch__title">{lens.title}</span>
              <span className="review-branch__bar" aria-hidden="true">
                <span style={{ width: `${findings.length ? Math.max(count ? 12 : 0, (count / findings.length) * 100) : 0}%` }} />
              </span>
            </button>
          );
        })}
      </div>
      {unmatchedCount > 0 && <p className="review-branches__note">{unmatchedCount} other signal{unmatchedCount === 1 ? "" : "s"} remain in the full review.</p>}
    </section>
  );
}
