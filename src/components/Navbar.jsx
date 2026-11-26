import { NavLink } from 'react-router-dom';
import { Camera, History, Home, Map, Moon, ShieldAlert, Sun } from 'lucide-react';
import { isMockMode } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const mock = isMockMode();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-icon">
            <ShieldAlert size={19} strokeWidth={2.4} />
          </span>
          <span>RoadVision</span>
        </NavLink>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Home size={16} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/report"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Camera size={16} />
            <span>Scan & Report</span>
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Map size={16} />
            <span>Hazard Map</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <History size={16} />
            <span>Report History</span>
          </NavLink>
        </nav>

        <div className="nav-right">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <div
            className={`mode-pill ${mock ? '' : 'live'}`}
            title={
              mock
                ? 'Using sample YOLOv8 responses (set VITE_USE_MOCK_API=false for FastAPI)'
                : 'Connected to FastAPI backend'
            }
          >
            <span className="mode-dot" />
            <span>{mock ? 'Sample ML Mode' : 'FastAPI Live'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
