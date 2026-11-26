import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ReportFlowPage from './pages/ReportFlowPage';
import MapPage from './pages/MapPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/report" element={<ReportFlowPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/reports" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="footer-inner">
              <span>RoadVision — Automated Road Damage Detection & Reporting</span>
              <span>
                Classes: D00 (Longitudinal) · D10 (Transverse) · D20 (Alligator) · D40 (Pothole)
              </span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
