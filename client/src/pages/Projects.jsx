import AppShell from "../components/AppShell.jsx";
import ReviewHistoryDashboard from "../components/ReviewHistoryDashboard.jsx";
import { useReviewStore } from "../lib/useReviewStore.js";

export default function Projects() {
  const { reviews, error } = useReviewStore();

  return (
    <AppShell>
      {error && <p role="alert" className="px-6 pt-4 text-sm text-red-500">{error}</p>}
      <ReviewHistoryDashboard reviews={reviews} />
    </AppShell>
  );
}