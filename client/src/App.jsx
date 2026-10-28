import { addNotification } from "./lib/notificationStore.js";
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Workflow from "./pages/Workflow.jsx";
import Projects from "./pages/Projects.jsx";
import BrandKits from "./pages/BrandKits.jsx";
import Community from "./pages/Community.jsx";
import CompanyAdmin from "./pages/CompanyAdmin.jsx";
import DriftTimeMachine from "./pages/DriftTimeMachine.jsx";

import ClaimReview from "./pages/ClaimReview.jsx";

import QualityEvaluation from "./pages/QualityEvaluation.jsx";

import LoadBar from "./components/Loadbar.jsx";
import DashboardLoader from "./components/DashboardLoader.jsx";
import { BrandProvider } from "./context/BrandContext.jsx";
import { createProjectId } from "./lib/projectsStore.js";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";

// Token ache kina, ar expire hoyni kina check kore.
// Expired ba kharap token hole seta delete kore false return kore.
function hasValidToken() {
  const token =
    localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
  if (!token) return false;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("inkloom-token");
      localStorage.removeItem("brandloom-token");
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem("inkloom-token");
    localStorage.removeItem("brandloom-token");
    return false;
  }
}

// Login na thakle user ke login page e pathabe.
// Kon page e jete chaichilo seta save kore rakhe, login-er por oi page e niye jabe.
function RequireAuth({ children }) {
  const location = useLocation();

  if (!hasValidToken()) {
    sessionStorage.setItem("inkloom-after-login", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}

function WorkflowRoute() {
  const { projectId } = useParams();
  return (
    <BrandProvider key={projectId} projectId={projectId}>
      <Workflow />
    </BrandProvider>
  );
}

function NewWorkflowRedirect() {
  const idRef = useRef(createProjectId());
  return <Navigate to={`/workflow/${idRef.current}`} replace />;
}

// Google/GitHub OAuth redirects here with ?token=... after login.
// After saving the token, show the /loading screen, then continue to /workflow.
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("token");
  if (token) {
    const previousToken = localStorage.getItem("inkloom-token");
    localStorage.setItem("inkloom-token", token);
    // Only notify for a new sign-in (also stops duplicates in React dev mode)
    if (token !== previousToken) {
      addNotification("Authentication successful. You are now signed in to your Inkloom AI workspace.");
    }
  }
  navigate("/loading", { replace: true });
}, [navigate]);

  return null;
}

const LOAD_TIME = 2000; // the load bar on first app load lasts 2 seconds

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOAD_TIME);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <LoadBar duration={LOAD_TIME} />;

  return (
    <WorkspaceProvider>
      <Routes>
        {/* ---------- Public pages ---------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/loading" element={<DashboardLoader />} />

        {/* ---------- Dashboard pages (login lagbe) ---------- */}
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <Projects />
            </RequireAuth>
          }
        />
        <Route
          path="/brand-kits"
          element={
            <RequireAuth>
              <BrandKits />
            </RequireAuth>
          }
        />
        <Route path="/templates" element={<Navigate to="/brand-kits" replace />} />
        <Route
          path="/community"
          element={
            <RequireAuth>
              <Community />
            </RequireAuth>
          }
        />
        <Route
          path="/drift"
          element={
            <RequireAuth>
              <DriftTimeMachine />
            </RequireAuth>
          }
        />
        <Route
          path="/quality"
          element={
            <RequireAuth>
              <QualityEvaluation />
            </RequireAuth>
          }
        />
        <Route
          path="/company-admin"
          element={
            <RequireAuth>
              <CompanyAdmin />
            </RequireAuth>
          }
        />
        <Route
          path="/claim-review"
          element={
            <RequireAuth>
              <ClaimReview />
            </RequireAuth>
          }
        />
        <Route
          path="/workflow"
          element={
            <RequireAuth>
              <NewWorkflowRedirect />
            </RequireAuth>
          }
        />
        <Route
          path="/workflow/:projectId"
          element={
            <RequireAuth>
              <WorkflowRoute />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkspaceProvider>
  );
}