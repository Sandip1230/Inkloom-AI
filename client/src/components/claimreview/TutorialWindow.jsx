import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, STATUSES, STATUS_META, StatusBadge, Badge } from "./shared.jsx";
import { PROCESS_STEPS, ROLES } from "./ProcessGuide.jsx";

// Stored once the person reaches "Finish". The tutorial never opens again after that.
export const TUTORIAL_KEY = "inkloom-claim-review-tutorial-done";

export function hasCompletedTutorial() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTutorialCompleted() {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    // storage unavailable - the tutorial just closes for this visit
  }
}

const TIPS = [
  "Nothing is changed or published by the tutorial. It only explains the screen.",
  "No account yet? Sign up or log in first. Claim Review stays private to signed-in members.",
  "No workspace shows up? Open Company Admin to create one, or ask an owner to invite you.",
  "Only approved reference text is ever quoted as evidence, so approve a version before checking claims.",
  "Enter one clear statement at a time. The result lists the exact passages it relied on.",
  "The AI only suggests. A reviewer confirms or changes it and that decision is what gets recorded.",
];

// Welcome + the five process steps + statuses & roles.
const STEPS = [
  {
    kind: "intro",
    icon: "sparkle",
    title: "Welcome to Claim Review",
    text: "Check statements against your approved reference documents. The system suggests a status and shows its evidence, and a human reviewer makes the final call. This short tour (about a minute) shows every step you need.",
  },
  ...PROCESS_STEPS.map((step, index) => ({ kind: "process", ...step, tip: TIPS[index + 1] })),
  {
    kind: "meaning",
    icon: "info",
    title: "Statuses and roles",
    text: "Know what each result means and what your role allows before you start.",
  },
];

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * One-time, step-by-step tutorial window. It sits on top of a blurred page and
 * the page behind it stays unreachable until the person presses "Finish".
 */
export default function TutorialWindow({ onFinish }) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef(null);
  const nextRef = useRef(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const progress = Math.round(((index + 1) / STEPS.length) * 100);

  // Lock scrolling and make the page behind the window unreachable (mouse, keyboard, screen reader).
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const wasInert = root ? root.inert : false;
    document.body.style.overflow = "hidden";
    if (root) root.inert = true;
    return () => {
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = wasInert;
      if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
    };
  }, []);

  // Keep focus on the primary button whenever the step changes.
  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  function go(delta) {
    setIndex((value) => Math.min(STEPS.length - 1, Math.max(0, value + delta)));
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      // The tutorial must be completed, so Escape is intentionally ignored.
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowRight" && !last) {
      event.preventDefault();
      go(1);
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      go(-1);
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const final = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      final.focus();
    } else if (!event.shiftKey && document.activeElement === final) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="cr-tut" onKeyDown={onKeyDown}>
      <div
        ref={panelRef}
        className="cr-tut__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cr-tut-title"
        aria-describedby="cr-tut-text"
      >
        <div className="cr-tut__bar" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label="Tutorial progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div key={index} className="cr-tut__body">
          <div className="cr-tut__top">
            <span className="cr-tut__icon tp-fill-grad"><Icon name={step.icon} size={26} /></span>
            <span className="cr-tut__count" aria-live="polite">
              {step.kind === "process" ? `Step ${index} of ${PROCESS_STEPS.length}` : step.kind === "intro" ? "Quick tour" : "Good to know"}
              <span className="sr-only"> (page {index + 1} of {STEPS.length})</span>
            </span>
          </div>

          <h2 id="cr-tut-title" className="cr-tut__title">{step.title}</h2>
          <p id="cr-tut-text" className="cr-tut__text">{step.text}</p>

          {step.kind === "process" && (
            <>
              <p className="mt-3"><Badge tone="accent">Who: {step.who}</Badge></p>
              <p className="cr-tut__tip"><Icon name="info" size={15} /> {step.tip}</p>
            </>
          )}

          {step.kind === "intro" && (
            <ul className="cr-tut__chips" aria-label="What you will learn">
              {PROCESS_STEPS.map((item) => (
                <li key={item.title}><Icon name={item.icon} size={14} /> {item.title}</li>
              ))}
            </ul>
          )}

          {step.kind === "meaning" && (
            <div className="cr-tut__meaning">
              <ul className="space-y-2">
                {STATUSES.map((status) => (
                  <li key={status} className="flex items-start gap-2">
                    <StatusBadge status={status} />
                    <span className="text-xs leading-5 text-[var(--text-soft)]">{STATUS_META[status].meaning}</span>
                  </li>
                ))}
              </ul>
              <ul className="cr-tut__roles">
                {ROLES.map((role) => (
                  <li key={role.name}>
                    <strong><Icon name={role.icon} size={14} /> {role.name}</strong>
                    <span>{role.can.join(" · ")}</span>
                  </li>
                ))}
              </ul>
              <p className="cr-tut__tip"><Icon name="info" size={15} /> "Unverified" never means "false". It means the approved sources do not cover the claim.</p>
            </div>
          )}
        </div>

        <div className="cr-tut__foot">
          <ol className="cr-tut__dots" aria-hidden="true">
            {STEPS.map((item, dot) => (
              <li key={item.title} className={dot === index ? "is-active" : dot < index ? "is-done" : ""} />
            ))}
          </ol>
          <div className="cr-tut__actions">
            {index > 0 && (
              <button type="button" className="tp-btn-ghost" onClick={() => go(-1)}>Back</button>
            )}
            {last ? (
              <button ref={nextRef} type="button" className="tp-btn" onClick={() => finishRef.current()}>
                <Icon name="check" size={16} /> Finish
              </button>
            ) : (
              <button ref={nextRef} type="button" className="tp-btn" onClick={() => go(1)}>
                Next <Icon name="arrowRight" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}