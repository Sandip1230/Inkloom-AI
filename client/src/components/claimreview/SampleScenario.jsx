import { useState } from "react";
import {
  ApprovalBadge, Badge, HighlightedExcerpt, Icon, STATUSES, STATUS_META, StatusBadge, cardClass, ghostBtn, primaryBtn,
} from "./shared.jsx";

// Everything on this component is made-up sample data. It never calls the server.
const SAMPLE_CLAIM = "Customer data is encrypted at rest.";
const SAMPLE_EXCERPT = "All customer records are encrypted at rest using AES-256, and backups use the same encryption.";
const SAMPLE_QUOTE = "encrypted at rest";

const STEPS = [
  { icon: "userPlus", title: "Account created", caption: "You sign up and land in the app." },
  { icon: "building", title: "Create a workspace", caption: "You set up a home for your team's documents and claims." },
  { icon: "file", title: "Add an approved source", caption: "You add a document and approve a version." },
  { icon: "search", title: "Check a claim", caption: "You enter a statement; the system suggests a status." },
  { icon: "shield", title: "Reviewer decides", caption: "A reviewer confirms, and the decision is logged." },
];

function MockWindow({ label, children }) {
  return (
    <div className="tp-row">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full tp-bg-danger" />
          <span className="h-2.5 w-2.5 rounded-full tp-bg-warn" />
          <span className="h-2.5 w-2.5 rounded-full tp-bg-ok" />
        </span>
        <span className="truncate text-[11px] font-medium text-[var(--text-soft)]">{label}</span>
        <Badge tone="muted">Sample</Badge>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[var(--text-soft)]">{label}</p>
      <p className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">{value}</p>
    </div>
  );
}

function AccountPane() {
  return (
    <MockWindow label="Sign up">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full tp-dot--ok text-white"><Icon name="check" size={20} /></span>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Welcome, Alex!</p>
          <p className="text-xs text-[var(--text-soft)]">alex@example.com · account ready</p>
        </div>
      </div>
      <p className="mt-4 tp-empty p-3 text-xs leading-5 text-[var(--text-soft)]">
        Next, open Claim Review. It will tell you that you are not in a workspace yet - that is normal for a new account.
      </p>
    </MockWindow>
  );
}

function WorkspacePane() {
  return (
    <MockWindow label="Company Admin · New workspace">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Workspace name" value="Acme Security Team" />
        <Field label="Your role" value="Owner" />
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
        <Badge tone="accent">Your role: owner</Badge>
        You can manage sources, submit claims and record final decisions. Invite teammates as reviewers or creators.
      </p>
    </MockWindow>
  );
}

function SourcePane() {
  return (
    <MockWindow label="Claim Review · Reference documents">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">Security whitepaper</p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">Owner: Security team · Latest version v1</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ApprovalBadge status="approved" />
          <Badge tone="accent">Searching v1</Badge>
        </div>
      </div>
      <p className="mt-4 rounded-lg bg-[var(--surface)] p-3 font-mono text-[11px] leading-5 text-[var(--text-soft)]">
        # Data protection{"\n"}
        All customer records are encrypted at rest using AES-256, and backups use the same encryption.
      </p>
      <p className="mt-3 text-xs text-[var(--text-soft)]">Only approved versions are ever used as evidence.</p>
    </MockWindow>
  );
}

function ClaimPane() {
  return (
    <MockWindow label="Claim Review · Check a claim">
      <p className="text-[11px] font-medium text-[var(--text-soft)]">Claim</p>
      <p className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">{SAMPLE_CLAIM}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status="Supported" />
        <span className="text-[11px] text-[var(--text-soft)]">AI-suggested, awaiting review</span>
      </div>
      <div className="mt-3 rounded-xl border border-l-4 border-[var(--border)] tp-border-l-ok p-3">
        <p className="text-xs font-semibold text-[var(--text)]">E1 · Security whitepaper <span className="font-normal text-[var(--text-soft)]">· v1</span></p>
        <blockquote className="mt-2 border-l-2 border-[var(--accent-solid)] pl-3 text-sm leading-6 text-[var(--text)]">
          <HighlightedExcerpt excerpt={SAMPLE_EXCERPT} quote={SAMPLE_QUOTE} />
        </blockquote>
        <p className="mt-2 text-[11px] text-[var(--text-soft)]">Section "Data protection", paragraph 1</p>
      </div>
    </MockWindow>
  );
}

function ReviewPane() {
  return (
    <MockWindow label="Claim Review · Human review">
      <div className="grid gap-2 sm:grid-cols-3" aria-label="Final status options">
        {STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const selected = status === "Supported";
          return (
            <div key={status} className={`rounded-xl border p-3 ${selected ? `${meta.panel} ring-2 ring-[color:var(--accent-solid)]` : "border-[var(--border)]"}`}>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${selected ? meta.text : "text-[var(--text)]"}`}>
                <Icon name={meta.icon} size={15} /> {status}
              </span>
              {selected && <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-solid)]">AI suggested</span>}
            </div>
          );
        })}
      </div>
      <ol className="mt-4">
        {[
          ["Claim submitted", "Alex · just now"],
          ["Status suggested: Supported", "System · just now"],
          ["Final decision recorded: Supported", "Alex (owner) · just now"],
        ].map(([title, meta], index, all) => (
          <li key={title} className="relative pb-4 pl-6 last:pb-0">
            {index < all.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-[var(--border)]" aria-hidden="true" />}
            <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-[var(--accent-solid)] bg-[var(--surface)]" aria-hidden="true" />
            <p className="text-xs font-medium text-[var(--text)]">{title}</p>
            <p className="text-[11px] text-[var(--text-soft)]">{meta}</p>
          </li>
        ))}
      </ol>
    </MockWindow>
  );
}

const PANES = [AccountPane, WorkspacePane, SourcePane, ClaimPane, ReviewPane];

export default function SampleScenario() {
  const [step, setStep] = useState(0);
  const Pane = PANES[step];
  const last = step === STEPS.length - 1;

  return (
    <section className={`${cardClass} cr-rise`} aria-labelledby="cr-sample-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="cr-sample-title" className="text-base font-semibold text-[var(--text)]">Sample: your first minutes after creating an account</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-soft)]">
            A walkthrough with made-up data, so you know what to expect. Nothing here is saved or sent anywhere.
          </p>
        </div>
        <Badge tone="accent">Step {step + 1} of {STEPS.length}</Badge>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Sample steps">
          {STEPS.map((item, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <li key={item.title} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-[var(--accent-solid)] bg-[var(--accent-solid)]/5" : "border-[var(--border)] hover:border-[var(--accent-solid)]"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "tp-dot--ok text-white" : active ? "tp-fill-grad text-white" : "bg-[var(--surface-2)] text-[var(--text-soft)]"}`}>
                    <Icon name={done ? "check" : item.icon} size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-xs font-semibold text-[var(--text)] lg:whitespace-normal">{index + 1}. {item.title}</span>
                    <span className="mt-0.5 hidden text-[11px] leading-4 text-[var(--text-soft)] lg:block">{item.caption}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="min-w-0">
          <p className="mb-3 text-xs text-[var(--text-soft)] lg:hidden">{STEPS[step].caption}</p>
          <Pane />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className={ghostBtn}>Back</button>
            {last ? (
              <button type="button" onClick={() => setStep(0)} className={primaryBtn}>Replay sample</button>
            ) : (
              <button type="button" onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))} className={primaryBtn}>Next step</button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}