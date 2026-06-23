/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, UserSession } from '../types';
import { getExpenses, saveExpense, deleteExpense, getMembers } from '../lib/db';
import { 
  Plus, 
  DollarSign, 
  PieChart as PieIcon, 
  BarChart4, 
  Coins, 
  TrendingUp, 
  Calendar, 
  User, 
  Hospital, 
  Trash2, 
  Briefcase,
  X 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface ExpensesViewProps {
  session: UserSession;
}

type ExpenseCategory = 'visit' | 'lab' | 'meds' | 'hospitalization' | 'other';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  visit: 'Khám bệnh',
  lab: 'Xét nghiệm',
  meds: 'Mua thuốc men',
  hospitalization: 'Nội trú / Viện phí',
  other: 'Khác (Dịch vụ, thiết bị...)'
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  visit: '#3b82f6', // Blue
  lab: '#8b5cf6', // Purple
  meds: '#10b981', // Emerald
  hospitalization: '#ef4444', // Red
  other: '#f59e0b' // Amber
};

export default function ExpensesView({ session }: ExpensesViewProps) {
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses(session.familyId));
  const [confirmDelete, setConfirmDelete] = useState<{id: string; title: string} | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Creation form states
  const [newTitle, setNewTitle] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('visit');
  const [newTotalAmount, setNewTotalAmount] = useState<number>(0);
  const [newInsuranceCovered, setNewInsuranceCovered] = useState<number>(0);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHospital, setNewHospital] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const members = getMembers(session.familyId);

  const refreshList = () => {
    setExpenses(getExpenses(session.familyId));
  };

  const handleOpenForm = () => {
    setErrorMsg('');
    setNewTitle('');
    setNewMemberId(members[0]?.id || '');
    setNewCategory('visit');
    setNewTotalAmount(0);
    setNewInsuranceCovered(0);
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewHospital('');
    setIsAddingExpense(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên hóa đơn/khoản chi.');
      return;
    }
    if (newTotalAmount <= 0) {
      setErrorMsg('Tổng chi phí phải lớn hơn 0.');
      return;
    }
    if (newInsuranceCovered < 0 || newInsuranceCovered > newTotalAmount) {
      setErrorMsg('Số tiền bảo hiểm chi trả không thể âm hoặc vượt quá tổng chi phí.');
      return;
    }

    const selfPaidAmount = newTotalAmount - newInsuranceCovered;

    const compiled: Expense = {
      id: 'exp-' + Math.random().toString(36).slice(2, 9),
      familyId: session.familyId,
      memberId: newMemberId,
      description: newTitle.trim(),
      category: newCategory,
      totalAmount: newTotalAmount,
      insuranceAmount: newInsuranceCovered,
      selfPaidAmount: selfPaidAmount,
      date: newDate,
      hospital: newHospital.trim() || 'Ngoại viện'
    };

    const res = saveExpense(session.familyId, compiled, session);
    if (res.success) {
      setSuccessMsg(`Lưu khoản chi "${newTitle}" thành công.`);
      setIsAddingExpense(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc phát sinh khi lưu viện phí.');
    }
  };

  const handleDeleteExpense = (expId: string, titleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin' && session.role !== 'member') {
      setErrorMsg('Bạn cần đăng nhập để xóa hóa đơn.');
      return;
    }

    setConfirmDelete({ id: expId, title: titleName });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const res = deleteExpense(session.familyId, confirmDelete.id, session);
    if (res.success) {
      setSuccessMsg(`Đã xóa hóa đơn "${confirmDelete.title}" thành công.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc xảy ra.');
    }
    setConfirmDelete(null);
  };

  // Math aggregations for financial cards
  const totalGrossExpense = expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalInsuranceCovered = expenses.reduce((acc, curr) => acc + curr.insuranceAmount, 0);
  const totalSelfPaid = expenses.reduce((acc, curr) => acc + curr.selfPaidAmount, 0);

  // Metric chart 1: Aggregated Bar Chart by family member
  const memberExpensesData = members.map(m => {
    const memExps = expenses.filter(e => e.memberId === m.id);
    const selfSum = memExps.reduce((acc, curr) => acc + curr.selfPaidAmount, 0);
    const insSum = memExps.reduce((acc, curr) => acc + curr.insuranceAmount, 0);
    return {
      name: m.name,
      'Tự chi trả': selfSum,
      'Bảo hiểm': insSum
    };
  });

  // Metric chart 2: Donut Category ratio distribution
  const categoryExpensesMap: Record<ExpenseCategory, number> = {
    visit: 0,
    lab: 0,
    meds: 0,
    hospitalization: 0,
    other: 0
  };
  expenses.forEach(e => {
    const cat = e.category as ExpenseCategory;
    if (categoryExpensesMap[cat] !== undefined) {
      categoryExpensesMap[cat] += e.totalAmount;
    }
  });
  const donutData = Object.entries(categoryExpensesMap)
    .map(([cat, amt]) => ({
      name: CATEGORY_LABELS[cat as ExpenseCategory],
      value: amt
    }))
    .filter(item => item.value > 0);

  // Metric chart 3: Chronological Area Chart by Month
  const monthlyTimelineMap: Record<string, { total: number; self: number; ins: number }> = {};
  const sortedExps = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sortedExps.forEach(e => {
    const monthStr = e.date.slice(0, 7); // YYYY-MM
    if (!monthlyTimelineMap[monthStr]) {
      monthlyTimelineMap[monthStr] = { total: 0, self: 0, ins: 0 };
    }
    monthlyTimelineMap[monthStr].total += e.totalAmount;
    monthlyTimelineMap[monthStr].self += e.selfPaidAmount;
    monthlyTimelineMap[monthStr].ins += e.insuranceAmount;
  });
  
  const timelineData = Object.entries(monthlyTimelineMap).map(([mName, vals]) => ({
    name: mName.slice(5) + '/' + mName.slice(2, 4), // MM/YY
    'Tự chi trả': vals.self,
    'Bảo hiểm gánh': vals.ins
  }));

  const formatCurrency = (amt: number) => {
    return amt.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold dark:text-slate-50 font-sans tracking-tight">Chi phí & Viện phí gia đình</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Phân bổ ngân sách y tế gia đình, hạch toán tỷ lệ tự chi trả / bảo hiểm thanh toán, biểu đồ chi tiết linh hoạt
          </p>
        </div>
        <button
          id="add-expense-btn"
          onClick={handleOpenForm}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Ghi khoản chi tiêu mới
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900 font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 font-medium">
          ⚠ {errorMsg}
        </div>
      )}

      {/* 3 Metric counters blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-indigo-50/40 via-white to-white dark:from-indigo-950/10 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Tổng chi phí điều trị (Gross)</span>
            <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-50">{formatCurrency(totalGrossExpense)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-950/10 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Bảo hiểm xã hội chi trả</span>
            <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(totalInsuranceCovered)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-blue-50/40 via-white to-white dark:from-blue-950/10 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Tiền tự chi trả (Out-of-pocket)</span>
            <p className="text-sm font-black font-mono text-blue-600 dark:text-blue-450">{formatCurrency(totalSelfPaid)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Charts section layout: bento grid style */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Plot 1: Bar chart breakdown per individual member */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-50 dark:border-slate-850">
            <BarChart4 className="w-4 h-4 text-slate-405" /> Chi tiêu theo thành viên
          </h3>
          <div className="h-48 w-full pt-2">
            {expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberExpensesData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Tự chi trả" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Bảo hiểm" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 text-xs py-14 italic">Chưa có viện phí hóa đơn nạp vào.</p>
            )}
          </div>
        </div>

        {/* Plot 2: Donut category ratio donut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-50 dark:border-slate-850">
            <PieIcon className="w-4 h-4 text-slate-455" /> Thể loại danh mục chi tiêu
          </h3>
          <div className="h-48 w-full flex items-center justify-center pt-2">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => {
                      const colorKeys = Object.values(CATEGORY_COLORS);
                      return <Cell key={`cell-${index}`} fill={colorKeys[index % colorKeys.length]} />;
                    })}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 text-xs py-14 italic">Chưa có tỷ lệ.</p>
            )}
          </div>
        </div>

        {/* Plot 3: Chronological Area Monthly costs comparisons */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-50 dark:border-slate-850">
            <Briefcase className="w-4 h-4 text-slate-405" /> Xu hướng thanh toán bảo hiểm
          </h3>
          <div className="h-48 w-full pt-2">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <Tooltip wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Tự chi trả" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Bảo hiểm gánh" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 text-xs py-14 italic">Chưa dựng được chu kỳ dòng tiền.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Ledger Checklist table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="border-b border-slate-50 dark:border-slate-850 pb-2.5 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Mục lục biên lai, chứng từ viện phí ({expenses.length})</h3>
          <span className="text-[10px] text-slate-400 italic">Admin gia đình có thể dọn xóa các dòng nhầm lẫn</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold">
                <th className="py-2.5 px-3">Khoản chi tiêu</th>
                <th className="py-2.5 px-3">Chủ hồ sơ</th>
                <th className="py-2.5 px-3">Hạng mục</th>
                <th className="py-2.5 px-3">Ngày lập</th>
                <th className="py-2.5 px-3">Bệnh viện</th>
                <th className="py-2.5 px-3">Tổng tiền</th>
                <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-440">Bảo hiểm</th>
                <th className="py-2.5 px-3 text-blue-600 dark:text-blue-440">Tự chi</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-855">
              {expenses.length > 0 ? (
                expenses.map((exp) => {
                  const patient = members.find(m => m.id === exp.memberId)?.name || 'Gia đình';
                  const cat = exp.category as ExpenseCategory;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-5=0/40 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300">
                      <td className="py-3 px-3 font-bold text-slate-850 dark:text-slate-100">{exp.description}</td>
                      <td className="py-3 px-3">{patient}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-medium">
                          {CATEGORY_LABELS[cat] || exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-404 font-medium">{exp.date}</td>
                      <td className="py-3 px-3 max-w-[130px] truncate">{exp.hospital}</td>
                      <td className="py-3 px-3 font-mono font-bold">{formatCurrency(exp.totalAmount)}</td>
                      <td className="py-3 px-3 font-mono text-emerald-600 font-semibold">{formatCurrency(exp.insuranceAmount)}</td>
                      <td className="py-3 px-3 font-mono text-blue-600 font-semibold">{formatCurrency(exp.selfPaidAmount)}</td>
                      <td className="py-3 px-3 text-center">
                        {(session.role === 'admin' || session.role === 'member') ? (
                          <button
                            onClick={(e) => handleDeleteExpense(exp.id, exp.description, e)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950 cursor-pointer"
                            title="Xóa chứng từ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-350 select-none">Xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 italic">Mục lục trống rỗng.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Popup Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 cursor-default"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-5 h-5 animate-pulse" />
                Hạch toán khoản chi tiêu y tế
              </h3>
              <button
                onClick={() => setIsAddingExpense(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="p-3 bg-blue-50/25 dark:bg-slate-950 rounded-xl border border-blue-100/30 text-[10.5px] leading-relaxed text-indigo-700 dark:text-blue-400">
                Lưu ý: Hệ thống tự động tính tiền túi tự trả bằng: Tổng chi - Bảo hiểm chi trả.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Mục đích chi trả / Nội dung <span className="text-red-500">*</span></label>
                <input
                  id="expense-title-input"
                  type="text"
                  required
                  placeholder="Ví dụ: Mua thuốc huyết áp, Viện phí nằm viện..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-550 uppercase mb-1">Thành viên chi trả</label>
                  <select
                    id="expense-member-select"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 uppercase mb-1">Loại hình chi tiêu</label>
                  <select
                    id="expense-category-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tổng chi phí (đ) <span className="text-red-500">*</span></label>
                  <input
                    id="expense-total-input"
                    type="number"
                    min="1"
                    required
                    placeholder="Ví dụ: 1200000"
                    value={newTotalAmount || ''}
                    onChange={(e) => setNewTotalAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden dark:text-slate-105"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase mb-1">Bảo hiểm chi trả (đ)</label>
                  <input
                    id="expense-insurance-input"
                    type="number"
                    min="0"
                    placeholder="Ví dụ: 800000"
                    value={newInsuranceCovered || ''}
                    onChange={(e) => setNewInsuranceCovered(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-emerald-50/20 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden dark:text-emerald-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ngày lập chi tiêu</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-405 uppercase mb-1">Bệnh viện / Cơ sở khám</label>
                  <input
                    type="text"
                    placeholder="Bệnh viện Đại học Y..."
                    value={newHospital}
                    onChange={(e) => setNewHospital(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Real-time Dynamic Self Paid display */}
              <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl shadow-xs text-center border font-mono">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Thực tế tiền túi tự trả hạch toán</span>
                <span className="text-indigo-650 dark:text-indigo-400 text-sm font-black">
                  {formatCurrency(newTotalAmount >= newInsuranceCovered ? (newTotalAmount - newInsuranceCovered) : 0)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
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
        title="Xóa hóa đơn chi tiêu"
        message={`Bạn chắc chắn muốn xóa hóa đơn chi tiêu "${confirmDelete?.title}"?`}
        confirmText="Xóa hóa đơn"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
