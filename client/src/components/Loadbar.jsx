import { useEffect, useState } from "react";

export default function LoadBar({ duration = 2000 }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const step = 40;
    const id = setInterval(() => {
      setPercent((p) => Math.min(p + (100 * step) / duration, 100));
    }, step);
    return () => clearInterval(id);
  }, [duration]);

  return (
    <div className="lb-wrap">
      <style>{`
        .lb-wrap {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          background: radial-gradient(circle at 50% 40%, #1a1030 0%, #07050f 70%);
        }
        .lb-logo-box { position: relative; width: 110px; height: 110px; display: grid; place-items: center; }
        .lb-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #a78bfa;
          border-right-color: #22d3ee;
          animation: lb-spin 1s linear infinite;
        }
        .lb-ring2 {
          position: absolute; inset: 12px; border-radius: 50%;
          border: 2px solid transparent;
          border-bottom-color: #f472b6;
          border-left-color: #22d3ee;
          animation: lb-spin 1.6s linear infinite reverse;
        }
        .lb-logo {
          font-size: 34px; font-weight: 800; color: #fff;
          font-family: system-ui, sans-serif;
          animation: lb-pulse 1.4s ease-in-out infinite;
        }
        .lb-title {
          font-family: system-ui, sans-serif;
          letter-spacing: 6px; font-size: 14px; color: #c4b5fd;
          text-transform: uppercase;
        }
        .lb-bar-box { width: 320px; max-width: 78vw; }
        .lb-bar {
          height: 8px; border-radius: 999px;
          background: rgba(255,255,255,0.12);
          overflow: hidden;
        }
        .lb-fill {
          height: 100%; width: 0%;
          border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #22d3ee, #f472b6);
          box-shadow: 0 0 16px #a78bfa;
          animation: lb-grow var(--lb-duration) linear forwards;
        }
        .lb-percent {
          margin-top: 12px; text-align: center;
          font-family: monospace; font-size: 13px; color: #e9d5ff;
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