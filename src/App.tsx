import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { NavigationTab } from './types';

import { DashboardPage } from './pages/DashboardPage';
import { ScanEmailPage } from './pages/ScanEmailPage';
import { EmailDnaPage } from './pages/EmailDnaPage';
import { ThreatIntelligencePage } from './pages/ThreatIntelligencePage';
import { ScanHistoryPage } from './pages/ScanHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'scan-email':
        return <ScanEmailPage />;
      case 'email-dna':
        return <EmailDnaPage />;
      case 'threat-intel':
        return <ThreatIntelligencePage />;
      case 'scan-history':
        return <ScanHistoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <ThemeProvider>
      <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
        {renderActivePage()}
      </AppLayout>
    </ThemeProvider>
  );
};

export default App;

