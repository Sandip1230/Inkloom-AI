import { useEffect, useMemo, useState } from "react";

const TABS = ["Palette", "Typography", "Mark", "Imagery", "Avoid"];

// Only fonts in this list are ever requested from Google Fonts. The AI is
// prompted to pick from the same list, but we never trust model output
// enough to build a font-loading URL straight from it - anything outside
// this whitelist just falls back to the browser's default font stack.
export const FONT_WHITELIST = [
  "Sora", "Space Grotesk", "Inter", "Work Sans",
  "Fraunces", "Playfair Display", "Lora", "Source Serif Pro",
  "Baloo 2", "Fredoka", "Nunito", "Quicksand",
  "IBM Plex Mono", "JetBrains Mono", "IBM Plex Sans",
  "Archivo Black", "Bebas Neue", "Archivo", "Manrope",
];

function useGoogleFonts(fontNames) {
  useEffect(() => {
    const valid = fontNames.filter((name) => name && FONT_WHITELIST.includes(name));
    if (valid.length === 0) return;

    const linkId = "brandloom-dynamic-fonts";
    const families = valid
      .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;600;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;

    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [fontNames.join("|")]);
}

export function isValidHex(hex) {
  return typeof hex === "string" && /^#([0-9a-fA-F]{6})$/.test(hex);
}

// Renders an actual logomark from AI-chosen parameters (shape, style, colors).
// The AI decides *what* to draw; the code draws it deterministically as SVG -
// no external image-generation API, so it never fails or stalls during a
// live demo.
export function GeneratedMark({ mark, palette }) {
  const primary = palette?.find((c) => c.role === "primary" && isValidHex(c.hex))?.hex || "#4F46E5";
  const accent = palette?.find((c) => c.role === "accent" && isValidHex(c.hex))?.hex || "#EC4899";
  const shape = mark?.shape || "circle";
  const style = mark?.style || "geometric";
  const letter = (mark?.monogramLetter || "").slice(0, 1).toUpperCase();
  const gradientId = "brandloom-mark-gradient";

  function renderShape() {
    switch (shape) {
      case "hexagon":
        return <polygon points="60,8 104,34 104,86 60,112 16,86 16,34" fill={`url(#${gradientId})`} />;
      case "triangle":
        return <polygon points="60,12 108,100 12,100" fill={`url(#${gradientId})`} />;
      case "wave":
        return <path d="M10 70 Q 35 30 60 70 T 110 70 L 110 110 L 10 110 Z" fill={`url(#${gradientId})`} />;
      case "square":
        return (
          <rect x="14" y="14" width="92" height="92" rx={style === "organic" ? 30 : 14} fill={`url(#${gradientId})`} />
        );
      case "circle":
      default:
        return <circle cx="60" cy="60" r="50" fill={`url(#${gradientId})`} />;
    }
  }

  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Generated brand mark">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      {renderShape()}
      {style === "monogram" && letter && (
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fontSize="46" fontWeight="700" fill="white">
          {letter}
        </text>
      )}
    </svg>
  );
}

export default function VisualDirection({ direction }) {
  const [tab, setTab] = useState(TABS[0]);

  const typography = direction?.typography;
  // Old sessions saved before this upgrade stored typography as a plain
  // string - keep rendering those correctly instead of breaking on them.
  const isStructuredTypography = typography && typeof typography === "object";
  const headingFont = isStructuredTypography ? typography.headingFont : null;
  const bodyFont = isStructuredTypography ? typography.bodyFont : null;

  useGoogleFonts(useMemo(() => [headingFont, bodyFont], [headingFont, bodyFont]));

  if (!direction) {
    return (
      <p className="text-sm text-[var(--text-soft)]">
        Typography, color, and imagery guidance will appear here.
      </p>
    );
  }

  const palette = Array.isArray(direction.colorPalette) ? direction.colorPalette : [];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "whitespace-nowrap px-3 py-2 text-sm transition-colors " +
              (tab === t
                ? "border-b-2 border-[var(--accent-solid)] font-medium text-[var(--text)]"
                : "text-[var(--text-soft)]")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text)]">
        {tab === "Palette" &&
          (palette.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {palette.map((color, index) => (
                <div key={index} className="overflow-hidden rounded-lg border border-[var(--border)]">
                  <div className="h-16 w-full" style={{ backgroundColor: isValidHex(color.hex) ? color.hex : "#94a3b8" }} />
                  <div className="p-2">
                    <p className="text-xs font-semibold text-[var(--text)]">{color.name || color.role}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-soft)]">{color.role}</p>
                    <p className="text-[10px] text-[var(--text-soft)]">
                      {isValidHex(color.hex) ? color.hex.toUpperCase() : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            "—"
          ))}

        {tab === "Typography" &&
          (isStructuredTypography ? (
            <div className="space-y-3">
              <p
                style={{ fontFamily: FONT_WHITELIST.includes(headingFont) ? `"${headingFont}", sans-serif` : undefined }}
                className="text-2xl font-semibold"
              >
                {headingFont || "Heading font"}
              </p>
              <p style={{ fontFamily: FONT_WHITELIST.includes(bodyFont) ? `"${bodyFont}", sans-serif` : undefined }} className="text-sm">
                {bodyFont ? `${bodyFont} — the quick brown fox jumps over the lazy dog.` : "Body font"}
              </p>
              {typography.pairingRationale && (
                <p className="text-xs italic text-[var(--text-soft)]">{typography.pairingRationale}</p>
              )}
            </div>
          ) : (
            typography || "—"
          ))}

        {tab === "Mark" && (
          <div className="flex items-center gap-4">
            <GeneratedMark mark={direction.mark} palette={palette} />
            <div className="text-xs text-[var(--text-soft)]">
              {direction.mark?.rationale || "A starting shape for the logomark — refine further in a design tool."}
            </div>
          </div>
        )}

        {tab === "Imagery" && (direction.imageryStyle || "—")}

        {tab === "Avoid" &&
          (direction.conceptsToAvoid?.length ? (
            <ul className="list-disc space-y-1 pl-4">
              {direction.conceptsToAvoid.map((concept, index) => (
                <li key={index}>{concept}</li>
              ))}
            </ul>
          ) : (
            "—"
          ))}
      </div>
    </div>
  );
}