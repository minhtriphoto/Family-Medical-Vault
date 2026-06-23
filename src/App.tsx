/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession } from './types';
import { getCurrentSession, getMembers } from './lib/db';

// Import newly created sub-views
import AuthView from './components/AuthView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import MembersView from './components/MembersView';
import RecordsView from './components/RecordsView';
import DocumentsView from './components/DocumentsView';
import PrescriptionsView from './components/PrescriptionsView';
import RemindersView from './components/RemindersView';
import MetricsView from './components/MetricsView';
import ExpensesView from './components/ExpensesView';
import SettingsView from './components/SettingsView';
import AIScreeningView from './components/AIScreeningView';
import SharedRecordView from './components/SharedRecordView';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => getCurrentSession());
  const [activeTab, setActiveTab ] = useState<string>('dashboard');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Trigger quick forms
  const [isReminderFormForced, setIsReminderFormForced] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sToken = urlParams.get('share');
    if (sToken) {
      setShareToken(sToken);
    }
  }, []);

  // Sync session on mount / storage change
  useEffect(() => {
    const active = getCurrentSession();
    setSession(active);
  }, []);

  // Theme Syncing class list injection
  useEffect(() => {
    const savedTheme = localStorage.getItem('family_medical_vault_theme') || 'light';
    setThemeMode(savedTheme as 'light' | 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const target = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(target);
    localStorage.setItem('family_medical_vault_theme', target);
    if (target === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAuthComplete = (newSession: UserSession) => {
    setSession(newSession);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('family_medical_vault_session');
    setSession(null);
    setActiveTab('dashboard');
  };

  if (shareToken) {
    return (
      <div className={themeMode === 'dark' ? 'dark' : ''}>
        <SharedRecordView token={shareToken} />
      </div>
    );
  }

  if (!session) {
    return (
      <AuthView 
        onLoginSuccess={handleAuthComplete} 
        darkMode={themeMode === 'dark'}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#080c13] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-200">
      {/* Dynamic responsive Navigation sidebar */}
      <Sidebar 
        currentTab={activeTab} 
        setCurrentTab={setActiveTab} 
        session={session} 
        onLogout={handleLogout}
        darkMode={themeMode === 'dark'}
        setDarkMode={() => handleToggleTheme()}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main interactive body frame */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 transition-all ml-0 md:ml-64 overflow-x-hidden min-h-screen pb-16">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView 
              session={session} 
              setCurrentTab={setActiveTab} 
              onQuickAdd={(viewType) => {
                if (viewType === 'record') {
                  setActiveTab('history');
                } else if (viewType === 'metric') {
                  setActiveTab('metrics');
                } else if (viewType === 'reminder') {
                  setActiveTab('reminders');
                  setIsReminderFormForced(true);
                }
              }}
            />
          )}
          {activeTab === 'members' && (
            <MembersView 
              session={session} 
            />
          )}
          {activeTab === 'history' && (
            <RecordsView 
              session={session} 
            />
          )}
          {activeTab === 'docs' && (
            <DocumentsView 
              session={session} 
            />
          )}
          {activeTab === 'prescriptions' && (
            <PrescriptionsView 
              session={session} 
            />
          )}
          {activeTab === 'reminders' && (
            <RemindersView 
              session={session} 
              isFormOpenImmediately={isReminderFormForced}
              onFormClosed={() => setIsReminderFormForced(false)}
            />
          )}
          {activeTab === 'metrics' && (
            <MetricsView 
              session={session} 
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesView 
              session={session} 
            />
          )}
          {activeTab === 'ai-screen' && (
            <AIScreeningView session={session} />
          )}
          {activeTab === 'settings' && (
            <SettingsView 
              session={session} 
              onLogout={handleLogout}
              darkMode={themeMode === 'dark'}
              onToggleTheme={handleToggleTheme}
            />
          )}
        </div>
      </main>
    </div>
  );
}
