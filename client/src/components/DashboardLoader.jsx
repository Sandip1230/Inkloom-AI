import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TIME = 3000; // 3 second

const MESSAGES = [
  "Signing you in...",
  "Loading your workspace...",
  "Almost there...",
];

export default function DashboardLoader() {
  const navigate = useNavigate();
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
    <div className="dl-wrap">
      <style>{`
        .dl-wrap {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 26px;
          background: radial-gradient(circle at 50% 35%, #12082b 0%, #05030c 75%);
          font-family: system-ui, sans-serif;
        }
        .dl-dots { display: flex; gap: 10px; }
        .dl-dots span {
          width: 14px; height: 14px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #22d3ee);
          box-shadow: 0 0 14px #7c3aed;
          animation: dl-bounce 0.9s ease-in-out infinite;
        }
        .dl-dots span:nth-child(2) { animation-delay: 0.15s; }
        .dl-dots span:nth-child(3) { animation-delay: 0.3s; }

        .dl-msg { color: #e9d5ff; font-size: 16px; letter-spacing: 1px; min-height: 22px; }

        .dl-bar-box { width: 360px; max-width: 80vw; }
        .dl-bar {
          height: 10px; border-radius: 999px;
          background: rgba(255,255,255,0.1);
          overflow: hidden;
        }
        .dl-fill {
          height: 100%; width: 0%; border-radius: 999px;
          background: linear-gradient(90deg, #22d3ee, #7c3aed, #f472b6);
          box-shadow: 0 0 18px #7c3aed;
          animation: dl-grow 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .dl-percent {
          margin-top: 10px; text-align: right;
          font-family: monospace; font-size: 13px; color: #c4b5fd;
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