import { useEffect, useRef, useState } from "react";
import { reviewScreenshot } from "../../api/reviewToolsApi.js";
import { reviewContent } from "../../lib/governance.js";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that image. Please choose another file."));
    reader.readAsDataURL(file);
  });
}

export default function ScreenshotReview({ preferredTerms, onUseText }) {
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const requestId = useRef(0);
  const result = analysis?.imageDataUrl === imageDataUrl && analysis?.preferredTerms === preferredTerms
    ? analysis.data
    : null;
  const localFindings = result?.extractedText
    ? reviewContent(result.extractedText, { preferredTerms })
    : [];

  useEffect(() => {
    requestId.current += 1;
    setBusy(false);
    setError("");
    setAnalysis(null);
  }, [preferredTerms]);

  useEffect(() => () => {
    requestId.current += 1;
  }, []);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setError("");
    setAnalysis(null);
    setBusy(false);
    setImageDataUrl("");
    setFileName("");
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Choose a PNG, JPEG, or WebP screenshot.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image no larger than 1.5 MB.");
      return;
    }
    try {
      const dataUrl = await readImage(file);
      if (requestId.current === currentRequest) {
        setImageDataUrl(dataUrl);
        setFileName(file.name);
      }
    } catch (readError) {
      if (requestId.current === currentRequest) setError(readError.message);
    }
  }

  async function runReview() {
    if (!imageDataUrl) return;
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    const image = imageDataUrl;
    const guidelines = preferredTerms;
    setBusy(true);
    setError("");
    setAnalysis(null);
    try {
      const data = await reviewScreenshot(image, guidelines);
      if (requestId.current === currentRequest) {
        setAnalysis({ imageDataUrl: image, preferredTerms: guidelines, data });
      }
    } catch (requestError) {
      if (requestId.current === currentRequest) setError(requestError.message);
    } finally {
      if (requestId.current === currentRequest) setBusy(false);
    }
  }

  return (
    <section aria-labelledby="screenshot-review-title" className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <h3 id="screenshot-review-title" className="text-sm font-semibold text-[var(--text)]">Screenshot-to-Review</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Add a poster, ad, or mockup to extract visible copy and flag possible readability or contrast concerns.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)]">
          Choose image
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="sr-only" />
        </label>
        {fileName && <span className="max-w-full truncate text-xs text-[var(--text-soft)]">{fileName}</span>}
        <button
          type="button"
          onClick={runReview}
          disabled={!imageDataUrl || busy}
          className="rounded-lg bg-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reviewing image…" : "Review screenshot"}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-[var(--text-soft)]">Image and extracted copy are sent to your server-configured AI provider. A vision-capable AI_MODEL is required. Results are advisory, not approval.</p>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">{error}</p>}
      {imageDataUrl && <img src={imageDataUrl} alt={`Selected screenshot: ${fileName}`} className="mt-3 max-h-64 max-w-full rounded-lg border border-[var(--border)] object-contain" />}
      {result && (
        <div aria-live="polite" className="mt-4 space-y-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-[var(--text)]">Extracted visible copy</h4>
              {result.extractedText && (
                <button type="button" onClick={() => onUseText(result.extractedText)} className="text-xs font-semibold text-[var(--accent-solid)] hover:underline">
                  Use in review draft
                </button>
              )}
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text-soft)]">{result.extractedText || "No visible copy was extracted."}</pre>
          </div>
          {result.extractedText && (
            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <h4 className="text-xs font-semibold text-[var(--text)]">Local brand-rule checks</h4>
              {localFindings.length ? (
                <ul className="mt-2 space-y-2">
                  {localFindings.map((finding) => (
                    <li key={finding.id} className="rounded-lg bg-[var(--surface-2)] p-3">
                      <p className="text-xs font-semibold text-[var(--text)]">{finding.category}: “{finding.excerpt}”</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{finding.explanation}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-[var(--text-soft)]">No configured local text rules were triggered. That is not a confirmation that the copy is accurate or accessible.</p>
              )}
            </section>
          )}
          {result.findings.length === 0 ? (
            <p className="text-xs text-[var(--text-soft)]">No specific issues were identified. This does not confirm that the design is accessible or on-brand.</p>
          ) : result.findings.map((item, index) => (
            <article key={`${index}-${item.excerpt}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent-solid)]">{item.type}</span>
              <p className="mt-1 text-xs font-semibold text-[var(--text)]">{item.excerpt}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{item.concern}</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]"><strong>Inspect:</strong> {item.suggestion}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
