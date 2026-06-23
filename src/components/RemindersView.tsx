/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicalReminder, UserSession, FamilyMember } from '../types';
import { 
  getReminders, 
  saveReminder, 
  deleteReminder, 
  toggleReminderState, 
  getMembers 
} from '../lib/db';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  Stethoscope, 
  Pill, 
  ShieldCheck, 
  Syringe, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X 
} from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface RemindersViewProps {
  session: UserSession;
  // Support quick opens
  isFormOpenImmediately?: boolean;
  onFormClosed?: () => void;
}

export default function RemindersView({ session, isFormOpenImmediately, onFormClosed }: RemindersViewProps) {
  const [reminders, setReminders] = useState<MedicalReminder[]>(() => getReminders(session.familyId));
  const [editingReminder, setEditingReminder] = useState<Partial<MedicalReminder> | null>(
    isFormOpenImmediately ? {
      id: '',
      memberId: '',
      type: 'appointment',
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      status: 'pending',
      notes: ''
    } : null
  );

  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{id: string; title: string} | null>(null);
  
  // Calendar Navigation states: default active is June 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 5 corresponds to June (0-indexed)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const members = getMembers(session.familyId);

  const refreshList = () => {
    setReminders(getReminders(session.familyId));
  };

  const handleToggleState = (rId: string) => {
    toggleReminderState(session.familyId, rId, session.email);
    refreshList();
  };

  const handleCreateNew = () => {
    setErrorMsg('');
    setEditingReminder({
      id: '',
      memberId: members[0]?.id || '',
      type: 'appointment',
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      status: 'pending',
      notes: ''
    });
  };

  const handleDelete = (rId: string, titleStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin') {
      setErrorMsg('Xem hạn chế: Chỉ Admin gia đình mới được quyền hủy xóa lịch báo thức.');
      return;
    }

    setConfirmDelete({ id: rId, title: titleStr });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const res = deleteReminder(session.familyId, confirmDelete.id, session);
    if (res.success) {
      setSuccessMsg(`Đã xóa lịch nhắc "${confirmDelete.title}" thành công.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc phát sinh khi xóa lịch nhắc.');
    }
    setConfirmDelete(null);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    setErrorMsg('');

    if (!editingReminder.title?.trim()) {
      setErrorMsg('Vui lòng nhập họ đề mục nội dung nhắc.');
      return;
    }
    if (!editingReminder.memberId) {
      setErrorMsg('Vui lòng chọn thành viên.');
      return;
    }

    const res = saveReminder(session.familyId, editingReminder as MedicalReminder, session);
    if (res.success) {
      setSuccessMsg(`Lưu lịch nhắc "${editingReminder.title}" thành công.`);
      setEditingReminder(null);
      if (onFormClosed) onFormClosed();
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Gặp sự cố khi ghi lịch nhắc.');
    }
  };

  // ---------------- Calendar Month Grid Math ----------------
  // June 2026 starts on a MONDAY. Let's make a generic helper.
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const day = new Date(year, month, 1).getDay();
    // Align with Monday as start day (0: Monday -> 6: Sunday)
    return day === 0 ? 6 : day - 1;
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days
  const totalDays = daysInMonth(currentYear, currentMonth);
  const offset = startDayOfWeek(currentYear, currentMonth);
  const calendarDays: (number | null)[] = [];
  
  for (let i = 0; i < offset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  // Filter schedules to display
  const displayReminders = reminders.filter(rem => {
    const memberMatches = filterMemberId ? rem.memberId === filterMemberId : true;
    const typeMatches = filterType ? rem.type === filterType : true;
    
    // Calendar filter match click
    let calendarMatches = true;
    if (selectedCalendarDate) {
      calendarMatches = rem.date === selectedCalendarDate;
    }

    return memberMatches && typeMatches && calendarMatches;
  });

  const getRemColorStyle = (type: string) => {
    switch (type) {
      case 'appointment': return 'text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-450 dark:bg-blue-950/40 border-blue-200/50';
      case 'medication': return 'text-emerald-600 bg-emerald-150 hover:bg-emerald-200 dark:text-emerald-450 dark:bg-emerald-950/40 border-emerald-250/20';
      case 'vaccination': return 'text-amber-600 bg-amber-100 hover:bg-amber-200 dark:text-amber-450 dark:bg-amber-950/40 border-amber-200/50';
      default: return 'text-purple-600 bg-purple-100 hover:bg-purple-200 dark:text-purple-450 dark:bg-purple-950/40 border-purple-200/50';
    }
  };

  const getRemIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Stethoscope className="w-3.5 h-3.5 shrink-0" />;
      case 'medication': return <Pill className="w-3.5 h-3.5 shrink-0" />;
      case 'vaccination': return <Syringe className="w-3.5 h-3.5 shrink-0" />;
      default: return <Clock className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const getRemLabel = (type: string) => {
    switch (type) {
      case 'appointment': return 'Hẹn tái khám';
      case 'medication': return 'Uống thuốc';
      case 'vaccination': return 'Tiêm ngừa';
      default: return 'X/N định kỳ';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Lịch nhắc y khoa gia đình</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Theo dõi kế hoạch tiêm chủng vaccine cho bé, lịch uống thuốc định giờ của bố mẹ và nhắc nhở rèn luyện
          </p>
        </div>
        <button
          id="add-reminder-btn"
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Báo thức/Đặt nhắc mới
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900 font-medium pb-2">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 font-medium">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Main Grid: Left Calendar Monthly Grid, Right Scheduler checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Modern Interactive Calendar */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              Lịch trực quan định kỳ
            </h3>
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-24 text-center">{monthNames[currentMonth]} {currentYear}</span>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="grid grid-cols-7 gap-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-center font-sans">
            {/* Days of week */}
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, dIdx) => (
              <span key={dIdx} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest py-1.5">
                {day}
              </span>
            ))}

            {/* Days boxes */}
            {calendarDays.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty-${idx}`} className="bg-transparent aspect-square" />;
              }

              // Compute YYYY-MM-DD
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayReminders = reminders.filter(r => r.date === dateStr);
              const isSelected = selectedCalendarDate === dateStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (selectedCalendarDate === dateStr) {
                      setSelectedCalendarDate(null); // Deselect
                    } else {
                      setSelectedCalendarDate(dateStr);
                    }
                  }}
                  className={`aspect-square sm:aspect-video rounded-xl flex flex-col justify-between p-1 cursor-pointer transition-all border text-slate-800 dark:text-slate-100 ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 font-medium'
                  }`}
                >
                  <span className={`text-[11px] self-start font-bold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {dayNum}
                  </span>

                  {/* Little indicator dots for reminders on this day */}
                  <div className="flex flex-wrap justify-center gap-0.5 mt-auto max-w-full">
                    {dayReminders.slice(0, 4).map((r) => {
                      let dotColor = 'bg-blue-500';
                      if (r.type === 'medication') dotColor = 'bg-emerald-500';
                      if (r.type === 'vaccination') dotColor = 'bg-amber-500';
                      if (r.type === 'routine') dotColor = 'bg-purple-500';

                      return (
                        <span 
                          key={r.id} 
                          title={r.title}
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : dotColor}`} 
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 mt-2 flex flex-wrap gap-3.5 justify-center">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Tái khám</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Uống thuốc V/C</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Tiêm chủng</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full" /> Xét nghiệm</span>
          </div>
        </div>

        {/* Right Side: Reminder Scheduler Checklist list */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 flex flex-col h-full h-[52vh] lg:h-[61vh]">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-blue-600 animate-spin_slow" />
              Sổ tay nhắc sự kiện ({displayReminders.length})
            </h3>
            {selectedCalendarDate && (
              <button 
                onClick={() => setSelectedCalendarDate(null)}
                className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md hover:underline"
              >
                Xóa lọc ngày: {selectedCalendarDate} ✖
              </button>
            )}
          </div>

          {/* Quick inline filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-hidden dark:text-slate-50"
            >
              <option value="">Lọc người (Tất cả)</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-hidden dark:text-slate-50"
            >
              <option value="">Lọc loại (Tất cả)</option>
              <option value="appointment">Hẹn tái khám</option>
              <option value="medication">Uống thuốc</option>
              <option value="vaccination">Tiêm ngừa</option>
              <option value="routine font-semibold">Xét nghiệm và tập tễ</option>
            </select>
          </div>

          {/* Checklist Area */}
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1 mt-2">
            {displayReminders.length > 0 ? (
              displayReminders.map((rem) => {
                const member = members.find(m => m.id === rem.memberId);
                const isCompleted = rem.status === 'completed';
                const styleClass = getRemColorStyle(rem.type);

                return (
                  <div
                    key={rem.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden group ${
                      isCompleted 
                        ? 'bg-slate-50/50 dark:bg-slate-950/60 border-slate-100 dark:border-slate-850/40 text-slate-400' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {/* Tick box toggles state */}
                    <button
                      onClick={() => handleToggleState(rem.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-500 rounded-full shrink-0 cursor-pointer"
                      title="Hoàn thành lịch"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                      )}
                    </button>

                    {/* Meta labels content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded-[5px] text-[8px] font-bold uppercase tracking-wider border shrink-0 ${styleClass}`}>
                          {getRemLabel(rem.type)}
                        </span>
                        <span className="text-[9px] font-extrabold bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded">
                          {member?.name || 'Thành viên'}
                        </span>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug mt-1.5 truncate ${isCompleted ? 'line-through text-slate-400 dark:text-slate-650' : 'text-slate-800 dark:text-slate-150'}`}>
                        {rem.title}
                      </h4>
                      
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-1">
                        <span>📅 {rem.date}</span>
                        <span>•</span>
                        <span>⏰ {rem.time}</span>
                      </div>
                      
                      {rem.notes && (
                        <p className={`text-[10px] mt-1 italic pl-2.5 border-l border-slate-100 dark:border-slate-800 ${isCompleted ? 'text-slate-400/70' : 'text-slate-450 dark:text-slate-500'}`}>
                          "{rem.notes}"
                        </p>
                      )}
                    </div>

                    {/* Delete actions */}
                    {session.role === 'admin' && (
                      <button
                        onClick={(e) => handleDelete(rem.id, rem.title, e)}
                        className="p-1 text-slate-300 hover:text-red-500 rounded-lg group-hover:opacity-100 transition-opacity absolute top-1.5 right-1.5 cursor-pointer"
                        title="Xóa lịch nhắc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Không tìm thấy lịch nhắc y tế nào tương thích.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing dialog modal */}
      {editingReminder && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 cursor-default"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Lên lịch cảnh báo - Đặt nhắc nhở y tế
              </h3>
              <button
                onClick={() => {
                  setEditingReminder(null);
                  if (onFormClosed) onFormClosed();
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mục tiêu báo chuông <span className="text-red-500">*</span></label>
                <input
                  id="reminder-title-input"
                  type="text"
                  required
                  placeholder="Ví dụ: Đo huyết áp gáy lúc sẩm tối..."
                  value={editingReminder.title || ''}
                  onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden text-slate-850 dark:text-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thành viên ứng dự</label>
                  <select
                    id="reminder-member-select"
                    value={editingReminder.memberId || ''}
                    onChange={(e) => setEditingReminder({ ...editingReminder, memberId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden text-slate-855 dark:text-slate-50"
                  >
                    <option value="">-- Thành viên --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hình thức nhắc nhở</label>
                  <select
                    id="reminder-type-select"
                    value={editingReminder.type || 'appointment'}
                    onChange={(e) => setEditingReminder({ ...editingReminder, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden text-slate-855 dark:text-slate-50"
                  >
                    <option value="appointment">Hẹn tái khám</option>
                    <option value="medication">Uống thuốc</option>
                    <option value="vaccination">Tiêm chủng Vaccine</option>
                    <option value="routine">Xét nghiệm, khám thường niên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ngày hẹn báo chuông <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={editingReminder.date || ''}
                    onChange={(e) => setEditingReminder({ ...editingReminder, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thời gian báo thức <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    required
                    value={editingReminder.time || ''}
                    onChange={(e) => setEditingReminder({ ...editingReminder, time: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hướng dẫn dặn dò / Chỉ định kèm theo</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Nhịn ăn sáng khi lấy máu xét nghiệm đường huyết..."
                  value={editingReminder.notes || ''}
                  onChange={(e) => setEditingReminder({ ...editingReminder, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden scrollbar-thin"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReminder(null);
                    if (onFormClosed) onFormClosed();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Xóa lịch nhắc"
        message={`Bạn chắc chắn muốn xóa vĩnh viễn lịch nhắc "${confirmDelete?.title}"?`}
        confirmText="Xóa lịch nhắc"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
