const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function postReviewTool(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/review-tools/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the review service. Check your connection and try again.");
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error("The review service returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(data.error || `Review request failed (${response.status}).`);
  }
  return data;
}

export function runChaosTest(content, preferredTerms) {
  return postReviewTool("chaos-test", { content, preferredTerms });
}

export function reviewScreenshot(imageDataUrl, preferredTerms) {
  return postReviewTool("screenshot", { imageDataUrl, preferredTerms });
}

export function rewriteForFindings(content, findings, preferredTerms) {
  return postReviewTool("auto-fix", { content, findings, preferredTerms });
}