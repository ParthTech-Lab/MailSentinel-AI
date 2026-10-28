import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ScanSearch, 
  Dna, 
  Radio, 
  History, 
  FileText, 
  Settings, 
  ExternalLink 
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'scan-email', label: 'Scan Email', icon: <ScanSearch className="w-4 h-4" />, badge: 'AI' },
    { id: 'email-dna', label: 'Email DNA', icon: <Dna className="w-4 h-4" /> },
    { id: 'threat-intel', label: 'Threat Intelligence', icon: <Radio className="w-4 h-4" /> },
    { id: 'scan-history', label: 'Scan History', icon: <History className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-navy-950 shadow-md shadow-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
                  MailSentinel
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Threat Defense Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Security Operations
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-teal-500' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-500 text-navy-950 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Engine Status & Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-navy-800">
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 mb-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-400">ML Engine</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Standby
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Scikit-learn model ready for backend linkage.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 px-1">
            <span>v1.0.0-beta</span>
            <span className="flex items-center gap-1 hover:text-teal-400 cursor-pointer">
              Docs <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

