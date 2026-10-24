import { useEffect, useState } from "react";

const STYLES = [
  { id: "warm-expert", label: "Warm expert", pitch: 1.08, rate: 0.92 },
  { id: "bold-challenger", label: "Bold challenger", pitch: 0.92, rate: 1.04 },
  { id: "calm-guide", label: "Calm guide", pitch: 1, rate: 0.84 },
];

export default function VoiceActorPreview({ text }) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState("");

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function preview(style) {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.pitch = style.pitch;
    utterance.rate = style.rate;
    utterance.onend = () => setPlaying("");
    utterance.onerror = () => setPlaying("");
    setPlaying(style.id);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying("");
  }

  return (
    <section aria-labelledby="voice-preview-title" className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="voice-preview-title" className="text-sm font-semibold text-[var(--text)]">Voice-Actor Preview</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Listen to the draft in different delivery styles and decide how the tone feels.</p>
        </div>
        {playing && <button type="button" onClick={stop} className="text-xs font-semibold text-[var(--accent-solid)] hover:underline">Stop preview</button>}
      </div>
      {!supported ? (
        <p className="mt-3 text-xs text-amber-700">Speech previews are not supported in this browser.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => preview(style)}
              disabled={!text.trim()}
              aria-pressed={playing === style.id}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {playing === style.id ? `Playing ${style.label}…` : `▶ ${style.label}`}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[10px] leading-4 text-[var(--text-soft)]">Uses speech synthesis on this device. This is a tone preview only—not an approval decision.</p>
    </section>
  );
}
