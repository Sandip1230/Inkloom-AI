export default function PositionCard({ position }) {
  if (!position) {
    return <p className="text-sm text-[var(--text-soft)]">Positioning results will appear here.</p>;
  }

  const fields = [
    { label: "Category", value: position.category },
    { label: "Differentiator", value: position.differentiator },
    { label: "Value proposition", value: position.valueProposition },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent-solid)]">
            {field.label}
          </span>
          <p className="mt-1 text-sm text-[var(--text)]">{field.value}</p>
        </div>
      ))}
    </div>
  );
}