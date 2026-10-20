export default function PersonalityBoard({
  traits = [],
  traitsToAvoid = [],
  namingDirections = [],
  voice,
  tagline,
  selectedName,
  onSelectName,
}) {
  if (!traits.length) {
    return <p className="text-sm text-[var(--text-soft)]">Personality traits will appear here.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
          Personality Traits
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {traits.map((trait) => (
            <span
              key={trait}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)]"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {traitsToAvoid.length > 0 && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
            Traits to Avoid
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {traitsToAvoid.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-soft)] line-through"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {voice && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
            Brand Voice
          </span>
          <p className="mt-2 text-sm text-[var(--text)]">{voice}</p>
        </div>
      )}

      {namingDirections.length > 0 && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
            Naming Directions — pick one to carry forward
          </span>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            The Challenge and Deliver stages flag an unresolved brand identity until a name is
            picked here.
          </p>
          <ul className="mt-2 space-y-2">
            {namingDirections.map((direction, index) => {
              // Directions look like "Name - rationale text". Pull out just the
              // name so it can be compared/stored/shown on its own elsewhere.
              const name = direction.split(/[-–—]/)[0].trim();
              const isSelected = selectedName === name;
              return (
                <li key={`${direction}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelectName?.(name)}
                    className={
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors " +
                      (isSelected
                        ? "border-[var(--accent-solid)] bg-[var(--accent-solid)]/10 text-[var(--text)]"
                        : "border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-solid)]/60")
                    }
                  >
                    <span className="mr-2">{isSelected ? "●" : "○"}</span>
                    {direction}
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedName && (
            <p className="mt-2 text-sm text-[var(--accent-solid)]">
              Selected: <strong>{selectedName}</strong>
            </p>
          )}
        </div>
      )}

      {tagline && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
            Tagline
          </span>
          <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)]">
            "{tagline}"
          </p>
        </div>
      )}
    </div>
  );
}