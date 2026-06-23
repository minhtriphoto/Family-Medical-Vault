/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { loginUser } from '../lib/db';
import { UserSession } from '../types';
import { Shield, Lock, Mail, Eye, EyeOff, Activity, UserCheck, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthViewProps {
  onLoginSuccess: (session: UserSession) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function AuthView({ onLoginSuccess, darkMode, onToggleTheme }: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPromptPassword, setAdminPromptPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const result = loginUser(email, password);
      setLoading(false);
      if ('error' in result) {
        setErrorMsg(result.error);
      } else {
        onLoginSuccess(result);
      }
    }, 600);
  };

  const handleQuickLogin = (role: 'admin' | 'member') => {
    if (role === 'admin') {
      setShowAdminPrompt(true);
      return;
    }

    const result = loginUser('member@gmail.com', '123456');
    if (!('error' in result)) {
      onLoginSuccess(result);
    } else {
      setErrorMsg(result.error);
    }
  };

  const submitAdminPrompt = () => {
    if (!adminPromptPassword) return;
    const result = loginUser('admin@gmail.com', adminPromptPassword);
    if (!('error' in result)) {
      onLoginSuccess(result);
      setShowAdminPrompt(false);
    } else {
      setErrorMsg(result.error);
      setShowAdminPrompt(false);
    }
    setAdminPromptPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 p-4 font-sans relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-md backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
          title="Đổi giao diện sáng/tối"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 px-6 py-8 text-center text-white relative">
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs backdrop-blur-xs font-mono text-blue-100 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" /> Secure Vault
          </div>
          <div className="mx-auto w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/20">
            <Activity className="w-8 h-8 text-blue-100 animate-pulse" />
          </div>
          <h1 id="auth-title" className="text-2xl font-bold font-sans tracking-tight">Family Medical Vault</h1>
          <p className="text-sm text-blue-100/90 mt-1 max-w-xs mx-auto">
            Hồ sơ bệnh án & Chỉ số sức khỏe liên thông gia đình, bảo mật tuyệt đối
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900 flex gap-2">
                <span className="font-bold">Lỗi:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email của bạn
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-slate-400">Tối thiểu 6 ký tự</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Đăng nhập / Đăng ký mới'
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <span className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
            </span>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-widest">
              Đăng nhập nhanh
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="quick-admin-btn"
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex items-center justify-center gap-1.5 p-2 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold border border-blue-100/50 dark:border-blue-900/30 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              id="quick-member-btn"
              type="button"
              onClick={() => handleQuickLogin('member')}
              className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200/50 dark:border-slate-700/30 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Thành viên Con</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            <p>Mẹo: Nhập email chưa từng đăng ký và mật khẩu bất kỳ (≥6 ký tự) để tự động thiết lập gia đình mới.</p>
          </div>
        </div>
      </motion.div>

      {showAdminPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Nhập mật khẩu Admin</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Vui lòng nhập mật khẩu tài khoản Admin để tiếp tục</p>
            <form onSubmit={(e) => { e.preventDefault(); submitAdminPrompt(); }}>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={adminPromptPassword}
                onChange={(e) => setAdminPromptPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPrompt(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
