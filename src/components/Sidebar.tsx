/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserSession } from '../types';
import { logout } from '../lib/db';
import { 
  LayoutDashboard, 
  Users, 
  FileHeart, 
  FolderArchive, 
  Pill, 
  Clock, 
  Activity, 
  Coins, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  ShieldAlert,
  User,
  Brain
} from 'lucide-react';


interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserSession;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  session,
  onLogout,
  darkMode,
  setDarkMode,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Bảng tổng quan', icon: LayoutDashboard },
    { id: 'members', label: 'Thành viên gia đình', icon: Users },
    { id: 'ai-screen', label: 'AI Sàng Lọc Sức Khỏe', icon: Brain },
    { id: 'history', label: 'Lịch sử khám bệnh', icon: FileHeart },
    { id: 'docs', label: 'Kho tài liệu y tế', icon: FolderArchive },
    { id: 'prescriptions', label: 'Quản lý đơn thuốc', icon: Pill },
    { id: 'reminders', label: 'Lịch nhắc y tế', icon: Clock },
    { id: 'metrics', label: 'Chỉ số sức khỏe', icon: Activity },
    { id: 'expenses', label: 'Chi phí y tế', icon: Coins },
    { id: 'settings', label: 'Hệ thống, Cài đặt', icon: Settings },
  ];

  const handleTabSelect = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  const activeClass = "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold";
  const inactiveClass = "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60";

  return (
    <>
      {/* Mobile Top Bar (header) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-45">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans">FM Vault</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1 px-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            title="Đổi giao diện sáng/tối"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 text-slate-600 dark:text-slate-300"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Backdrop overlay on mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40"
        />
      )}

      {/* Main Navigation Sidebar container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 md:translate-x-0 flex flex-col h-screen
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-50 tracking-tight leading-none">Family Vault</h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-0.5 block">Medical Space</span>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hidden md:block p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
            title="Chuyển chế độ sáng tối"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 my-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2 text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{session.memberName || 'Đầu máy'}</p>
              <p className="text-[10px] text-slate-400 truncate">{session.email}</p>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 font-sans ${
            session.role === 'admin' 
              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/10' 
              : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50'
          }`}>
            {session.role === 'admin' ? 'QTV' : 'MEMBER'}
          </span>
        </div>

        {/* Menu Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isTabActive = currentTab === item.id;
            return (
              <button
                id={`sidebar-link-${item.id}`}
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-xl transition-all duration-200 cursor-pointer ${
                  isTabActive ? activeClass : inactiveClass
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isTabActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Bottom Trigger */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            id="sidebar-logout-btn"
            onClick={() => {
              logout();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất khỏi tủ</span>
          </button>
          <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2 font-mono">
            Version 1.2.0 • Bảo mật
          </div>
        </div>
      </aside>
    </>
  );
}
