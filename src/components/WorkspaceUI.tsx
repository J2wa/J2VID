import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const WorkspaceUIContext = createContext<{
  theme: Theme; toggleTheme: () => void;
  isModelModalOpen: boolean; setIsModelModalOpen: (open: boolean) => void;
} | null>(null);

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('aces-video-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* Preferences can be unavailable in private browsers. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function WorkspaceUIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('aces-video-theme', theme); } catch { /* Keep in-memory preference. */ }
  }, [theme]);
  return <WorkspaceUIContext.Provider value={{ theme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light'), isModelModalOpen, setIsModelModalOpen }}>{children}</WorkspaceUIContext.Provider>;
}
export function useWorkspaceUI() {
  const value = useContext(WorkspaceUIContext);
  if (!value) throw new Error('WorkspaceUIProvider is required.');
  return value;
}
export function ThemeToggle() {
  const { theme, toggleTheme } = useWorkspaceUI();
  return <button type="button" onClick={toggleTheme} className="aces-nav-button inline-flex gap-2" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'}>
    {theme === 'dark' ? <Sun size={16} aria-hidden="true"/> : <Moon size={16} aria-hidden="true"/>}
    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
  </button>;
}
