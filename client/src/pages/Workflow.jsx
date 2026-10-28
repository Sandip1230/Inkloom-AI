import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import BranchingReviewSummary from "../components/BranchingReviewSummary.jsx";
import DashboardHero from "../components/DashboardHero.jsx";
import InkSelect from "../components/InkSelect.jsx";
import {
  applySuggestion,
  createBrandSafeRemixes,
  createBrandTwinDebate,
  reviewContent,
} from "../lib/governance.js";
import { getGuidelines, listReviews } from "../lib/reviewStore.js";
import { useReviewStore } from "../lib/useReviewStore.js";
import WorkspaceSwitcher from "../components/review/WorkspaceSwitcher.jsx";
import TeamDrafts from "../components/review/TeamDrafts.jsx";
import TeamReviewPanel from "../components/review/TeamReviewPanel.jsx";
import VoiceActorPreview from "../components/review/VoiceActorPreview.jsx";
import ChaosTestPanel from "../components/review/ChaosTestPanel.jsx";
import ScreenshotReview from "../components/review/ScreenshotReview.jsx";
import FindingFeedback, { MissedIssueReport } from "../components/review/FindingFeedback.jsx";

const CONTENT_TYPES = [
  "Web page",
  "Email",
  "Social post",
  "Advertisement",
  "Instagram Post",
  "LinkedIn Post",
  "Facebook Post",
  "Blog Content",
  "Report Draft",
  "Other",
];
const MAX_CHARS = 12000;
const JUDGE_DEMO_CONTENT = "Our planning tool guarantees success and offers the best solution for teams. Click here to learn more.";

// Tabs shown at the top of the "Start a content review" card.
const INPUT_TABS = [
  { id: "write", label: "Content to review", icon: "doc" },
  { id: "upload", label: "Upload file", icon: "upload" },
  { id: "url", label: "Paste from URL", icon: "link" },
  { id: "template", label: "Use a template", icon: "templates" },
];

// Feature templates. Clicking one loads the starter text into the review box.
// Icons are simple, original drawings (not the official brand logos).
const TEMPLATES = [
  {
    id: "linkedin",
    name: "LinkedIn",
    tag: "Professional post",
    type: "Social post",
    gradient: "var(--tpl-linkedin)",
    starter:
      "We’re excited to share [announcement] with our community.\n\nHere’s what it means for our customers:\n• [Key benefit one]\n• [Key benefit two]\n• [Key benefit three]\n\nWe’d love to hear your thoughts. Tell us in the comments.\n\n#[YourBrand] #[Topic]",
  },
  {
    id: "instagram",
    name: "Instagram",
    tag: "Caption + hashtags",
    type: "Social post",
    gradient: "var(--tpl-instagram)",
    starter:
      "✨ [Hook that stops the scroll]\n\n[One or two short lines about the product, moment, or story.]\n\n👉 Tap the link in our bio to [action].\n\n#[YourBrand] #[Topic] #[Community]",
  },
  {
    id: "facebook",
    name: "Facebook",
    tag: "Community update",
    type: "Social post",
    gradient: "var(--tpl-facebook)",
    starter:
      "Hi everyone! 👋\n\n[Friendly update or announcement for the community.]\n\nWhat do you think? Share your thoughts below, and tag a friend who would enjoy this.\n\n[Short description of the link you are sharing]",
  },
  {
    id: "blog",
    name: "Blogs",
    tag: "Long-form article",
    type: "Web page",
    gradient: "var(--tpl-blog)",
    starter:
      "Title: [Working title]\n\nIntro\n[Open with the problem or question your reader cares about.]\n\nKey point 1\n[Explain it with an example.]\n\nKey point 2\n[Explain it with an example.]\n\nKey point 3\n[Explain it with an example.]\n\nConclusion\n[Summarize the takeaway and invite the next step.]",
  },
  {
    id: "email",
    name: "Emails",
    tag: "Campaign email",
    type: "Email",
    gradient: "var(--tpl-email)",
    starter:
      "Subject: [Clear, specific subject line]\n\nHi [First name],\n\n[One sentence explaining why you are writing.]\n\n[Two or three sentences with the key details and the value for the reader.]\n\n[Describe the action], and we’ll take care of the rest.\n\nWarm regards,\n[Your name]\n[Brand name]",
  },
  {
    id: "others",
    name: "Others",
    tag: "Ads, notices & more",
    type: "Other",
    gradient: "var(--tpl-others)",
    starter:
      "[Headline]\n\n[Two or three sentences describing the offer, update, or announcement.]\n\n[Single, clear call to action]\n\n[Contact details or link text]",
  },
];

// Time ranges for the review-stats doughnut.
const PERIODS = [
  { id: "week", label: "This Week", days: 7 },
  { id: "month", label: "This Month", days: 30 },
  { id: "all", label: "All Time", days: null },
];

// Colours + order for the doughnut (theme tokens: blue/green in light, orange/pink in dark).
const STATUS_META = [
  { key: "Approved", color: "var(--st-approved)" },
  { key: "Awaiting approval", color: "var(--st-awaiting)" },
  { key: "Changes requested", color: "var(--st-changes)" },
  { key: "Draft", color: "var(--st-draft)" },
];

function statusStyle(status) {
  if (status === "Approved") return "bg-emerald-500/10 text-emerald-600";
  if (status === "Awaiting approval") return "bg-sky-500/10 text-sky-600";
  if (status === "Changes requested") return "bg-amber-500/10 text-amber-600";
  return "bg-[var(--surface-2)] text-[var(--text-soft)]";
}

// Makes the card glow follow the mouse.
function handleSpotlight(event) {
  const card = event.target.closest(".dashboard-metric, .dashboard-panel");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  card.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

export default function Workflow() {
  const [guidelines, setGuidelines] = useState(() => getGuidelines());
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [findings, setFindings] = useState([]);
  const [reviewId, setReviewId] = useState(null);
  const [reviewRev, setReviewRev] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const store = useReviewStore();
  const [status, setStatus] = useState("Draft");
  const [reviewer, setReviewer] = useState("");
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [judgeMode, setJudgeMode] = useState(false);
  const [judgeStage, setJudgeStage] = useState(0);
  const [reviewError, setReviewError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedRemixId, setSelectedRemixId] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [inputMode, setInputMode] = useState("write");
  const [period, setPeriod] = useState("week");
  const [fileNotice, setFileNotice] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Switching workspace starts a fresh, unsaved review.
  useEffect(() => {
    setReviewId(null);
    setReviewRev(undefined);
    setStatus("Draft");
  }, [store.workspaceId]);

  useEffect(() => {
    try {
      localStorage.setItem("inkloom-guidelines", JSON.stringify(guidelines));
      setReviewError("");
    } catch (error) {
      setReviewError(`Could not save guidelines in this browser: ${error.message}`);
    }
  }, [guidelines]);

  const issueCount = findings.length;
  const categoryCount = useMemo(
    () => new Set(findings.map((finding) => finding.category)).size,
    [findings],
  );
  const remixes = useMemo(
    () => reviewed ? createBrandSafeRemixes(content, findings, guidelines) : [],
    [content, findings, guidelines, reviewed],
  );
  const selectedRemix = remixes.find((remix) => remix.id === selectedRemixId);
  const brandTwinDebate = useMemo(
    () => reviewed ? createBrandTwinDebate(findings) : null,
    [findings, reviewed],
  );

  // ASSUMPTION: the store exposes its list of reviews as `store.reviews`.
  // If it uses another name, change it here and in activeReview below.
  const storeReviews = store.reviews;
  const savedReviews = useMemo(
    () => (Array.isArray(storeReviews) ? storeReviews : listReviews()),
    [storeReviews, reviewed, status, findings],
  );

  // The saved copy of the review currently open in the editor (team workspaces).
  // ASSUMPTION: same `store.reviews` list as above.
  const activeReview = useMemo(
    () => (reviewId && Array.isArray(storeReviews) ? storeReviews.find((review) => review.id === reviewId) || null : null),
    [storeReviews, reviewId],
  );
  // True when a teammate saved a newer version than the one on screen.
  const teamUpdateAvailable = Boolean(
    store.shared && activeReview && reviewRev !== undefined && activeReview.contentRev !== reviewRev,
  );

  const outstandingReviews = savedReviews.filter(
    (review) => review.status === "Draft" || review.status === "Awaiting approval",
  ).length;
  const approvedReviews = savedReviews.filter((review) => review.status === "Approved").length;
  const savedFindingCount = savedReviews.reduce((total, review) => total + (review.findings?.length || 0), 0);

  // Reviews inside the selected period, used by the doughnut.
  const periodReviews = useMemo(() => {
    const selected = PERIODS.find((item) => item.id === period) || PERIODS[0];
    if (!selected.days) return savedReviews;
    const cutoff = Date.now() - selected.days * 24 * 60 * 60 * 1000;
    return savedReviews.filter((review) => (review.updatedAt || 0) >= cutoff);
  }, [savedReviews, period]);

  // Status breakdown (unknown statuses are counted as Draft).
  const statusSegments = useMemo(() => {
    const counts = Object.fromEntries(STATUS_META.map((item) => [item.key, 0]));
    periodReviews.forEach((review) => {
      const key = Object.prototype.hasOwnProperty.call(counts, review.status) ? review.status : "Draft";
      counts[key] += 1;
    });
    return STATUS_META.map((item) => ({ ...item, count: counts[item.key] }));
  }, [periodReviews]);

  const visibleFindings = activeCategory
    ? findings.filter((finding) => (
      activeCategory === "Brand voice"
        ? ["Terminology", "Tone"].includes(finding.category)
        : activeCategory === "Claims"
          ? finding.category === "Promotional claim"
          : finding.category === "Accessibility"
    ))
    : findings;

  function currentDraft(overrides = {}) {
    return {
      id: reviewId,
      contentRev: reviewRev,
      content,
      contentType,
      findings,
      status: "Draft",
      reviewer,
      comment,
      guidelineSnapshot: guidelines,
      ...overrides,
    };
  }

  // Saves to the workspace (shared) or this browser (personal). Status always comes back from the store.
  async function persist(overrides = {}) {
    setSaving(true);
    try {
      const saved = await store.save(currentDraft(overrides));
      setReviewId(saved.id);
      setReviewRev(saved.contentRev);
      setStatus(saved.status);
      setReviewError("");
      return saved;
    } catch (error) {
      setReviewError(`Could not save this review: ${error.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }

  // Load a saved (team) review into the editor.
  function openReview(review) {
    setContent(review.content);
    setContentType(review.contentType || CONTENT_TYPES[0]);
    setFindings(Array.isArray(review.findings) ? review.findings : reviewContent(review.content, guidelines));
    setReviewId(review.id);
    setReviewRev(review.contentRev);
    setStatus(review.status);
    setReviewer(review.reviewer || "");
    setComment("");
    setReviewed(true);
    setJudgeMode(false);
    setJudgeStage(0);
    setActiveCategory(null);
    setSelectedRemixId(null);
    setActiveTemplate(null);
    setInputMode("write");
    setFileNotice("");
    setReviewError("");
    document.getElementById("new-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Guided demo: loads the sample text and runs the review without saving anything.
  function startJudgeDemo() {
    const results = reviewContent(JUDGE_DEMO_CONTENT, guidelines);
    setContent(JUDGE_DEMO_CONTENT);
    setFindings(results);
    setReviewId(null);
    setReviewRev(undefined);
    setStatus("Draft");
    setReviewer("");
    setComment("");
    setReviewed(true);
    setJudgeMode(true);
    setJudgeStage(1);
    setActiveCategory(null);
    setSelectedRemixId(null);
    setActiveTemplate(null);
    setInputMode("write");
    setFileNotice("");
    setReviewError("");
    document.getElementById("new-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleReview(event) {
    event.preventDefault();
    const results = reviewContent(content, guidelines);
    setFindings(results);
    setReviewed(true);
    setJudgeMode(false);
    setJudgeStage(0);
    setActiveCategory(null);
    setSelectedRemixId(null);
    await persist({ findings: results });
  }

  async function updateDecision(nextStatus) {
    if (!reviewId && !judgeMode) return;
    // Never approve text the reviewer is not looking at: saved copy must match the screen.
    if (store.shared && activeReview && content !== activeReview.content) {
      setReviewError("Run the review to save your latest edits before making a decision.");
      return;
    }
    try {
      if (reviewId) {
        const saved = await store.decide(currentDraft(), nextStatus, comment);
        setStatus(saved.status);
      } else {
        setStatus(nextStatus);
      }
      if (judgeMode) setJudgeStage(4);
      setReviewError("");
    } catch (error) {
      setReviewError(`Could not save the review decision: ${error.message}`);
    }
  }

  async function acceptSuggestion(finding) {
    const updatedContent = applySuggestion(content, finding);
    if (updatedContent === content) return;
    const updatedFindings = reviewContent(updatedContent, guidelines);
    setContent(updatedContent);
    setFindings(updatedFindings);
    setSelectedRemixId(null);
    setStatus("Draft");
    if (reviewId) await persist({ content: updatedContent, findings: updatedFindings });
  }

  async function acceptRemix(remix) {
    if (!remix || remix.content === content) return;
    setContent(remix.content);
    setFindings(remix.remainingFindings);
    setSelectedRemixId(null);
    setActiveCategory(null);
    setStatus("Draft");
    setReviewed(true);
    if (judgeMode) setJudgeStage(3);
    // Judge-mode samples are never saved.
    if (reviewId) {
      await persist({
        content: remix.content,
        findings: remix.remainingFindings,
        status: "Draft",
      });
    }
  }

  // Load a template into the review box, then bring the review section into view.
  function applyTemplate(template) {
    const isUntouchedTemplate = TEMPLATES.some((item) => item.starter === content);
    if (content.trim() && !isUntouchedTemplate) {
      const replace = window.confirm("Replace the text currently in the review box with this template?");
      if (!replace) return;
    }
    setContent(template.starter);
    setContentType(template.type);
    setActiveTemplate(template.id);
    setInputMode("write");
    setFileNotice("");
    setReviewed(false);
    setJudgeMode(false);
    setJudgeStage(0);
    document.getElementById("new-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 350);
  }

  // Read a plain-text file straight into the review box (stays in the browser).
  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 500 * 1024) {
      setFileNotice("That file is larger than 500 KB. Please choose a smaller text file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setContent(text.slice(0, MAX_CHARS));
      setActiveTemplate(null);
      setInputMode("write");
      setReviewed(false);
      setJudgeMode(false);
      setJudgeStage(0);
      setFileNotice(
        text.length > MAX_CHARS
          ? `Loaded “${file.name}” and trimmed it to the first ${MAX_CHARS.toLocaleString()} characters.`
          : `Loaded “${file.name}”.`,
      );
    };
    reader.onerror = () => setFileNotice("That file could not be read. Try a plain-text file (.txt, .md, .html, .csv).");
    reader.readAsText(file);
  }

  function chooseFile() {
    fileInputRef.current?.click();
  }

  function clearDraft() {
    setContent("");
    setActiveTemplate(null);
    setFileNotice("");
    setReviewed(false);
    setJudgeMode(false);
    setJudgeStage(0);
    setInputMode("write");
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  // Reset everything and jump to a fresh review box.
  function startNewReview() {
    setContent("");
    setFindings([]);
    setReviewId(null);
    setReviewRev(undefined);
    setStatus("Draft");
    setReviewer("");
    setComment("");
    setReviewed(false);
    setJudgeMode(false);
    setJudgeStage(0);
    setReviewError("");
    setActiveCategory(null);
    setActiveTemplate(null);
    setFileNotice("");
    setInputMode("write");
    document.getElementById("new-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 350);
  }

  return (
    <AppShell showTopbarProfile={false}>
      <div className="inkloom-dashboard-scroll min-h-full">
        <div onMouseMove={handleSpotlight} className="ink-dash mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-9">
        <section className="dashboard-overview" aria-label="Workspace overview">
          <DashboardHero />

          {/* ───────── Feature templates ───────── */}
          <section className="dashboard-overview__templates stagger" aria-labelledby="templates-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="ink-eyebrow">Quick start</p>
                <h2 id="templates-title" className="ink-section-title">Feature templates</h2>
              </div>
              <p className="text-xs text-[var(--text-soft)]">Pick one to load a starter draft into the review box.</p>
            </div>

            <div className="ink-template-grid mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  aria-pressed={activeTemplate === template.id}
                  className={`ink-template ${activeTemplate === template.id ? "is-active" : ""}`}
                >
                  <span className="ink-template__icon" style={{ "--tpl-bg": template.gradient }} aria-hidden="true">
                    <Icon name={template.id} size={24} />
                  </span>
                  <span className="ink-template__text">
                    <span className="ink-template__name">{template.name}</span>
                    <span className="ink-template__tag">{template.tag}</span>
                  </span>
                  <span className="ink-template__cta">
                    {activeTemplate === template.id ? "Loaded" : "Use template"} <span aria-hidden="true">→</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

        {/* ───────── Review workspace and supporting cards ───────── */}
        <div className="ink-main-grid stagger grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
            <div className="min-w-0 space-y-5">
              {/* ===== Start a content review ===== */}
              <section id="new-review" className="ink-review scroll-mt-24" aria-labelledby="review-title">
                <div className="ink-review__inner">
                  <p className="ink-eyebrow">Review workspace</p>
                  <h2 id="review-title" className="ink-review__title">Start a content review</h2>
                  <p className="ink-review__sub">Paste your draft and let Inkloom AI check it for you.</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                    <p className="text-xs text-[var(--text-soft)]">Showing your project to judges?</p>
                    <button type="button" onClick={startJudgeDemo} className="rounded-lg border border-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-[var(--accent-solid)] hover:bg-[var(--accent-solid)]/5">
                      {judgeMode ? "Restart Judge Mode" : "Try Judge Mode"}
                    </button>
                  </div>
                  <WorkspaceSwitcher />
                  {store.shared && <TeamDrafts store={store} activeId={reviewId} onOpen={openReview} />}

                  <form onSubmit={handleReview} className="mt-5">
                    <div className="ink-review__toolbar">
                      <div role="tablist" aria-label="How to add content" className="ink-tabs">
                        {INPUT_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={inputMode === tab.id}
                            onClick={() => setInputMode(tab.id)}
                            className={`ink-tab ${inputMode === tab.id ? "is-active" : ""}`}
                          >
                            <Icon name={tab.icon} size={16} />
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>

                      <InkSelect
                        wide
                        ariaLabel="Content type"
                        icon={<Icon name="globe" size={17} />}
                        value={contentType}
                        onChange={setContentType}
                        options={CONTENT_TYPES.map((type) => ({ value: type, label: type }))}
                      />
                    </div>

                    {inputMode === "write" && (
                      <div className="ink-editor">
                        <label htmlFor="review-content" className="sr-only">Content to review</label>
                        <textarea
                          id="review-content"
                          ref={textareaRef}
                          value={content}
                          onChange={(event) => {
                            setContent(event.target.value);
                            setReviewed(false);
                            setJudgeMode(false);
                            setJudgeStage(0);
                          }}
                          required
                          rows={6}
                          maxLength={MAX_CHARS}
                          placeholder="Paste your campaign copy, product description, email, or social post…"
                          className="ink-editor__textarea"
                        />
                        <span className="ink-editor__spark" aria-hidden="true"><Icon name="sparkle" size={18} /></span>
                      </div>
                    )}

                    {inputMode === "upload" && (
                      <>
                        <div className="ink-panel-note">
                          <span className="ink-panel-note__icon" aria-hidden="true"><Icon name="upload" size={22} /></span>
                          <p className="ink-panel-note__title">Upload a text file</p>
                          <p className="ink-panel-note__text">.txt, .md, .html or .csv up to 500 KB. The file is read in your browser and is not uploaded anywhere.</p>
                          <button type="button" onClick={chooseFile} className="ink-btn-ghost">Choose file</button>
                        </div>
                        <ScreenshotReview
                          preferredTerms={guidelines.preferredTerms || ""}
                          onUseText={(text) => {
                            setContent(text.slice(0, MAX_CHARS));
                            setInputMode("write");
                            setReviewed(false);
                            setJudgeMode(false);
                            setJudgeStage(0);
                            setFileNotice("Extracted text is ready for the usual local content checks.");
                          }}
                        />
                      </>
                    )}

                    {inputMode === "url" && (
                      <div className="ink-panel-note">
                        <span className="ink-panel-note__icon" aria-hidden="true"><Icon name="link" size={22} /></span>
                        <p className="ink-panel-note__title">Fetching from a URL isn’t available yet</p>
                        <p className="ink-panel-note__text">This prototype reviews text locally and doesn’t load web pages. Copy the text from the page and paste it into “Content to review”.</p>
                        <button type="button" onClick={() => setInputMode("write")} className="ink-btn-ghost">Paste text instead</button>
                      </div>
                    )}

                    {inputMode === "template" && (
                      <div className="ink-chip-grid">
                        {TEMPLATES.map((template) => (
                          <button key={template.id} type="button" onClick={() => applyTemplate(template)} className="ink-chip">
                            <span className="ink-chip__icon" style={{ "--tpl-bg": template.gradient }} aria-hidden="true">
                              <Icon name={template.id} size={16} />
                            </span>
                            {template.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {fileNotice && <p role="status" className="ink-notice">{fileNotice}</p>}

                    <details className="ink-extra-tools">
                      <summary>Optional voice and stress-test tools</summary>
                      <div className="ink-extra-tools__content">
                        <VoiceActorPreview text={content} />
                        <ChaosTestPanel content={content} preferredTerms={guidelines.preferredTerms || ""} />
                      </div>
                    </details>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.markdown,.html,.htm,.csv,text/*"
                      onChange={handleFileChange}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    />

                    <div className="ink-review__footer">
                      <div className="ink-tools">
                        <button type="button" onClick={chooseFile} className="ink-tool ink-tool--wide">
                          <Icon name="clip" size={17} />
                          Add file
                        </button>
                        <button type="button" disabled title="Cloud storage isn’t connected in this prototype" aria-label="Import from cloud storage (not connected)" className="ink-tool">
                          <Icon name="cloud" size={18} />
                        </button>
                        <button type="button" disabled title="Notes import isn’t connected in this prototype" aria-label="Import from notes (not connected)" className="ink-tool">
                          <Icon name="notes" size={18} />
                        </button>
                        <button type="button" onClick={() => setInputMode("url")} title="Paste from URL" aria-label="Paste from URL" className="ink-tool">
                          <Icon name="link" size={18} />
                        </button>
                      </div>

                      <div className="ink-review__run">
                        <span className="ink-count">{content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters</span>
                        {content && (
                          <button type="button" onClick={clearDraft} className="ink-btn-ghost ink-btn-ghost--small">Clear</button>
                        )}
                        <button type="submit" disabled={!content.trim()} className="ink-run">
                          <Icon name="sparkle" size={17} />
                          Run content review
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {reviewed && (
                    <div aria-live="polite" className="ink-results fade-in mt-6">
                      {reviewError && <p role="alert" className="scale-in mb-4 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">{reviewError}</p>}
                      {judgeMode && (
                        <section aria-labelledby="judge-mode-title" className="mb-5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-2)] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-orange)]">Guided product demo · sample not saved</p>
                              <h3 id="judge-mode-title" className="mt-1 text-sm font-semibold text-[var(--text)]">Judge Mode</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setJudgeMode(false);
                                setJudgeStage(0);
                              }}
                              className="text-xs font-semibold text-[var(--text-soft)] hover:text-[var(--text)]"
                            >
                              Exit demo
                            </button>
                          </div>
                          <ol className="mt-3 grid gap-2 sm:grid-cols-4">
                            {["Inspect findings", "Preview remix", "Apply remix", "Human decision"].map((step, index) => (
                              <li
                                key={step}
                                aria-current={judgeStage === index + 1 ? "step" : undefined}
                                className={`rounded-lg border px-2.5 py-2 text-[11px] ${
                                  judgeStage >= index + 1
                                    ? "border-[var(--ink-orange)] bg-[var(--ink-orange)]/10 text-[var(--ink-title)]"
                                    : "border-[var(--ink-line)] text-[var(--ink-muted)]"
                                }`}
                              >
                                <span className="font-bold">{index + 1}.</span> {step}
                              </li>
                            ))}
                          </ol>
                          <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
                            {judgeStage === 1 && "This sample intentionally includes claim wording and a generic link label. Review the rule-based findings below."}
                            {judgeStage === 2 && "Compare the proposed wording with the original before applying the remix."}
                            {judgeStage === 3 && "The remix has been rechecked. Choose a human review decision to finish the walkthrough."}
                            {judgeStage === 4 && `Walkthrough complete. The human-selected status is “${status}”. This sample was not added to review history.`}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {judgeStage === 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRemixId("on-brand");
                                  setJudgeStage(2);
                                }}
                                className="rounded-lg bg-[var(--ink-orange)] px-3 py-2 text-xs font-semibold text-white hover:brightness-105"
                              >
                                Next: preview the on-brand remix
                              </button>
                            )}
                            {judgeStage === 2 && (
                              <button
                                type="button"
                                disabled={!selectedRemix}
                                onClick={() => acceptRemix(selectedRemix)}
                                className="rounded-lg bg-[var(--ink-orange)] px-3 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50"
                              >
                                Apply remix and continue
                              </button>
                            )}
                            {judgeStage === 4 && (
                              <button
                                type="button"
                                onClick={startJudgeDemo}
                                className="rounded-lg border border-[var(--ink-orange)]/30 px-3 py-2 text-xs font-semibold text-[var(--ink-orange)] hover:bg-[var(--ink-orange)]/5"
                              >
                                Restart walkthrough
                              </button>
                            )}
                          </div>
                        </section>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-[var(--text)]">
                            {issueCount ? `${issueCount} finding${issueCount === 1 ? "" : "s"} to review` : "No issues detected"}
                          </h2>
                          <p className="mt-1 text-xs text-[var(--text-soft)]">
                            {issueCount ? `Across ${categoryCount} ${categoryCount === 1 ? "category" : "categories"}. Review each finding before deciding.` : "Automated checks found no matches. A human reviewer should still verify the draft."}
                          </p>
                        </div>
                        <span key={status} className={`scale-in rounded-full px-3 py-1 text-xs font-medium ${statusStyle(status)}`}>{status}</span>
                      </div>

                      {brandTwinDebate && (
                        <section aria-labelledby="brand-twin-title" className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 id="brand-twin-title" className="text-sm font-semibold text-[var(--text)]">Brand Twin Debate</h3>
                              <p className="mt-1 text-xs text-[var(--text-soft)]">Two rule-grounded perspectives—not AI opinions or an approval score.</p>
                            </div>
                            <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-soft)]">Local checks</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <article className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                              <h4 className="text-xs font-bold text-emerald-800">Brand Guardian</h4>
                              <p className="mt-1.5 text-xs leading-5 text-[var(--text)]">{brandTwinDebate.guardian}</p>
                            </article>
                            <article className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                              <h4 className="text-xs font-bold text-amber-800">Skeptical Twin</h4>
                              <p className="mt-1.5 text-xs leading-5 text-[var(--text)]">{brandTwinDebate.skeptic}</p>
                            </article>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
                            <span className="font-semibold text-[var(--text)]">Human verdict:</span> {brandTwinDebate.verdict}
                          </p>
                        </section>
                      )}

                      <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4" aria-labelledby="remix-title">
                        <h3 id="remix-title" className="text-sm font-semibold text-[var(--text)]">Brand-safe remix</h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
                          Explore local, rule-based edits. Preview and re-check each version before applying it.
                        </p>
                        {remixes.length ? (
                          <>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              {remixes.map((remix) => (
                                <article key={remix.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                                  <h4 className="text-xs font-semibold text-[var(--text)]">{remix.title}</h4>
                                  <p className="mt-1 min-h-10 text-[11px] leading-4 text-[var(--text-soft)]">{remix.description}</p>
                                  <p className="mt-2 text-[10px] text-[var(--text-soft)]">
                                    {remix.clearedCategories.length
                                      ? `No longer flagged: ${remix.clearedCategories.join(", ")}`
                                      : `${remix.remainingFindings.length} finding${remix.remainingFindings.length === 1 ? "" : "s"} remain`}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRemixId(remix.id)}
                                    aria-pressed={selectedRemixId === remix.id}
                                    className="mt-2 text-xs font-semibold text-[var(--accent-solid)] hover:underline"
                                  >
                                    {selectedRemixId === remix.id ? "Previewing" : "Preview remix"}
                                  </button>
                                </article>
                              ))}
                            </div>
                            {selectedRemix && (
                              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-xs font-semibold text-[var(--text)]">{selectedRemix.title} preview</h4>
                                  <button
                                    type="button"
                                    onClick={() => acceptRemix(selectedRemix)}
                                    className="rounded-lg bg-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                                  >
                                    Apply remix
                                  </button>
                                </div>
                                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--surface-2)] p-3 font-sans text-xs leading-5 text-[var(--text)]">{selectedRemix.content}</pre>
                                <p className="mt-2 text-[10px] leading-4 text-[var(--text-soft)]">
                                  Re-check results: {selectedRemix.remainingFindings.length
                                    ? `${selectedRemix.remainingFindings.length} finding${selectedRemix.remainingFindings.length === 1 ? "" : "s"} remain (${[...new Set(selectedRemix.remainingFindings.map((finding) => finding.category))].join(", ")}).`
                                    : "No configured checks were triggered."}
                                  {" "}Pattern checks are limited; review the wording yourself.
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="mt-3 text-xs text-[var(--text-soft)]">
                            No safe automatic remix is available for this draft. Add missing context or edit the text manually.
                          </p>
                        )}
                      </section>

                      {findings.length > 0 ? (
                        <>
                          <BranchingReviewSummary
                            findings={findings}
                            activeCategory={activeCategory}
                            onSelect={setActiveCategory}
                          />
                          {activeCategory && <p className="fade-in mt-4 text-xs text-[var(--text-soft)]">Showing {visibleFindings.length} findings in {activeCategory}. <button type="button" onClick={() => setActiveCategory(null)} className="font-semibold text-[var(--accent-solid)] hover:underline">Show all</button></p>}
                          <ul className="stagger mt-4 space-y-3">
                            {visibleFindings.map((finding) => (
                              <li key={finding.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">{finding.category}</span>
                                    <span className="text-xs font-medium text-amber-600">{finding.severity}</span>
                                  </div>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-[var(--text)]">“{finding.excerpt}”</p>
                                <p className="mt-1.5 text-sm leading-5 text-[var(--text-soft)]">{finding.explanation}</p>
                                <p className="mt-2 text-xs text-[var(--accent-solid)]">Guideline: {finding.source}</p>
                                <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Suggested next step</p>
                                  <p className="mt-1 text-sm text-[var(--text)]">{finding.suggestion}</p>
                                  {finding.replacement && finding.category === "Terminology" && (
                                    <button type="button" onClick={() => acceptSuggestion(finding)} className="mt-2 text-xs font-semibold text-emerald-700 hover:underline">
                                      Apply wording suggestion
                                    </button>
                                  )}
                                </div>
                                <FindingFeedback finding={finding} content={content} reviewId={reviewId} reviewerName={reviewer} />
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <div className="scale-in mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-[var(--text)]">
                          No configured checks were triggered. This is not a guarantee that the content is accurate or compliant.
                        </div>
                      )}
                      <MissedIssueReport content={content} reviewId={reviewId} reviewerName={reviewer} />

                      {/* ===== Human review ===== */}
                      <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                        <h3 className="text-sm font-semibold text-[var(--text)]">Human review</h3>

                        {store.shared && !judgeMode ? (
                          <>
                            {teamUpdateAvailable && (
                              <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700">
                                A teammate updated this review.
                                <button type="button" onClick={() => openReview(activeReview)} className="rounded-lg border border-amber-500/40 px-3 py-1.5 font-semibold">
                                  Load latest
                                </button>
                              </div>
                            )}
                            <TeamReviewPanel
                              review={activeReview}
                              store={store}
                              note={comment}
                              onNoteChange={setComment}
                              onDecision={updateDecision}
                              busy={saving}
                            />
                          </>
                        ) : (
                          <>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <label className="text-xs font-medium text-[var(--text-soft)]">
                                Reviewer
                                <input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Name (optional)" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
                              </label>
                              <label className="text-xs font-medium text-[var(--text-soft)]">
                                Review note
                                <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Context or decision rationale" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
                              </label>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button type="button" onClick={() => updateDecision("Awaiting approval")} disabled={!reviewId && !judgeMode} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50">Request approval</button>
                              <button type="button" onClick={() => updateDecision("Changes requested")} disabled={!reviewId && !judgeMode} className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-500/5 disabled:opacity-50">Request changes</button>
                              <button type="button" onClick={() => updateDecision("Approved")} disabled={!reviewId && !judgeMode} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve draft</button>
                            </div>
                          </>
                        )}

                        <p className="mt-3 text-[11px] leading-4 text-[var(--text-soft)]">
                          Approval is a human decision. Inkloom’s automated checks do not publish content or replace legal, factual, or brand-owner review.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ===== Side column ===== */}
            <aside className="dashboard-side-grid min-w-0">
              <section className="dashboard-panel ink-card px-4 py-4 sm:px-5" aria-labelledby="stats-title">
                <div className="flex items-start justify-between gap-3">
                  <h2 id="stats-title" className="ink-card__title ink-card__title--lg">Your Review Stats</h2>
                  <InkSelect
                    small
                    ariaLabel="Time range"
                    value={period}
                    onChange={setPeriod}
                    options={PERIODS.map((item) => ({ value: item.id, label: item.label }))}
                  />
                </div>
                <StatusDoughnut segments={statusSegments} total={periodReviews.length} />
              </section>

              <section className="ink-next" aria-labelledby="next-title">
                <div className="ink-next__body">
                  <h2 id="next-title" className="ink-next__title">Keep your review moving</h2>
                  <p className="ink-next__text">A clear next step for this workspace. Run a draft through your approved terminology and content checks.</p>
                  <button type="button" onClick={startNewReview} className="ink-next__btn">
                    Start a new review <span aria-hidden="true">→</span>
                  </button>
                </div>
                <DocStackArt />
              </section>

              <section className="side-card ink-card dashboard-panel px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="ink-card__title">Your terminology rules</h2>
                    <p className="ink-card__sub">One substitution per line, written as “old term → approved term”.</p>
                  </div>
                  <Link to="/brand-kits" className="shrink-0 text-xs font-medium text-[var(--accent-solid)] hover:underline">Manage</Link>
                </div>
                <textarea
                  value={guidelines.preferredTerms || ""}
                  onChange={(event) => setGuidelines((current) => ({ ...current, preferredTerms: event.target.value }))}
                  rows={3}
                  placeholder={"users → customers\ncheap → accessible"}
                  className="ink-rules"
                />
                <p className="mt-2 text-[11px] leading-4 text-[var(--text-soft)]">Saved in this browser only. Add verified source material to your internal review before relying on any claim.</p>
              </section>

              <section className="side-card ink-card dashboard-panel px-4 py-4 sm:px-5">
                <h2 className="ink-card__title">What gets checked</h2>
                <ul className="mt-3 space-y-2.5 text-xs text-[var(--text-soft)]">
                  {["Unsupported absolute or comparative claims", "Approved terminology substitutions", "Descriptive link text and long sentences", "Repeated all-caps language and tone"].map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-[var(--check)]">✓</span>{item}</li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] leading-4 text-[var(--text-soft)]">
                  Current prototype reviews text with local rules. Image, document and external-source verification are not yet enabled.
                </p>
              </section>
            </aside>
          </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

// Counts up from 0 to the target number.
function CountUp({ value }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(target);
      return undefined;
    }

    const duration = 1000;
    const startTime = performance.now();
    let frame;

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{display}</>;
}

function DashboardMetric({ label, value, tone, icon }) {
  return (
    <div className={`dashboard-metric dashboard-metric--${tone}`}>
      <span className="dashboard-metric__icon" aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[11px] font-semibold uppercase leading-snug tracking-wide text-[var(--text-soft)]">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text)]">
          <CountUp value={value} />
        </p>
      </div>
    </div>
  );
}

// Pure-SVG doughnut chart (no chart library needed): ring on the left, legend on the right.
function StatusDoughnut({ segments, total }) {
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const visibleCount = segments.filter((segment) => segment.count > 0).length;
  const gap = visibleCount > 1 ? 3 : 0;

  let consumed = 0;
  const arcs = segments.map((segment) => {
    const fraction = total ? segment.count / total : 0;
    const length = fraction > 0 ? Math.max(0.5, fraction * circumference - gap) : 0;
    const arc = { ...segment, length, offset: consumed + gap / 2 };
    consumed += fraction * circumference;
    return arc;
  });

  const focus = hovered ? segments.find((segment) => segment.key === hovered) : null;
  const summary = segments.map((segment) => `${segment.key} ${segment.count}`).join(", ");

  return (
    <div className="doughnut">
      <div className="doughnut__chart" role="img" aria-label={`Review status breakdown: ${summary}`}>
        <svg className="doughnut__svg" viewBox="0 0 120 120" aria-hidden="true">
          <g transform="rotate(-90 60 60)">
            <circle className="doughnut__track" cx="60" cy="60" r={radius} fill="none" strokeWidth="14" />
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                className={`doughnut__arc ${hovered && hovered !== arc.key ? "is-dim" : ""}`}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={hovered === arc.key ? 17 : 14}
                style={{
                  stroke: arc.color,
                  strokeDasharray: ready ? `${arc.length} ${circumference - arc.length}` : `0 ${circumference}`,
                  strokeDashoffset: -arc.offset,
                }}
                onMouseEnter={() => setHovered(arc.key)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </g>
        </svg>
        <div className="doughnut__center">
          <strong>{focus ? focus.count : total}</strong>
          <span>{focus ? focus.key : total === 1 ? "Review" : "Reviews"}</span>
        </div>
      </div>

      <ul className="doughnut__legend">
        {segments.map((segment) => (
          <li
            key={segment.key}
            className={`doughnut__row ${hovered === segment.key ? "is-active" : ""}`}
            onMouseEnter={() => setHovered(segment.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="doughnut__dot" style={{ "--seg": segment.color }} aria-hidden="true" />
            <span className="doughnut__name">{segment.key}</span>
            <span className="doughnut__count">{segment.count}</span>
          </li>
        ))}
        {total === 0 && (
          <li className="doughnut__empty">No reviews in this period yet.</li>
        )}
      </ul>
    </div>
  );
}

// Decorative stack of documents for the "Keep your review moving" card.
function DocStackArt() {
  return (
    <svg className="ink-next__art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="docA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--art-a1)" }} />
          <stop offset="1" style={{ stopColor: "var(--art-a2)" }} />
        </linearGradient>
        <linearGradient id="docB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--art-b1)" }} />
          <stop offset="1" style={{ stopColor: "var(--art-b2)" }} />
        </linearGradient>
      </defs>
      <g transform="rotate(10 60 60)">
        <rect x="46" y="14" width="52" height="68" rx="9" fill="url(#docB)" opacity="0.45" />
      </g>
      <g transform="rotate(-2 60 60)">
        <rect x="34" y="26" width="52" height="68" rx="9" fill="url(#docA)" opacity="0.7" />
      </g>
      <g transform="rotate(-12 60 60)">
        <rect x="24" y="36" width="54" height="70" rx="9" style={{ fill: "var(--art-doc)" }} stroke="url(#docA)" strokeWidth="2" />
        <rect x="33" y="50" width="30" height="4" rx="2" style={{ fill: "var(--art-line-warm)" }} />
        <rect x="33" y="60" width="36" height="4" rx="2" style={{ fill: "var(--art-line)" }} opacity="0.8" />
        <rect x="33" y="70" width="24" height="4" rx="2" style={{ fill: "var(--art-line)" }} opacity="0.55" />
        <rect x="33" y="80" width="32" height="4" rx="2" style={{ fill: "var(--art-line)" }} opacity="0.4" />
      </g>
    </svg>
  );
}

// Small inline icon set (no extra dependency). Social icons are simple original
// drawings, not the official brand logos.
function Icon({ name, size = 20 }) {
  const stroke = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    focusable: "false",
  };
  switch (name) {
    case "stack":
      return (
        <svg {...stroke}>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path d="m3 13 9 5 9-5" />
          <path d="m3 17.5 9 5 9-5" opacity="0.55" />
        </svg>
      );
    case "clock":
      return (
        <svg {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "check":
      return (
        <svg {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.8 2.8L16.5 9.5" />
        </svg>
      );
    case "flag":
      return (
        <svg {...stroke}>
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 4 2 4H5" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...stroke}>
          <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7L4.5 10.9 10.1 9 12 3.5Z" />
          <path d="M19 3v3M17.5 4.5h3" />
          <path d="M5.5 17.5v3M4 19h3" />
        </svg>
      );
    case "doc":
      return (
        <svg {...stroke}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...stroke}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "link":
      return (
        <svg {...stroke}>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      );
    case "templates":
      return (
        <svg {...stroke}>
          <rect x="3.5" y="3.5" width="17" height="6" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
      );
    case "globe":
      return (
        <svg {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.6 2.4 3.9 5.4 3.9 9S14.6 18.6 12 21c-2.6-2.4-3.9-5.4-3.9-9S9.4 5.4 12 3Z" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...stroke}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "clip":
      return (
        <svg {...stroke}>
          <path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L14 7" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...stroke}>
          <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5 3.8 3.8 0 0 1 17.5 18H7Z" />
        </svg>
      );
    case "notes":
      return (
        <svg {...stroke}>
          <rect x="4" y="3.5" width="16" height="17" rx="3" />
          <path d="M9 16V8l6 8V8" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...stroke}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 11v5M8 8v.01M12 16v-5M12 13c0-1.4 1-2 2.2-2 1.3 0 1.8.9 1.8 2.2V16" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...stroke}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.8" />
          <path d="M17 7v.01" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M13.5 20v-6.5h2.2l.4-2.6h-2.6V9.6c0-.8.4-1.3 1.4-1.3h1.3V6.1c-.4-.1-1.1-.1-1.8-.1-2 0-3.2 1.2-3.2 3.2v1.7H8.7v2.6h2.1V20" />
        </svg>
      );
    case "email":
      return (
        <svg {...stroke}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 8 8 5.5L20 8" />
        </svg>
      );
    case "blog":
      return (
        <svg {...stroke}>
          <path d="m4 20 1-4.2L16.5 4.3a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20Z" />
          <path d="m14.5 6.3 3.2 3.2" />
          <path d="M13 20h7" />
        </svg>
      );
    case "others":
      return (
        <svg {...stroke}>
          <rect x="4" y="4" width="7" height="7" rx="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" />
          <rect x="4" y="13" width="7" height="7" rx="2" />
          <path d="M16.5 13v7M13 16.5h7" />
        </svg>
      );
    default:
      return null;
  }
}