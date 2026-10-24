import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function LoadBar({ duration = 2000 }) {
  const { theme } = useTheme();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const step = 40;
    const id = setInterval(() => {
      setPercent((p) => Math.min(p + (100 * step) / duration, 100));
    }, step);
    return () => clearInterval(id);
  }, [duration]);

  return (
    <div className={`lb-wrap ${theme === "dark" ? "is-dark" : "is-light"}`}>
      <style>{`
        /* ---------- LIGHT THEME ---------- */
        .lb-wrap.is-light {
          --lb-bg: radial-gradient(circle at 50% 40%, #ffffff 0%, #ececf1 75%);
          --lb-ring-a: #6941bd;
          --lb-ring-b: #a575e6;
          --lb-logo: #1c1b22;
          --lb-title: #6941bd;
          --lb-track: rgba(20, 20, 40, 0.10);
          --lb-fill: linear-gradient(90deg, #6941bd, #a575e6);
          --lb-glow: rgba(105, 65, 189, 0.45);
          --lb-percent: #4a4768;
        }
        /* ---------- DARK THEME (black + orange) ---------- */
        .lb-wrap.is-dark {
          --lb-bg: radial-gradient(circle at 50% 40%, #1a0e05 0%, #000000 70%);
          --lb-ring-a: #ff9a52;
          --lb-ring-b: #e86e32;
          --lb-logo: #ffffff;
          --lb-title: #ff9a52;
          --lb-track: rgba(255, 255, 255, 0.12);
          --lb-fill: linear-gradient(90deg, #e86e32, #ff9a52);
          --lb-glow: rgba(255, 138, 67, 0.6);
          --lb-percent: #ffb27a;
        }

        .lb-wrap {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          background: var(--lb-bg);
        }
        .lb-logo-box { position: relative; width: 110px; height: 110px; display: grid; place-items: center; }
        .lb-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: var(--lb-ring-a);
          border-right-color: var(--lb-ring-b);
          animation: lb-spin 1s linear infinite;
        }
        .lb-ring2 {
          position: absolute; inset: 12px; border-radius: 50%;
          border: 2px solid transparent;
          border-bottom-color: var(--lb-ring-b);
          border-left-color: var(--lb-ring-a);
          animation: lb-spin 1.6s linear infinite reverse;
        }
        .lb-logo {
          font-size: 34px; font-weight: 800; color: var(--lb-logo);
          font-family: system-ui, sans-serif;
          animation: lb-pulse 1.4s ease-in-out infinite;
        }
        .lb-title {
          font-family: system-ui, sans-serif;
          letter-spacing: 6px; font-size: 14px; color: var(--lb-title);
          text-transform: uppercase;
        }
        .lb-bar-box { width: 320px; max-width: 78vw; }
        .lb-bar {
          height: 8px; border-radius: 999px;
          background: var(--lb-track);
          overflow: hidden;
        }
        .lb-fill {
          height: 100%; width: 0%;
          border-radius: 999px;
          background: var(--lb-fill);
          box-shadow: 0 0 16px var(--lb-glow);
          animation: lb-grow var(--lb-duration) linear forwards;
        }
        .lb-percent {
          margin-top: 12px; text-align: center;
          font-family: monospace; font-size: 13px; color: var(--lb-percent);
        }
        @keyframes lb-spin { to { transform: rotate(360deg); } }
        @keyframes lb-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes lb-grow { from { width: 0%; } to { width: 100%; } }
      `}</style>

      <div className="lb-logo-box">
        <div className="lb-ring" />
        <div className="lb-ring2" />
        <div className="lb-logo">IL</div>
      </div>

      <div className="lb-title">Inkloom AI</div>

      <div className="lb-bar-box">
        <div className="lb-bar">
          <div className="lb-fill" style={{ "--lb-duration": `${duration}ms` }} />
        </div>
        <div className="lb-percent">{Math.floor(percent)}%</div>
      </div>
    </div>
  );
}