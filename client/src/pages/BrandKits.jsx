import { useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getGuidelines, saveGuidelines } from "../lib/reviewStore.js";

export default function BrandKits() {
  const [guidelines, setGuidelines] = useState(() => getGuidelines());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSave(event) {
    event.preventDefault();
    try {
      saveGuidelines(guidelines);
      setSaved(true);
      setError("");
    } catch (saveError) {
      setError(`Could not save guidelines in this browser: ${saveError.message}`);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-solid)]">Governance workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">Brand guidelines</h1>
        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
          Start with approved terminology. Inkloom applies these substitutions during text review and keeps the rule set in this browser.
        </p>

        <form onSubmit={handleSave} className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <label htmlFor="preferred-terms" className="text-sm font-semibold text-[var(--text)]">Preferred terminology</label>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Enter one disallowed or outdated term followed by its approved replacement per line. Separate the terms with <code className="rounded bg-[var(--surface-2)] px-1">→</code> or <code className="rounded bg-[var(--surface-2)] px-1">-&gt;</code>.</p>
          <textarea
            id="preferred-terms"
            value={guidelines.preferredTerms || ""}
            onChange={(event) => {
              setGuidelines((current) => ({ ...current, preferredTerms: event.target.value }));
              setSaved(false);
            }}
            rows={8}
            placeholder={"users → customers\ncheap → accessible"}
            className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)] focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p role={error ? "alert" : "status"} className={"text-xs " + (error ? "text-rose-600" : "text-[var(--text-soft)]")}>
              {error || (saved ? "Guidelines saved in this browser." : "Only the preferred-term rules are currently checked automatically.")}
            </p>
            <button type="submit" className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
              Save guidelines
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-semibold text-[var(--text)]">Prototype limitations</h2>
          <p className="mt-1.5 text-sm leading-5 text-[var(--text-soft)]">
            Approved facts, source documents, reusable visual assets, role-based access and shared team libraries are not connected yet. Do not treat automated findings as factual verification or legal advice.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
