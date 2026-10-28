import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Bell, Shield, Terminal, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from '../../types';
import { checkBackendHealth } from '../../services/api';

interface HeaderProps {
  activeTab: NavigationTab;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkStatus = () => {
    setBackendStatus('checking');
    checkBackendHealth()
      .then((data) => {
        if (data.status === 'healthy') {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const titleMap: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Security Operations Dashboard',
      subtitle: 'Real-time overview of inbound email threat intelligence',
    },
    'scan-email': {
      title: 'Single Email Analyzer',
      subtitle: 'Inspect email headers, content, and forensic heuristics with ML',
    },
    'email-dna': {
      title: 'Email DNA Fingerprinting',
      subtitle: 'Analyze syntactic tokens, sender authenticity, and reputation signatures',
    },
    'threat-intel': {
      title: 'Threat Intelligence Feeds',
      subtitle: 'Global phishing vectors and malicious domain blacklists',
    },
    'scan-history': {
      title: 'Audit & Scan History',
      subtitle: 'Searchable log of previous threat evaluations and forensic reports',
    },
    reports: {
      title: 'Compliance & Threat Reports',
      subtitle: 'Export executive summaries and RFC-compliant forensic dossiers',
    },
    settings: {
      title: 'System & Engine Configuration',
      subtitle: 'Configure FastAPI endpoints, ML thresholds, and notification webhooks',
    },
  };

  const current = titleMap[activeTab];

  return (
    <header className="h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Real Backend Status Indicator */}
        <div 
          onClick={checkStatus}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:border-teal-500/40 transition-colors"
          title="Click to re-check FastAPI backend status"
        >
          <Terminal className="w-3.5 h-3.5 text-teal-500" />
          <span>FastAPI:</span>
          {backendStatus === 'online' && (
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected (Port 8000)
            </span>
          )}
          {backendStatus === 'offline' && (
            <span className="inline-flex items-center gap-1.5 text-rose-500 font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Offline
            </span>
          )}
          {backendStatus === 'checking' && (
            <span className="inline-flex items-center gap-1 text-slate-400 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
              Probing...
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors relative"
          title="Threat Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500" />
        </button>

        {/* Profile Pill */}
        <div className="ml-2 pl-3 border-l border-slate-200 dark:border-navy-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
            SecOps Admin
          </span>
        </div>
      </div>
    </header>
  );
};
