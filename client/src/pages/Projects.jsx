import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import ReviewHistoryDashboard from "../components/ReviewHistoryDashboard.jsx";
import { listReviews } from "../lib/reviewStore.js";

export default function Projects() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    try {
      setReviews(listReviews());
    } catch {
      // A corrupted localStorage entry should never blank the page.
      setReviews([]);
    }
  }, []);

  return (
    <AppShell>
      <ReviewHistoryDashboard reviews={reviews} />
    </AppShell>
  );
}