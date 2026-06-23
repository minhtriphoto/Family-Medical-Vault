/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HealthMetric, UserSession } from '../types';
import { getHealthMetrics as getMetrics, addHealthMetric as saveMetric, deleteHealthMetric as deleteMetric, getMembers } from '../lib/db';
import { 
  Plus, 
  Activity, 
  LineChart as LineIcon, 
  Scale, 
  Heart, 
  Info, 
  Calendar, 
  User, 
  Trash2, 
  X 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface MetricsViewProps {
  session: UserSession;
}

type MetricType = 'blood_pressure' | 'blood_sugar' | 'weight' | 'temperature' | 'heart_rate' | 'cholesterol' | 'uric_acid' | 'hba1c';

const METRIC_CONFIGS: Record<MetricType, { 
  label: string; 
  unit: string; 
  color: string; 
  secondaryColor?: string;
  hasSecondary: boolean;
  secondaryLabel?: string;
  normalRange: string;
}> = {
  blood_pressure: { 
    label: 'Huyết áp', 
    unit: 'mmHg', 
    color: '#ef4444', 
    secondaryColor: '#f97316',
    hasSecondary: true, 
    secondaryLabel: 'Huyết áp Tâm trương',
    normalRange: '90-120 / 60-80 mmHg'
  },
  blood_sugar: { 
    label: 'Đường huyết đói', 
    unit: 'mg/dL', 
    color: '#06b6d4', 
    hasSecondary: false,
    normalRange: '70 - 100 mg/dL'
  },
  weight: { 
    label: 'Cân nặng', 
    unit: 'kg', 
    color: '#10b981', 
    hasSecondary: false,
    normalRange: 'Chỉ số BMI (18.5 - 24.9 là cân đối)'
  },
  temperature: { 
    label: 'Thân nhiệt', 
    unit: '°C', 
    color: '#fbbf24', 
    hasSecondary: false,
    normalRange: '36.1 - 37.2 °C'
  },
  heart_rate: { 
    label: 'Nhịp tim nghỉ ngơi', 
    unit: 'nhịp/phút', 
    color: '#ec4899', 
    hasSecondary: false,
    normalRange: '60 - 100 nhịp/phút'
  },
  cholesterol: { 
    label: 'Mỡ máu Cholesterol', 
    unit: 'mmol/L', 
    color: '#8b5cf6', 
    hasSecondary: false,
    normalRange: '< 5.2 mmol/L'
  },
  uric_acid: { 
    label: 'Acid Uric', 
    unit: 'μmol/L', 
    color: '#f59e0b', 
    hasSecondary: false,
    normalRange: 'Nam: 202-416, Nữ: 140-340 μmol/L'
  },
  hba1c: { 
    label: 'HbA1c', 
    unit: '%', 
    color: '#6366f1', 
    hasSecondary: false,
    normalRange: '< 5.7%'
  }
};

export default function MetricsView({ session }: MetricsViewProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>(() => getMetrics(session.familyId));
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    const mems = getMembers(session.familyId);
    return mems[0]?.id || '';
  });
  const [activeMetricType, setActiveMetricType] = useState<MetricType>('blood_pressure');
  const [isAddingMetric, setIsAddingMetric] = useState(false);

  // Form states
  const [newPrimaryVal, setNewPrimaryVal] = useState<number>(0);
  const [newSecondaryVal, setNewSecondaryVal] = useState<number>(80);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('08:00');
  const [newNotes, setNewNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const members = getMembers(session.familyId);
  const activeMember = members.find(m => m.id === selectedMemberId);

  const refreshList = () => {
    setMetrics(getMetrics(session.familyId));
  };

  // Extract primary value and secondary value for each stored HealthMetric depending on metric type
  const getMetricValue = (m: HealthMetric, type: MetricType, returnSecondary = false): number | undefined => {
    if (type === 'blood_pressure') {
      return returnSecondary ? m.bpDiastolic : m.bpSystolic;
    }
    if (type === 'blood_sugar') return m.bloodSugar;
    if (type === 'weight') return m.weight;
    if (type === 'temperature') return m.temperature;
    if (type === 'heart_rate') return m.heartRate;
    if (type === 'cholesterol') return m.cholesterol;
    if (type === 'uric_acid') return m.uricAcid;
    if (type === 'hba1c') return m.hba1c;
    return undefined;
  };

  // Filter metrics logged for this member that possess appropriate fields
  const filteredRawMetrics = metrics.filter(m => {
    if (m.memberId !== selectedMemberId) return false;
    const val = getMetricValue(m, activeMetricType);
    return val !== undefined && val > 0;
  });

  // Sort chronologically
  const sortedFilteredMetrics = [...filteredRawMetrics].sort((a, b) => {
    return a.date.localeCompare(b.date);
  });

  // Format Recharts data model
  const chartData = sortedFilteredMetrics.map(m => {
    const val = getMetricValue(m, activeMetricType) || 0;
    const dateLabel = m.date.slice(5, 10); // MM-DD
    
    const dataObj: any = {
      name: dateLabel,
      value: val
    };

    if (activeMetricType === 'blood_pressure') {
      dataObj.SYS = val;
      dataObj.DIA = getMetricValue(m, activeMetricType, true) || 80;
    }

    return dataObj;
  });

  const handleOpenAddForm = () => {
    setErrorMsg('');
    setNewPrimaryVal(
      activeMetricType === 'blood_pressure' ? 120 : (activeMetricType === 'weight' ? 60 : (activeMetricType === 'temperature' ? 36.5 : 75))
    );
    setNewSecondaryVal(80);
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime('08:00');
    setNewNotes('');
    setIsAddingMetric(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPrimaryVal <= 0) {
      setErrorMsg('Giá trị chỉ số đo lường lâm sàng phải lớn hơn 0.');
      return;
    }

    // Merge date and time string using native types support ("YYYY-MM-DD HH:mm")
    const mergedDateTimeString = `${newDate} ${newTime}`;

    const compiled: HealthMetric = {
      id: 'met-' + Math.random().toString(36).slice(2, 9),
      familyId: session.familyId,
      memberId: selectedMemberId,
      date: mergedDateTimeString,
      customName: newNotes.trim() || 'Tự cập nhật'
    };

    if (activeMetricType === 'blood_pressure') {
      compiled.bpSystolic = newPrimaryVal;
      compiled.bpDiastolic = newSecondaryVal;
    } else if (activeMetricType === 'blood_sugar') {
      compiled.bloodSugar = newPrimaryVal;
    } else if (activeMetricType === 'weight') {
      compiled.weight = newPrimaryVal;
    } else if (activeMetricType === 'temperature') {
      compiled.temperature = newPrimaryVal;
    } else if (activeMetricType === 'heart_rate') {
      compiled.heartRate = newPrimaryVal;
    } else if (activeMetricType === 'cholesterol') {
      compiled.cholesterol = newPrimaryVal;
    } else if (activeMetricType === 'uric_acid') {
      compiled.uricAcid = newPrimaryVal;
    } else if (activeMetricType === 'hba1c') {
      compiled.hba1c = newPrimaryVal;
    }

    const res = saveMetric(session.familyId, compiled, session);
    if (res.success) {
      setSuccessMsg('Ghi chỉ số mới thành công.');
      setIsAddingMetric(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc phát sinh khi lưu trị số.');
    }
  };

  const handleDeleteMetric = (mId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin') {
      setErrorMsg('Chỉ Admin gia đình mới xóa được chỉ số sinh tồn.');
      return;
    }

    setConfirmDelete(mId);
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const res = deleteMetric(session.familyId, confirmDelete, session);
    if (res.success) {
      setSuccessMsg('Đã xóa bỏ bản ghi chỉ số thành công.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Gặp sự cố xóa.');
    }
    setConfirmDelete(null);
  };

  const activeConf = METRIC_CONFIGS[activeMetricType];

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold dark:text-slate-50 font-sans tracking-tight">Theo dõi chỉ số sinh tồn</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Biểu đồ hóa xu hướng biến thiên huyết áp tâm thu, chỉ số glucose đói, nhịp tim nghỉ ngơi và cân nặng
          </p>
        </div>
        <button
          id="add-metric-btn"
          onClick={handleOpenAddForm}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Ghi nhận chỉ số mới
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900 font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 font-medium font-sans">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Control selectors block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-80-0/80 items-center justify-between">
        <div className="md:col-span-4">
          <label className="block text-[10px] text-slate-404 font-extrabold uppercase mb-1">Chọn thành viên gia đình</label>
          <select
            id="member-selector-metrics"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-hidden dark:text-slate-100"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-8">
          <label className="block text-[10px] text-slate-404 font-extrabold uppercase mb-1">Chọn chỉ số sinh học</label>
          <div className="flex flex-wrap gap-1.5 mt-0.5 animate-fade-in">
            {Object.entries(METRIC_CONFIGS).map(([mType, cfg]) => {
              const worksAsActive = activeMetricType === mType;
              return (
                <button
                  key={mType}
                  onClick={() => setActiveMetricType(mType as MetricType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    worksAsActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-450 dark:hover:bg-slate-850'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graph Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Graph Pane */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-805 space-y-4">
          <div>
            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider block">Tiến trình lâm sàng</span>
            <h2 className="text-sm font-bold mt-1 font-sans tracking-tight">Biểu đồ biến thiên {activeConf.label} ({activeConf.unit})</h2>
            <div className="mt-2.5 p-3.5 bg-blue-50/25 dark:bg-blue-950/20 border border-blue-100/30 text-[11px] rounded-xl flex items-center gap-2 text-indigo-800 dark:text-blue-400">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Dải khuyến nghị định chuẩn thông thường: <strong className="font-extrabold text-blue-700 dark:text-blue-405">{activeConf.normalRange}</strong></span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="opacity-40" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit={' ' + activeConf.unit} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '11px', 
                      fontWeight: '70=0' 
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  {activeMetricType === 'blood_pressure' ? (
                    <>
                      <Line 
                        name="Huyết áp Tâm thu (SYS)" 
                        type="monotone" 
                        dataKey="SYS" 
                        stroke={activeConf.color} 
                        strokeWidth={2.5} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        name="Huyết áp Tâm trương (DIA)" 
                        type="monotone" 
                        dataKey="DIA" 
                        stroke={activeConf.secondaryColor} 
                        strokeWidth={2.5} 
                        activeDot={{ r: 6 }} 
                      />
                    </>
                  ) : (
                    <Line 
                      name={activeConf.label} 
                      type="monotone" 
                      dataKey="value" 
                      stroke={activeConf.color} 
                      strokeWidth={2.5} 
                      activeDot={{ r: 6 }} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                <LineIcon className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
                <p className="font-semibold text-slate-500">Chưa ghi nhận đủ dữ liệu</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">Hãy ghi thêm tối thiểu một đo lường sinh tồn mới ở nút trên để vẽ dựng biểu diễn trực quan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side history log pane */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-855 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Lịch sử ghi chép</h3>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-80 scrollbar-thin pr-1 text-xs">
            {sortedFilteredMetrics.length > 0 ? (
              [...sortedFilteredMetrics].reverse().map((m) => {
                const isBp = activeMetricType === 'blood_pressure';
                const prim = getMetricValue(m, activeMetricType) || 0;
                const sec = getMetricValue(m, activeMetricType, true);

                // Decode timestamp
                const dateOnly = m.date.slice(0, 10);
                const timeOnly = m.date.length > 10 ? m.date.slice(11, 16) : '08:00';

                return (
                  <div key={m.id} className="p-3.5 bg-slate-50 default-layout dark:bg-slate-950 border border-slate-101 dark:border-slate-850 rounded-xl relative group flex justify-between items-start gap-2.5">
                    <div>
                      <p className="font-mono font-bold text-slate-850 dark:text-slate-50 text-indigo-650 dark:text-blue-400">
                        🌡 {prim} {isBp && sec ? `/ ${sec}` : ''} <span className="text-[10px] text-slate-400 font-medium">{activeConf.unit}</span>
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                        <span>📅 {dateOnly}</span>
                        <span>•</span>
                        <span>⏰ {timeOnly}</span>
                      </div>

                      <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1.5 italic font-medium">"{m.customName || 'Tự ghi chép'}"</p>
                    </div>

                    {session.role === 'admin' && (
                      <button
                        onClick={(e) => handleDeleteMetric(m.id, e)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-900 text-slate-350 hover:text-red-500 rounded-md shrink-0 focus:outline-hidden cursor-pointer"
                        title="Xóa dòng lịch sử"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-400 py-10 text-xs italic">Không tìm thấy dữ liệu đo lường.</p>
            )}
          </div>
        </div>
      </div>

      {/* Record Biometrics Popup form */}
      {isAddingMetric && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 cursor-default"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse" />
                Ghi nhận chỉ số sức khỏe của {activeMember?.name}
              </h3>
              <button
                onClick={() => setIsAddingMetric(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="p-3 bg-blue-50/25 dark:bg-slate-950 rounded-xl border border-blue-100/30 text-[11px] leading-relaxed text-indigo-700 dark:text-blue-400">
                Lưu ý: Đo lường chuẩn y tế (Huyết áp đo bằng mmHg, đường huyết mg/dL, nhịp tim nhịp/phút).
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {activeMetricType === 'blood_pressure' ? 'Huyết áp Tâm thu (SYS)' : `${activeConf.label} (${activeConf.unit})`} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="primary-val-input"
                    type="number"
                    step="0.1"
                    required
                    value={newPrimaryVal || ''}
                    onChange={(e) => setNewPrimaryVal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                {activeMetricType === 'blood_pressure' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Huyết áp Tâm trương (DIA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="secondary-val-input"
                      type="number"
                      step="1"
                      required
                      value={newSecondaryVal || ''}
                      onChange={(e) => setNewSecondaryVal(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden dark:text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ngày lập ghi nhận</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thời gian ghi nhận</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú bối cảnh kèm theo (Nhấn mạnh trạng thái lúc mệt mỏi, trước/sau bữa ăn...)</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đo lúc sáng sớm vừa ngủ dậy bụng đói lúc 7h..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden text-slate-850 dark:text-slate-100 scrollbar-thin"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMetric(false)}
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
        title="Xóa chỉ số"
        message="Bạn chắc chắn muốn xóa bản ghi chỉ số đo lường này?"
        confirmText="Xóa chỉ số"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
