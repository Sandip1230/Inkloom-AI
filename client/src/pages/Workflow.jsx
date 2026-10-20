import { useBrand } from "../context/BrandContext.jsx";
import AppShell from "../components/AppShell.jsx";
import ProgressStepper from "../components/ProgressStepper.jsx";
import BrandVisual from "../components/BrandVisual.jsx";
import StagePanel from "../components/StagePanel.jsx";
import DiscoverForm from "../components/stages/DiscoverForm.jsx";
import PositionCard from "../components/stages/PositionCard.jsx";
import PersonalityBoard from "../components/stages/PersonalityBoard.jsx";
import VisualDirection from "../components/stages/VisualDirection.jsx";
import ConsistencyChecker from "../components/stages/ConsistencyChecker.jsx";
import BrandKitExport from "../components/stages/BrandKitExport.jsx";

export default function Workflow() {
  const { brand, activeStage, goToStage, selectName } = useBrand();
  const completedStages = Object.keys(brand.stageOutputs);

  return (
    <AppShell>
      <div className="flex h-full flex-col px-4 py-6 sm:px-9">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-solid)]">
          Presented with the support of Inkloom
        </span>

        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
          Build a brand that can{" "}
          <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
            think.
          </span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-soft)]">
          From a rough idea to a complete brand system with the power of AI.
        </p>

        <div className="mt-6 flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ProgressStepper
              currentStage={activeStage}
              completedStages={completedStages}
              onSelect={goToStage}
            />

            <div className="scrollbar-hide relative mt-5 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6 lg:p-8">
              {activeStage === "understand" && !brand.stageOutputs.understand && (
                <div className="absolute right-6 top-6 hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
                    </svg>
                  </span>
                  <span className="leading-tight">
                    <span className="block text-xs font-semibold text-[var(--text)]">Powered by AI</span>
                    <span className="block text-[11px] text-[var(--text-soft)]">From idea to brand, step by step</span>
                  </span>
                </div>
              )}

              {activeStage === "understand" && <DiscoverForm />}

              {activeStage === "position" && (
                <StagePanel stageKey="position">
                  {(output) => <PositionCard position={output} />}
                </StagePanel>
              )}

              {activeStage === "shape" && (
                <StagePanel stageKey="shape">
                  {(output) => (
                    <PersonalityBoard
                      {...output}
                      selectedName={brand.selectedName}
                      onSelectName={selectName}
                    />
                  )}
                </StagePanel>
              )}

              {activeStage === "visualize" && (
                <StagePanel stageKey="visualize">
                  {(output) => <VisualDirection direction={output} />}
                </StagePanel>
              )}

              {activeStage === "challenge" && (
                <StagePanel stageKey="challenge">
                  {(output) => (
                    <ConsistencyChecker
                      findings={output?.findings}
                      consistent={output?.consistent}
                      score={output?.score}
                      verdict={output?.verdict}
                      draftFindingsCount={output?.draftFindingsCount}
                    />
                  )}
                </StagePanel>
              )}

              {activeStage === "deliver" && (
                <StagePanel stageKey="deliver">
                  {(output) => <BrandKitExport brandKit={output} />}
                </StagePanel>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-auto">
            <BrandVisual />
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-[var(--text-soft)]">
          <span>Brand Strategy • AI Design • Real Launch Assets</span>
          <span>Brandloom • Make Ideas Matter</span>
        </div>
      </div>
    </AppShell>
  );
}