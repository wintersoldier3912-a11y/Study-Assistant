
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Settings as SettingsIcon,
  BrainCircuit,
  Zap,
  Coffee,
  CloudOff
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import StudyMaterial from './pages/StudyMaterial';
import Tutor from './pages/Tutor';
import ReviewSession from './pages/ReviewSession';
import SettingsPage from './pages/Settings';
import { AccessibilitySettings } from './types';
import { dbService } from './services/dbService';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  dyslexiaFont: true, // Enabled by default as requested
  highContrast: false,
  textToSpeech: false,
  ttsSpeed: 1.0,
  adhdFocusMode: false,
  lowPressureMode: false,
  extendedTime: false,
  showBreakPrompts: true
};

const SettingsContext = createContext<{
  settings: AccessibilitySettings;
  updateSettings: (s: Partial<AccessibilitySettings>) => void;
}>({ settings: DEFAULT_SETTINGS, updateSettings: () => {} });

export const useSettings = () => useContext(SettingsContext);

const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { settings } = useSettings();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBreak, setShowBreak] = useState(false);

  // Sync accessibility classes to the body for global effect
  useEffect(() => {
    if (settings.dyslexiaFont) {
      document.body.classList.add('dyslexia-font');
    } else {
      document.body.classList.remove('dyslexia-font');
    }

    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [settings.dyslexiaFont, settings.highContrast]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ADHD Focus Mode - 15 minute break timer
  useEffect(() => {
    if (settings.adhdFocusMode && settings.showBreakPrompts) {
      const timer = setInterval(() => {
        setShowBreak(true);
      }, 15 * 60 * 1000);
      return () => clearInterval(timer);
    }
  }, [settings.adhdFocusMode, settings.showBreakPrompts]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BrainCircuit size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">AISA</span>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarLink to="/materials" icon={BookOpen} label="Library" active={location.pathname === '/materials'} />
          <SidebarLink to="/tutor" icon={MessageSquare} label="AI Tutor" active={location.pathname === '/tutor'} />
          <SidebarLink to="/review" icon={Zap} label="Daily Review" active={location.pathname === '/review'} />
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
          {isOffline && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-xs flex items-center space-x-2">
              <CloudOff size={14} />
              <span>Offline Mode</span>
            </div>
          )}
          <SidebarLink to="/settings" icon={SettingsIcon} label="Accessibility" active={location.pathname === '/settings'} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Break Prompt Modal */}
      {showBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coffee size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Focus Break</h2>
            <p className="text-slate-500 mb-8">You've been studying hard for 15 minutes! Stand up, stretch, and grab some water.</p>
            <button 
              onClick={() => setShowBreak(false)}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
            >
              Resume Study
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('aisa_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('aisa_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <Router>
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materials" element={<StudyMaterial />} />
            <Route path="/tutor" element={<Tutor />} />
            <Route path="/review" element={<ReviewSession />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </SettingsContext.Provider>
    </Router>
  );
}
