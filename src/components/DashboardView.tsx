/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getMembers, 
  getMedicalRecords, 
  getReminders, 
  getExpenses, 
  getPrescriptions 
} from '../lib/db';
import { UserSession } from '../types';
import { 
  Users, 
  Clock, 
  Pill, 
  FileHeart, 
  AlertTriangle, 
  CreditCard,
  Plus, 
  Hospital,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  session: UserSession;
  setCurrentTab: (tab: string) => void;
  // Trigger quick forms from dashboard
  onQuickAdd: (view: 'record'|'metric'|'reminder') => void;
}

export default function DashboardView({ session, setCurrentTab, onQuickAdd }: DashboardViewProps) {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

  const members = getMembers(session.familyId);
  const records = getMedicalRecords(session.familyId);
  const reminders = getReminders(session.familyId);
  const expenses = getExpenses(session.familyId);
  const prescriptions = getPrescriptions(session.familyId);

  useEffect(() => {
    let isMounted = true;
    const loadSummary = async () => {
      try {
        const response = await fetch('/api/ai/health-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members, records: records.slice(0, 10) }) // Send only recent records
        });
        const data = await response.json();
        if (data.result && isMounted) {
          setAiSummary(data.result);
        }
      } catch (err) {
        console.error('Failed to fetch AI summary:', err);
      } finally {
        if (isMounted) setIsSummaryLoading(false);
      }
    };
    loadSummary();
    return () => { isMounted = false; };
  }, [session.familyId, members, records]);

  // 1. Members count
  const memberCount = members.length;

  // 2. Total medical cost in current month (June 2026 based on Current Time: 2026-06-13)
  const currentMonth = '2026-06';
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalMonthlyCost = currentMonthExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const selfPaidMonthlyCost = currentMonthExpenses.reduce((sum, e) => sum + e.selfPaidAmount, 0);

  // 3. Active medications currently in use
  const activeMeds: { medName: string; strength: string; memberName: string; dosage: string }[] = [];
  prescriptions.forEach(rx => {
    const member = members.find(m => m.id === rx.memberId);
    if (member) {
      rx.meds.forEach(med => {
        if (med.status === 'active' || med.status === 'chronic') {
          activeMeds.push({
            medName: med.name,
            strength: med.strength,
            memberName: member.name,
            dosage: med.dosage
          });
        }
      });
    }
  });

  // 4. Allergy warning list
  const allergyAlerts: { memberName: string; allergy: string; relationship: string }[] = [];
  members.forEach(m => {
    if (m.allergies && m.allergies !== 'Chưa khai báo' && m.allergies !== 'Không có') {
      allergyAlerts.push({
        memberName: m.name,
        relationship: m.relationship,
        allergy: m.allergies
      });
    }
  });

  // 5. Upcoming Medical Appointments (Tái khám sắp tới / Hẹn lịch)
  const upcomingAppointments = reminders
    .filter(r => r.type === 'appointment' && r.status === 'pending' && r.date >= '2026-06-01')
    .slice(0, 4);

  // 6. Latest Medical Records
  const latestRecords = records.slice(0, 3);

  // Quick formatter
  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 p-4 sm:p-5 rounded-2xl border border-blue-100/40 dark:border-indigo-900/10">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            Xin chào, Gia đình {members[0]?.name.split(' ').slice(-2).join(' ') || session.memberName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Mọi hồ sơ y tế, thuốc đang dùng và lịch trình sức khỏe gia đình đều đồng bộ bảo mật.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onQuickAdd('record')}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-[11px] sm:text-xs rounded-xl shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Ghi ca khám</span>
          </button>
          <button
            onClick={() => onQuickAdd('metric')}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-[11px] sm:text-xs rounded-xl shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            <Activity className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Đo sinh hiệu</span>
          </button>
          <button
            onClick={() => onQuickAdd('reminder')}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] sm:text-xs rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Lịch nhắc</span>
          </button>
        </div>
      </div>

      {/* AI Health Summary */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0 self-start">
            <Sparkles className="w-5 h-5 mx-auto" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-1 flex items-center gap-2">
              Gemini AI: Tóm tắt chung sức khỏe tuần qua
            </h3>
            {isSummaryLoading ? (
              <div className="animate-pulse space-y-2 mt-2">
                <div className="h-3 bg-indigo-200/50 dark:bg-indigo-800/50 rounded w-full"></div>
                <div className="h-3 bg-indigo-200/50 dark:bg-indigo-800/50 rounded w-5/6"></div>
              </div>
            ) : (
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                {aiSummary || 'Hệ thống AI hiện chưa thể tóm tắt do thiếu dữ liệu hoặc kết nối có vấn đề.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members KPI */}
        <div 
          onClick={() => setCurrentTab('members')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-400/30 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thành viên gia đình</span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">{memberCount}</span>
            <span className="text-xs text-slate-400">người</span>
          </div>
          <div className="mt-3 sm:mt-3.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <span>Quản lý lý lịch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Expenses KPI */}
        <div 
          onClick={() => setCurrentTab('expenses')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-400/30 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chi phí y tế tháng 6</span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5 flex flex-col min-w-0">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 truncate block font-mono" title={formatVND(totalMonthlyCost)}>
              {formatVND(totalMonthlyCost)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate block" title={`Tự chi: ${formatVND(selfPaidMonthlyCost)}`}>
              Tự chi: {formatVND(selfPaidMonthlyCost)}
            </span>
          </div>
          <div className="mt-3 sm:mt-3.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>Xem báo cáo chi</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Medication count KPI */}
        <div 
          onClick={() => setCurrentTab('prescriptions')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thuốc uống điều trị</span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
              <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">{activeMeds.length}</span>
            <span className="text-xs text-slate-400">loại dùng</span>
          </div>
          <div className="mt-3 sm:mt-3.5 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <span>Chi tiết đơn thuốc</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Allergy Danger Warn KPI */}
        <div 
          onClick={() => setCurrentTab('members')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
            allergyAlerts.length > 0 
              ? 'bg-rose-50/50 dark:bg-red-950/20 border-rose-100 dark:border-red-900/30 text-rose-800 dark:text-rose-200 hover:border-rose-500/30 dark:hover:border-rose-400/30' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-400/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cảnh báo dị ứng</span>
            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
              allergyAlerts.length > 0 
                ? 'bg-rose-100 dark:bg-red-900/40 text-rose-600 dark:text-red-400' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5 min-h-[36px] flex flex-col justify-center">
            {allergyAlerts.length > 0 ? (
              <div className="text-[11px] sm:text-xs space-y-1 max-h-16 overflow-y-auto pr-1">
                {allergyAlerts.map((e, index) => (
                  <p key={index} className="truncate">
                    ⚠️ <span className="font-bold">{e.memberName}:</span> {e.allergy}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /> Cả nhà an toàn
              </p>
            )}
          </div>
          <div className="mt-3 sm:mt-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Chi tiết lý lịch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main Panel grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scheduled Appointments (Tái khám) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="w-4.5 h-4.5 text-blue-600" />
              Lịch khám & Nhắc sức khỏe sắp tới
            </h3>
            <button
              onClick={() => setCurrentTab('reminders')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          <div className="mt-4 flex-1 space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((rem) => {
                const member = members.find(m => m.id === rem.memberId);
                return (
                  <div 
                    key={rem.id} 
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex items-start gap-3 hover:translate-x-1.5 transition-transform"
                  >
                    <div className="text-center bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg p-1.5 px-2.5 shrink-0 self-center">
                      <p className="text-[10px] uppercase font-bold leading-none">TH {rem.date.split('-')[2]}</p>
                      <p className="text-[10px] font-mono mt-1 leading-none font-bold">{rem.time}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase">
                        {member?.name || 'Thành viên'}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1 leading-snug">
                        {rem.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                        {rem.notes}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có lịch hẹn khám sắp tới trong tháng.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Records & Active Medications */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Records */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileHeart className="w-4.5 h-4.5 text-blue-600" />
                Đợt khám bệnh & chẩn đoán mới nhất
              </h3>
              <button
                onClick={() => setCurrentTab('records')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Tất cả hồ sơ
              </button>
            </div>
            <div className="space-y-3.5">
              {latestRecords.length > 0 ? (
                latestRecords.map((rec) => {
                  const mName = members.find(m => m.id === rec.memberId)?.name || 'Thành viên';
                  return (
                    <div 
                      key={rec.id} 
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750 hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition-all text-slate-800 dark:text-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded mr-2">
                            {mName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{rec.date}</span>
                          <h4 className="font-bold text-xs mt-1.5 leading-snug">{rec.reason}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-medium">
                            <Hospital className="w-3.5 h-3.5" /> {rec.hospital.split(' ').slice(-3).join(' ')}
                          </p>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block mt-0.5">{rec.department}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-850/60 select-all leading-normal">
                        <span className="font-semibold text-[11px] text-slate-500">Chẩn đoán:</span> {rec.diagnosis}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Chưa ghi nhận ca khám bệnh nào trong tủ.
                </div>
              )}
            </div>
          </div>

          {/* Active Medications List */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pill className="w-4.5 h-4.5 text-blue-600 animate-bounce duration-1000" />
                Các thuốc gia đình đang uống
              </h3>
              <button
                onClick={() => setCurrentTab('prescriptions')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Đơn thuốc đầy đủ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeMeds.length > 0 ? (
                activeMeds.map((med, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 select-all truncate flex-1 min-w-0">
                        {med.medName}
                      </p>
                      <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded truncate shrink-0 max-w-[100px]">
                        {med.memberName}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                      <span>Cơ số: {med.strength}</span>
                      <span>Liều: {med.dosage}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs col-span-2">
                  Hiện tại không có thành viên nào đang chạy thuốc theo đơn.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
