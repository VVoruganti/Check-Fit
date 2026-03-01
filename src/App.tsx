import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PatternProvider } from "@/context/PatternContext";
import Layout from "@/components/Layout";
import WizardLayout from "@/components/WizardLayout";
import HomePage from "@/pages/HomePage";
import UploadStep from "@/pages/wizard/UploadStep";
import AnalyzeStep from "@/pages/wizard/AnalyzeStep";
import RefineStep from "@/pages/wizard/RefineStep";
import MeasurementsStep from "@/pages/wizard/MeasurementsStep";
import GenerateStep from "@/pages/wizard/GenerateStep";
import PatternViewerPage from "@/pages/PatternViewerPage";
import InstructionsPage from "@/pages/InstructionsPage";
import AssemblyPage from "@/pages/AssemblyPage";

function App() {
  return (
    <PatternProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<WizardLayout />}>
                <Route index element={<Navigate to="/create/upload" replace />} />
                <Route path="upload" element={<UploadStep />} />
                <Route path="analyze" element={<AnalyzeStep />} />
                <Route path="refine" element={<RefineStep />} />
                <Route path="measure" element={<MeasurementsStep />} />
                <Route path="generate" element={<GenerateStep />} />
              </Route>
              <Route path="/pattern" element={<PatternViewerPage />} />
              <Route path="/assembly" element={<AssemblyPage />} />
              <Route path="/instructions" element={<InstructionsPage />} />
              {/* Redirects from old routes */}
              <Route path="/upload" element={<Navigate to="/create/upload" replace />} />
              <Route path="/measurements" element={<Navigate to="/create/measure" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PatternProvider>
  );
}

export default App;
