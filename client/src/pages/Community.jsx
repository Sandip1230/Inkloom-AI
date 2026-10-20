import AppShell from "../components/AppShell.jsx";

const TIPS = [
  {
    title: "Start rough, on purpose",
    body: "The Discover stage works better with an honest one-sentence idea than a polished pitch, it has room to ask better follow-up questions.",
  },
  {
    title: "Read the Challenge stage findings closely",
    body: "This is the self-critique step. If it comes back with nothing, that's usually a sign to push it further, a first draft with zero issues is rare.",
  },
  {
    title: "Treat the brand kit as a draft, not a verdict",
    body: "Everything Brandloom produces is a starting point for a real founder decision, not a final answer.",
  },
];

export default function Community() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Community</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Brandloom was built for the Inkloom x We Code Coders Hackathon. No fake follower counts
          or live chat here, just a few real, useful things.
        </p>

        <div className="mt-8 space-y-4">
          {TIPS.map((tip) => (
            <div key={tip.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm font-medium text-[var(--text)]">{tip.title}</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">{tip.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">
          <p>Found a bug or have feedback? Open an issue on the GitHub repo linked below.</p>
          <a href="https://github.com/Sandip1230/Brandloom-AI" target="_blank" rel="noreferrer" className="mt-2 inline-block text-[var(--accent-solid)] hover:opacity-80">Open GitHub repo →</a>
        </div>
      </div>
    </AppShell>
  );
}