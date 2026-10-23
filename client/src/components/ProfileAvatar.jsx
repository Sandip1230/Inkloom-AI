import { useId } from "react";
import { DEFAULT_AVATAR_STYLE, getInitial } from "../lib/profileStore.js";

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

export default function ProfileAvatar({ name, styleId = DEFAULT_AVATAR_STYLE, size = 32, className = "", title }) {
  const initial = getInitial(name);
  const uid = `pf${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span
      className={`pf-avatar pf-avatar--${styleId} ${className}`}
      style={{ "--pf-size": `${size}px` }}
      role="img"
      aria-label={title || `Profile photo: letter ${initial}`}
    >
      <svg className="pf-avatar__art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <Decoration styleId={styleId} uid={uid} />
      </svg>
      <span className="pf-avatar__letter" aria-hidden="true">{initial}</span>
    </span>
  );
}