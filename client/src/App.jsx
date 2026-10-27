import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
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
<<<<<<< HEAD
import ClaimReview from "./pages/ClaimReview.jsx";
=======
import QualityEvaluation from "./pages/QualityEvaluation.jsx";
>>>>>>> 0e7088404d1bf75debf90b750f983c32a7d4c664
import LoadBar from "./components/Loadbar.jsx";
import DashboardLoader from "./components/DashboardLoader.jsx";
import { BrandProvider } from "./context/BrandContext.jsx";
import { createProjectId } from "./lib/projectsStore.js";

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
    if (token) localStorage.setItem("inkloom-token", token);
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
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/loading" element={<DashboardLoader />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/brand-kits" element={<BrandKits />} />
      <Route path="/templates" element={<Navigate to="/brand-kits" replace />} />
      <Route path="/community" element={<Community />} />
      <Route path="/drift" element={<DriftTimeMachine />} />
      <Route path="/quality" element={<QualityEvaluation />} />
      <Route path="/company-admin" element={<CompanyAdmin />} />
      <Route path="/claim-review" element={<ClaimReview />} />
      <Route path="/workflow" element={<NewWorkflowRedirect />} />
      <Route path="/workflow/:projectId" element={<WorkflowRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}