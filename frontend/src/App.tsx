import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ChildDetail from "./pages/ChildDetail";
import WeeklySummary from "./pages/WeeklySummary";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/child/:id" element={<ChildDetail />} />
        <Route path="/child/:id/summary" element={<WeeklySummary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
