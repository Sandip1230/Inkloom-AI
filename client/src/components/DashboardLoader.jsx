import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

const TIME = 3000; // 3 second

const MESSAGES = [
  "Signing you in...",
  "Loading your workspace...",
  "Almost there...",
];

export default function DashboardLoader() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => navigate("/workflow", { replace: true }), TIME);
    const step = 40;
    const counter = setInterval(() => {
      setPercent((p) => Math.min(p + (100 * step) / TIME, 100));
    }, step);
    return () => {
      clearTimeout(timer);
      clearInterval(counter);
    };
  }, [navigate]);

  const message = MESSAGES[Math.min(Math.floor(percent / 34), MESSAGES.length - 1)];

  return (
    <div className={`dl-wrap ${theme === "dark" ? "is-dark" : "is-light"}`}>
      <style>{`
        /* ---------- LIGHT THEME ---------- */
        .dl-wrap.is-light {
          --dl-bg: radial-gradient(circle at 50% 35%, #ffffff 0%, #e3f2f1 75%);
          --dl-dot: linear-gradient(135deg, #0e9aa7, #2f6fe4);
          --dl-glow: rgba(20, 184, 166, 0.45);
          --dl-msg: #12272b;
          --dl-track: rgba(20, 20, 40, 0.10);
          --dl-fill: linear-gradient(90deg, #0e9aa7, #2f6fe4);
          --dl-percent: #3f6064;
        }
        /* ---------- DARK THEME (black + orange) ---------- */
        .dl-wrap.is-dark {
          --dl-bg: radial-gradient(circle at 50% 35%, #1a0e05 0%, #000000 75%);
          --dl-dot: linear-gradient(135deg, #ff9a52, #e86e32);
          --dl-glow: rgba(255, 138, 67, 0.6);
          --dl-msg: #ffffff;
          --dl-track: rgba(255, 255, 255, 0.12);
          --dl-fill: linear-gradient(90deg, #e86e32, #ff9a52);
          --dl-percent: #ffb27a;
        }

        .dl-wrap {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 26px;
          background: var(--dl-bg);
          font-family: system-ui, sans-serif;
        }
        .dl-dots { display: flex; gap: 10px; }
        .dl-dots span {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--dl-dot);
          box-shadow: 0 0 14px var(--dl-glow);
          animation: dl-bounce 0.9s ease-in-out infinite;
        }
        .dl-dots span:nth-child(2) { animation-delay: 0.15s; }
        .dl-dots span:nth-child(3) { animation-delay: 0.3s; }

        .dl-msg { color: var(--dl-msg); font-size: 16px; letter-spacing: 1px; min-height: 22px; }

        .dl-bar-box { width: 360px; max-width: 80vw; }
        .dl-bar {
          height: 10px; border-radius: 999px;
          background: var(--dl-track);
          overflow: hidden;
        }
        .dl-fill {
          height: 100%; width: 0%; border-radius: 999px;
          background: var(--dl-fill);
          box-shadow: 0 0 18px var(--dl-glow);
          animation: dl-grow 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .dl-percent {
          margin-top: 10px; text-align: right;
          font-family: monospace; font-size: 13px; color: var(--dl-percent);
        }

        @keyframes dl-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-14px); opacity: 1; }
        }
        @keyframes dl-grow { from { width: 0%; } to { width: 100%; } }
      `}</style>

      <div className="dl-dots">
        <span />
        <span />
        <span />
      </div>

      <div className="dl-msg">{message}</div>

      <div className="dl-bar-box">
        <div className="dl-bar">
          <div className="dl-fill" />
        </div>
        <div className="dl-percent">{Math.floor(percent)}%</div>
      </div>
    </div>
  );
}