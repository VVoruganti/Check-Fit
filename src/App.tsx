import { BrowserRouter, Routes, Route } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PatternProvider } from "@/context/PatternContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import UploadPage from "@/pages/UploadPage";
import MeasurementsPage from "@/pages/MeasurementsPage";
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
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/pattern" element={<PatternViewerPage />} />
            <Route path="/assembly" element={<AssemblyPage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </PatternProvider>
  );
}

export default App;
