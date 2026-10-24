import { useId } from "react";
import {
  AVATAR_FRAMES,
  DEFAULT_AVATAR_STYLE,
  getInitial,
  isCustomPhoto,
  parseAvatarValue,
} from "../lib/profileStore.js";

// Small decorative drawings that sit behind / beside the letter.
// They are drawn in a 100 x 100 box that is stretched over the circle.
function Decoration({ styleId, uid }) {
  switch (styleId) {
    case "sunset-heart":
      return (
        <path
          d="M74 66.5c-3.2-3.1-7.2-1.6-7.2 1.8 0 3 3.6 5.4 7.2 8 3.6-2.6 7.2-5 7.2-8 0-3.4-4-4.9-7.2-1.8Z"
          fill="none"
          stroke="#ff4f93"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      );
    case "leaf-noir":
      return (
        <g fill="#f08a5d" stroke="none">
          <path d="M23 76c-2-14 0-30 9-44" fill="none" stroke="#f08a5d" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M31 36c-6-1-9-5-9-9 6 0 9 4 9 9Z" />
          <path d="M26 50c-6 0-10-3-11-8 6-1 10 3 11 8Z" />
          <path d="M33 46c5-3 6-8 5-12-5 2-7 7-5 12Z" />
          <path d="M24 64c-6 0-10-3-11-8 6-1 10 3 11 8Z" />
          <path d="M28 60c5-3 7-8 6-12-5 2-8 7-6 12Z" />
        </g>
      );
    case "blush-script":
      return (
        <path
          d="M70 66c-2.4-2.4-5.4-1.2-5.4 1.4 0 2.3 2.7 4.1 5.4 6 2.7-1.9 5.4-3.7 5.4-6 0-2.6-3-3.8-5.4-1.4Z"
          fill="#2a1a24"
        />
      );
    case "eclipse":
      return (
        <g>
          <path d="M19 66C8 46 16 22 36 12 22 28 24 52 40 70" fill="none" stroke={`url(#${uid}-eclipse-grad)`} strokeWidth="5" strokeLinecap="round" />
          <path d="M40 90C60 96 84 84 90 64 76 80 52 82 40 78" fill="none" stroke={`url(#${uid}-eclipse-grad)`} strokeWidth="4" strokeLinecap="round" opacity="0.9" />
          <path d="M77 30l2.2 5.3 5.3 2.2-5.3 2.2L77 45l-2.2-5.3-5.3-2.2 5.3-2.2L77 30Z" fill="#ff9a7a" />
          <defs>
            <linearGradient id={`${uid}-eclipse-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff9a52" />
              <stop offset="1" stopColor="#f0368a" />
            </linearGradient>
          </defs>
        </g>
      );
    case "blossom":
      return (
        <g>
          <path d="M82 30c4 12 2 28-6 42" fill="none" stroke="#2b2320" strokeWidth="1.4" strokeLinecap="round" />
          <g fill="#f4a1b8">
            <circle cx="80" cy="30" r="5" />
            <circle cx="85" cy="35" r="5" />
            <circle cx="79" cy="38" r="5" />
            <circle cx="76" cy="50" r="4.4" />
            <circle cx="81" cy="54" r="4.4" />
            <circle cx="75" cy="58" r="4.4" />
          </g>
          <g fill="#e06f93">
            <circle cx="81" cy="35" r="1.8" />
            <circle cx="77" cy="54" r="1.6" />
          </g>
        </g>
      );
    case "aurora":
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}-aurora-grad`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7a2c9e" />
              <stop offset="0.5" stopColor="#f0568a" />
              <stop offset="1" stopColor="#ff9a52" />
            </linearGradient>
          </defs>
          <path d="M2 78c14-12 26 4 40-4s26-18 56-8v36H2Z" fill={`url(#${uid}-aurora-grad)`} opacity="0.85" />
          <path d="M2 88c16-8 28 4 44-2s30-10 52-4" fill="none" stroke="#ffd0a0" strokeWidth="1.2" opacity="0.7" />
          <path d="M76 24l1.8 4.2 4.2 1.8-4.2 1.8L76 36l-1.8-4.2-4.2-1.8 4.2-1.8L76 24Z" fill="#fff" />
        </g>
      );
    case "lilac":
      return null;
    case "brush-ring":
      return (
        <path
          d="M84 30C70 8 36 6 20 26 6 44 12 74 36 86c22 10 50 0 56-26"
          fill="none"
          stroke="#f0368a"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
      );
    case "lotus":
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}-lotus-a`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffb06b" />
              <stop offset="1" stopColor="#f0568a" />
            </linearGradient>
            <linearGradient id={`${uid}-lotus-b`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#c94fb0" />
              <stop offset="1" stopColor="#ff7a6b" />
            </linearGradient>
          </defs>
          <path d="M50 14C66 26 70 46 50 70 30 46 34 26 50 14Z" fill={`url(#${uid}-lotus-a)`} opacity="0.8" transform="rotate(-38 50 70)" />
          <path d="M50 22C64 34 66 52 50 74 34 52 36 34 50 22Z" fill={`url(#${uid}-lotus-b)`} opacity="0.7" transform="rotate(30 50 74)" />
          <path d="M82 24l1.6 3.8 3.8 1.6-3.8 1.6L82 35l-1.6-4-3.8-1.6 3.8-1.6L82 24Z" fill="#ff9a7a" />
        </g>
      );
    case "line-sprig":
      return (
        <g fill="none" stroke="#f08a9b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 86c-1-8 1-14 5-20" />
          <path d="M33 74c-5-1-8-4-8-8 5 0 8 3 8 8Z" />
          <path d="M31 82c4-3 5-6 4-10-4 2-6 6-4 10Z" />
          <path d="M33 66c5-1 7-5 6-9-5 1-7 5-6 9Z" />
        </g>
      );
    case "ink-sparkle":
      return (
        <g>
          <path d="M76 24l2 4.8 4.8 2-4.8 2-2 4.8-2-4.8-4.8-2 4.8-2 2-4.8Z" fill="#f48a5a" />
          <path d="M82 44l1.2 2.9 2.9 1.2-2.9 1.2L82 52l-1.2-2.7-2.9-1.2 2.9-1.2L82 44Z" fill="#f48a5a" />
          <path d="M18 78C34 70 48 80 70 66" fill="none" stroke="#f6a4bd" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        </g>
      );
    case "smoke":
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}-smoke-a`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff9a52" />
              <stop offset="0.55" stopColor="#d4408f" />
              <stop offset="1" stopColor="#3b2a78" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${uid}-smoke-a)`} />
          <path d="M-4 30C20 8 40 40 62 22s30-6 42 6V-4H-4Z" fill="#2a1d4d" opacity="0.7" />
          <path d="M-4 96C22 70 44 94 66 78s28-14 40-2v30H-4Z" fill="#ff7a4c" opacity="0.55" />
          <path d="M10 58c18-14 34 8 54-6s24-6 34 2" fill="none" stroke="#ffd2b0" strokeWidth="1.4" opacity="0.55" />
        </g>
      );
    case "rose-script":
      return (
        <path
          d="M73 64c-2.4-2.4-5.4-1.2-5.4 1.4 0 2.3 2.7 4.1 5.4 6 2.7-1.9 5.4-3.7 5.4-6 0-2.6-3-3.8-5.4-1.4Z"
          fill="#d0607f"
        />
      );
    case "crown":
      return (
        <g>
          <path d="M40 20l4.5 7 5.5-8 5.5 8 4.5-7-1.4 10H41.4L40 20Z" fill="none" stroke="#f4a8c2" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="40" cy="19" r="1.8" fill="#f4a8c2" />
          <circle cx="50" cy="17" r="1.8" fill="#f4a8c2" />
          <circle cx="60" cy="19" r="1.8" fill="#f4a8c2" />
        </g>
      );
    case "dusk":
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}-dusk-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8a3d86" />
              <stop offset="0.5" stopColor="#f0568a" />
              <stop offset="1" stopColor="#ffa66b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${uid}-dusk-sky)`} />
          <circle cx="80" cy="44" r="6" fill="#ffd9a0" />
          <path d="M0 100V70l18-18 14 14 16-22 18 24 12-10 22 24v18Z" fill="#2b1838" />
          <path d="M22 28l3 -2 3 2M34 20l2.6 -1.8 2.6 1.8" fill="none" stroke="#2b1838" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

// How each frame looks. "inset" = how much of the circle (in % per side)
// the ring + the gap take, so the avatar inside shrinks a little - like Instagram.
const STORY_STOPS = [
  ["0", "#feda75"],
  ["0.25", "#fa7e1e"],
  ["0.5", "#d62976"],
  ["0.75", "#962fbf"],
  ["1", "#4f5bd5"],
];

const FRAME_ART = {
  story: { kind: "gradient", inset: 8.5, stops: STORY_STOPS },
  live: { kind: "gradient", inset: 8.5, spin: true, stops: STORY_STOPS },
  ember: {
    kind: "gradient",
    inset: 8.5,
    glow: "#ff8a4c",
    stops: [["0", "#ffc27a"], ["0.5", "#ff7a30"], ["1", "#e8501a"]],
  },
  neon: {
    kind: "gradient",
    inset: 8.5,
    glow: "#22d3ee",
    stops: [["0", "#22d3ee"], ["0.5", "#7c3aed"], ["1", "#f0abfc"]],
  },
  gold: {
    kind: "gradient",
    inset: 8.5,
    stops: [["0", "#fff1b8"], ["0.35", "#e8b84a"], ["0.7", "#b8863b"], ["1", "#f6d365"]],
  },
  rose: {
    kind: "gradient",
    inset: 8.5,
    stops: [["0", "#ffb3c9"], ["0.5", "#f0568a"], ["1", "#c2185b"]],
  },
  aurora: {
    kind: "gradient",
    inset: 8.5,
    stops: [["0", "#34d399"], ["0.35", "#22d3ee"], ["0.7", "#6366f1"], ["1", "#c026d3"]],
  },
  double: { kind: "double", inset: 10, outer: "#ff8a4c", inner: "#f0568a" },
  dashed: { kind: "dashed", inset: 8.5, color: "#ff8a4c" },
};

// The ring itself is an SVG, so the gap between ring and photo stays transparent.
function FrameRing({ art, uid, size, reduceMotion }) {
  const gradientId = `${uid}-grad`;
  const glowPx = Math.max(2, Math.round(size * 0.07));

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
        filter: art.glow ? `drop-shadow(0 0 ${glowPx}px ${art.glow})` : undefined,
      }}
    >
      {art.kind === "double" && (
        <>
          <circle cx="50" cy="50" r="48.75" fill="none" stroke={art.outer} strokeWidth="2.5" />
          <circle cx="50" cy="50" r="44.5" fill="none" stroke={art.inner} strokeWidth="2.5" />
        </>
      )}

      {art.kind === "dashed" && (
        <circle cx="50" cy="50" r="47.5" fill="none" stroke={art.color} strokeWidth="5" strokeDasharray="12.65 6" />
      )}

      {art.kind === "gradient" && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              {art.stops.map(([offset, color]) => (
                <stop key={offset} offset={offset} stopColor={color} />
              ))}
              {art.spin && !reduceMotion && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="rotate"
                  from="0 0.5 0.5"
                  to="360 0.5 0.5"
                  dur="3s"
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="47.5" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" />
        </>
      )}
    </svg>
  );
}

// The round avatar itself: an uploaded photo, or a lettered style.
function AvatarCore({ name, styleId, size, className = "", title, frameLabel }) {
  const initial = getInitial(name);
  const uid = `pf${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const custom = isCustomPhoto(styleId);
  const baseLabel = title || (custom ? "Your profile photo" : `Profile photo: letter ${initial}`);

  return (
    <span
      className={`pf-avatar pf-avatar--${custom ? "custom" : styleId} ${className}`}
      style={{ "--pf-size": `${size}px` }}
      role="img"
      aria-label={frameLabel ? `${baseLabel}, ${frameLabel} frame` : baseLabel}
    >
      {custom ? (
        <img
          src={styleId}
          alt=""
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
      ) : (
        <>
          <svg className="pf-avatar__art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <Decoration styleId={styleId} uid={uid} />
          </svg>
          <span className="pf-avatar__letter" aria-hidden="true">{initial}</span>
        </>
      )}
    </span>
  );
}

// styleId can be a style id, an uploaded photo (data URL), or either of them
// with a frame, e.g. "frame:story|sunset-heart".
export default function ProfileAvatar({ name, styleId = DEFAULT_AVATAR_STYLE, size = 32, className = "", title }) {
  const ringUid = `pf${useId().replace(/[^a-zA-Z0-9]/g, "")}r`;
  const { base, frame } = parseAvatarValue(styleId);
  const art = FRAME_ART[frame];

  if (!art) {
    return <AvatarCore name={name} styleId={base} size={size} className={className} title={title} />;
  }

  const innerSize = Math.round(size * (1 - (art.inset * 2) / 100));
  const frameLabel = AVATAR_FRAMES.find((item) => item.id === frame)?.label;
  const reduceMotion =
    typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  return (
    <span
      className={`pf-framed pf-framed--${frame} ${className}`}
      style={{
        position: "relative",
        display: "inline-grid",
        placeItems: "center",
        width: `${size}px`,
        height: `${size}px`,
        flex: `0 0 ${size}px`,
        borderRadius: "50%",
      }}
    >
      <FrameRing art={art} uid={ringUid} size={size} reduceMotion={reduceMotion} />
      <AvatarCore name={name} styleId={base} size={innerSize} title={title} frameLabel={frameLabel} />
    </span>
  );
}