/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Prescription, Medication, UserSession, FamilyMember } from '../types';
import { 
  getPrescriptions, 
  savePrescription, 
  deletePrescription, 
  getMembers 
} from '../lib/db';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Pill, 
  Calendar, 
  User, 
  BriefcaseMedical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ToggleLeft, 
  X,
  Sparkles,
  Camera
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface PrescriptionsViewProps {
  session: UserSession;
}

export default function PrescriptionsView({ session }: PrescriptionsViewProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => getPrescriptions(session.familyId));
  const [editingPrescription, setEditingPrescription] = useState<Partial<Prescription> | null>(null);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string; date: string; memberId: string} | null>(null);

  // Form helpers
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Drug lines editing sub-states inside form
  const [medsList, setMedsList] = useState<Medication[]>([]);
  const [curMedName, setCurMedName] = useState('');
  const [curMedStrength, setCurMedStrength] = useState('');
  const [curMedDosage, setCurMedDosage] = useState('1 viên');
  const [curMedTimes, setCurMedTimes] = useState(1);
  const [curMedTiming, setCurMedTiming] = useState('Sau ăn sáng');
  const [curMedDays, setCurMedDays] = useState(7);
  const [curMedStatus, setCurMedStatus] = useState<'active' | 'ceased' | 'chronic'>('active');

  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const members = getMembers(session.familyId);

  const refreshList = () => {
    const list = getPrescriptions(session.familyId);
    setPrescriptions(list);
    if (selectedRx) {
      const updated = list.find(rx => rx.id === selectedRx.id);
      setSelectedRx(updated || null);
    }
  };

  const checkInteractions = async (currentFormMeds: Medication[]) => {
    const memberId = editingPrescription?.memberId;
    if (!memberId) return;

    setIsCheckingInteractions(true);
    setInteractionWarning(null);

    const allMemberPrescriptions = prescriptions.filter(p => p.memberId === memberId && p.id !== editingPrescription?.id);
    const existingMeds: Medication[] = [];
    allMemberPrescriptions.forEach(p => {
      p.meds.forEach(m => {
        if (m.status === 'active' || m.status === 'chronic') {
          existingMeds.push(m);
        }
      });
    });

    const existingMedNames = existingMeds.map(m => `${m.name} ${m.strength}`);
    const newMedNames = currentFormMeds.map(m => `${m.name} ${m.strength}`);

    if (newMedNames.length === 0) {
      setIsCheckingInteractions(false);
      return;
    }

    try {
      const resp = await fetch("/api/ai/check-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingMedications: existingMedNames, newMedications: newMedNames })
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Không kiểm tra được tương tác thuốc.");
      }
      const data = await resp.json();
      if (data.result && !data.result.toLowerCase().includes("không phát hiện tương tác")) {
        setInteractionWarning(data.result);
      }
    } catch (err: any) {
      console.error(err);
      setInteractionWarning(`⚠️ **Lỗi kiểm tra tương tác:** ${err.message || "Kết nối AI đang quá tải."}`);
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleAddMedToFormList = () => {
    if (!curMedName.trim()) {
      alert('Vui lòng điền tên loại thuốc.');
      return;
    }
    const newMed: Medication = {
      id: 'med-' + Math.random().toString(36).slice(2, 9),
      name: curMedName.trim(),
      strength: curMedStrength.trim() || 'hàm lượng thông thường',
      dosage: curMedDosage.trim(),
      timesPerDay: curMedTimes,
      timing: curMedTiming.trim(),
      days: curMedDays,
      status: curMedStatus
    };
    const updatedMeds = [...medsList, newMed];
    setMedsList(updatedMeds);
    setCurMedName('');
    setCurMedStrength('');
    setCurMedDosage('1 viên');
    
    checkInteractions(updatedMeds);
  };

  const handleRemoveMedFromFormList = (idStr: string) => {
    const updatedMeds = medsList.filter(m => m.id !== idStr);
    setMedsList(updatedMeds);
    checkInteractions(updatedMeds);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningImage(true);
    setInteractionWarning(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const resp = await fetch("/api/ai/scan-prescription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({}));
          throw new Error(errorData.error || "Không thể quét đơn thuốc qua ảnh.");
        }
        const data = await resp.json();
        
        if (data.result && Array.isArray(data.result)) {
           const newScannedMeds: Medication[] = data.result.map((m: any) => ({
             id: 'med-' + Math.random().toString(36).slice(2, 9),
             name: m.name || '',
             strength: m.strength || '',
             dosage: m.dosage || '',
             timesPerDay: m.timesPerDay || 1,
             timing: m.timing || '',
             days: m.days || 7,
             status: 'active'
           }));

           if (newScannedMeds.length > 0) {
              const updatedMeds = [...medsList, ...newScannedMeds];
              setMedsList(updatedMeds);
              checkInteractions(updatedMeds);
           } else {
              setErrorMsg('AI đọc ảnh thành công nhưng không dịch được loại thuốc nào rõ ràng. Vui lòng kê khai tay.');
           }
        }
      } catch (err: any) {
        setErrorMsg('Lỗi phân tích hình ảnh: ' + (err.message || 'vui lòng thử lại sau.'));
      } finally {
        setIsScanningImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNew = () => {
    setErrorMsg('');
    setMedsList([]);
    setInteractionWarning(null);
    setEditingPrescription({
      id: '',
      memberId: members[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      doctor: '',
      hospital: ''
    });
  };

  const handleEdit = (rx: Prescription, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg('');
    setMedsList([...rx.meds]);
    setEditingPrescription({ ...rx });
  };

  const handleDelete = (rxId: string, docDate: string, memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin' && session.role !== 'member') {
      setErrorMsg('Bạn cần đăng nhập để xóa đơn thuốc.');
      return;
    }

    setConfirmDelete({ id: rxId, date: docDate, memberId });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const patient = members.find(m => m.id === confirmDelete.memberId)?.name || 'Thành viên';
    const res = deletePrescription(session.familyId, confirmDelete.id, session);
    if (res.success) {
      setSuccessMsg(`Đã xóa đơn thuốc của ${patient} thành công.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
      if (selectedRx?.id === confirmDelete.id) {
        setSelectedRx(null);
      }
    } else {
      setErrorMsg(res.error || 'Trục trặc xóa đơn thuốc.');
    }
    setConfirmDelete(null);
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!editingPrescription) return;
    if (medsList.length === 0) {
      setErrorMsg('Vui lòng kê thêm tối thiểu một loại thuốc vào đơn trước khi lưu trữ.');
      return;
    }

    const compiledRx: Prescription = {
      ...(editingPrescription as Prescription),
      meds: medsList,
      familyId: session.familyId
    };

    const res = savePrescription(session.familyId, compiledRx, session);
    if (res.success) {
      setSuccessMsg('Lưu đơn thuốc thành công.');
      setEditingPrescription(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc phát sinh khi lưu đơn kê thuốc.');
    }
  };

  const toggleMedicationStatus = (rxId: string, medId: string, currentStatus: 'active' | 'ceased' | 'chronic') => {
    const list = [...prescriptions];
    const rx = list.find(r => r.id === rxId);
    if (rx) {
      const med = rx.meds.find(m => m.id === medId);
      if (med) {
        const statuses: ('active' | 'ceased' | 'chronic')[] = ['active', 'chronic', 'ceased'];
        const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
        med.status = statuses[nextIdx];
        
        // Save back robustly via savePrescription database helper
        savePrescription(session.familyId, rx, session);
        refreshList();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Kê bạ & Quản lý đơn thuốc</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Lưu thuốc uống hằng ngày, hàm lượng sử dụng, liều lượng uống bình nhật và trạng thái đang chạy thuốc
          </p>
        </div>
        <button
          id="add-rx-btn"
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Ghi đơn thuốc mới
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900 font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 font-medium">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Primary Layout grid panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column List of prescriptions */}
        <div className="lg:col-span-5 space-y-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => {
              const patient = members.find(m => m.id === rx.memberId);
              const isSelected = selectedRx?.id === rx.id;

              return (
                <div
                  key={rx.id}
                  onClick={() => setSelectedRx(rx)}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer hover:shadow-xs transition-all text-slate-800 dark:text-slate-100 ${
                    isSelected 
                      ? 'border-blue-500 shadow-sm ring-2 ring-blue-500/10' 
                      : 'border-slate-100 dark:border-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wide mr-2">
                        {patient?.name || 'Thành viên'}
                      </span>
                      <span className="text-[10px] text-slate-350 font-semibold">{rx.date}</span>
                      <h3 className="font-bold text-xs mt-2.5 truncate max-w-[210px]">{rx.hospital || 'Cơ sở ngoại chẩn'}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                        <BriefcaseMedical className="w-3.5 h-3.5 text-slate-400" /> Bác sĩ: {rx.doctor || 'Bác sĩ khoa chẩn'}
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-1.5 px-2.5 rounded-lg block">
                        💊 {rx.meds.length} thuốc
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-50 dark:border-slate-850 flex justify-between items-center text-slate-400">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Nhấn xem chi cách uống ➜</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleEdit(rx, e)}
                        className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                        title="Chỉnh sửa đơn"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {(session.role === 'admin' || session.role === 'member') && (
                        <button
                          onClick={(e) => handleDelete(rx.id, rx.date, rx.memberId, e)}
                          className="p-1 px-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                          title="Xóa đơn thuốc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-450 text-xs">
              Chưa lưu đơn kê thuốc nào trong hệ thống.
            </div>
          )}
        </div>

        {/* Right column detailed medication lists */}
        <div className="lg:col-span-7">
          {selectedRx ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-5 animate-fade-in text-slate-800 dark:text-slate-100">
              <div className="flex justify-between items-start gap-4 border-b border-slate-50 dark:border-slate-850 pb-3">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {members.find(m => m.id === selectedRx.memberId)?.name || 'Thành viên'}
                  </span>
                  <h2 className="text-sm font-bold font-sans tracking-tight mt-1 truncate max-w-[340px]">{selectedRx.hospital}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Bác sĩ chẩn: {selectedRx.doctor} • Ngày {selectedRx.date}</p>
                </div>
                <button
                  onClick={() => setSelectedRx(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drugs table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 px-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Danh sách dược phẩm</span>
                  <span className="text-[9px] text-slate-400 italic">Bấm nút chuông đổi trạng thái uống thuốc</span>
                </div>

                <div className="space-y-3.5">
                  {selectedRx.meds.map((med) => {
                    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400";
                    let label = "Đang chạy thuốc";
                    if (med.status === 'ceased') {
                      badgeClass = "bg-slate-100 text-slate-400 border-slate-100 dark:bg-slate-950 dark:text-slate-600";
                      label = "Đã ngưng uống";
                    } else if (med.status === 'chronic') {
                      badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400";
                      label = "Sử dụng lâu dài";
                    }

                    return (
                      <div 
                        key={med.id} 
                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-855 bg-slate-50/20 dark:bg-slate-900/40 relative flex flex-col justify-between sm:flex-row sm:items-center gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-indigo-500 shrink-0" />
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 select-all truncate max-w-[190px]">{med.name}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${badgeClass}`}>
                              {label}
                            </span>
                          </div>
                          
                          <div className="flex gap-2.5 flex-wrap text-[11px] text-slate-500 font-sans pl-6">
                            <span>Sản cơ: <strong className="font-semibold dark:text-slate-400">{med.strength}</strong></span>
                            <span>•</span>
                            <span>Mỗi lần: <strong className="font-semibold dark:text-slate-400">{med.dosage}</strong></span>
                            <span>•</span>
                            <span>Tần suất: <strong className="font-semibold dark:text-slate-400">{med.timesPerDay} lần/ngày</strong></span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pl-6">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Cách dùng: {med.timing} • <strong className="font-semibold text-slate-500 dark:text-slate-400">Kiên trì: {med.days} ngày</strong></span>
                          </div>
                        </div>

                        {/* Interactive Toggle state button */}
                        <div className="shrink-0 flex sm:justify-end pl-6 sm:pl-0 mt-2 sm:mt-0">
                          <button
                            onClick={() => toggleMedicationStatus(selectedRx.id, med.id, med.status)}
                            className="flex items-center gap-1 py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-450 cursor-pointer"
                          >
                            <ToggleLeft className="w-3.5 h-3.5 text-blue-500" /> Chuyển trạng thái
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs text-center p-6 h-full">
              <Pill className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-500">Đơn thuốc chưa được mở</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Chọn bất kỳ đơn nào ở bảng trái để liệt kê danh dách dược thuốc, hàm lượng, số viên, thời lượng uống mỗi tuần và tương tác trạng thái chạy thuốc thực tế.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editing prescription Drawer overlay modal */}
      {editingPrescription && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 cursor-default"
          >
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Pill className="w-5 h-5" />
                {editingPrescription.id ? 'Hiệu chỉnh đơn kê thuốc gia quyến' : 'Kê khai khẩn lập đơn thuốc lâm sàng mới'}
              </h3>
              <button
                onClick={() => setEditingPrescription(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Layout */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Bệnh nhân <span className="text-red-500">*</span></label>
                  <select
                    value={editingPrescription.memberId || ''}
                    onChange={(e) => setEditingPrescription({ ...editingPrescription, memberId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Ngày kê kê đơn <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={editingPrescription.date || ''}
                    onChange={(e) => setEditingPrescription({ ...editingPrescription, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Bác sĩ chủ đơn</label>
                  <input
                    type="text"
                    placeholder="TS.BS Hoàng Văn C"
                    value={editingPrescription.doctor || ''}
                    onChange={(e) => setEditingPrescription({ ...editingPrescription, doctor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Bệnh viện cấp kê đơn</label>
                  <input
                    type="text"
                    placeholder="Bệnh viện Chợ Rẫy TP.HCM..."
                    value={editingPrescription.hospital || ''}
                    onChange={(e) => setEditingPrescription({ ...editingPrescription, hospital: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Read from Image AI trigger */}
              <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-slate-950/20 border-y border-blue-100/50 dark:border-slate-800">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> AI Đọc Mạch Thuốc
                  </h4>
                  <p className="text-[10px] text-slate-500">Tải ảnh đơn thuốc, AI sẽ tự động đọc phân loại tên và hàm lượng.</p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanningImage || isCheckingInteractions}
                    className={`flex items-center gap-1.5 px-3 py-2 ${isScanningImage ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'} text-xs font-bold rounded-lg shadow-xs transition-colors`}
                  >
                    {isScanningImage ? (
                       <span className="animate-pulse">Đang phân tích...</span>
                    ) : (
                       <><Camera className="w-3.5 h-3.5" /> Chụp / Tải ảnh</>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-form to design individual medicine line item */}
              <div className="p-4 bg-indigo-50/20 dark:bg-slate-950/40 rounded-2xl border border-indigo-100/50 dark:border-indigo-950 text-xs">
                <span className="font-extrabold text-[10px] text-blue-600 dark:text-blue-400 block uppercase tracking-wider mb-2.5">
                  ✚ Hoặc nhập thủ công từng loại thuốc
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Tên thuốc <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Concor, Panadol, Nexium..."
                      value={curMedName}
                      onChange={(e) => setCurMedName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Hàm lượng</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 5mg, 500mg, 40mg..."
                      value={curMedStrength}
                      onChange={(e) => setCurMedStrength(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Liều uống 1 lần</label>
                    <input
                      type="text"
                      placeholder="1 viên, 2 muỗng dã, 1 gói..."
                      value={curMedDosage}
                      onChange={(e) => setCurMedDosage(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Số lần uống / ngày</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={curMedTimes}
                      onChange={(e) => setCurMedTimes(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Thời điểm & Chỉ dẫn</label>
                    <input
                      type="text"
                      placeholder="Sau ăn cơm sáng, trước ngủ 30p..."
                      value={curMedTiming}
                      onChange={(e) => setCurMedTiming(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Số ngày uống</label>
                      <input
                        type="number"
                        min="1"
                        value={curMedDays}
                        onChange={(e) => setCurMedDays(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Trạng thái dùng</label>
                      <select
                        value={curMedStatus}
                        onChange={(e) => setCurMedStatus(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs focus:outline-hidden"
                      >
                        <option value="active">Đang dùng</option>
                        <option value="chronic">Dùng dài hạn</option>
                        <option value="ceased">Đã ngưng</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMedToFormList}
                  className="mt-3.5 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer w-full"
                >
                  <Plus className="w-4 h-4" /> Thêm viên thuốc vừa kê vào đơn kê lục
                </button>
              </div>

              {/* Medicine rows list added in queue */}
              <div className="space-y-2 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Các loại thuốc đã kê ({medsList.length})</span>
                {medsList.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 dark:border-slate-800/80 rounded-xl bg-slate-50 dark:bg-slate-950 p-2.5 max-h-40 overflow-y-auto scrollbar-thin">
                    {medsList.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 dark:text-slate-150 truncate">
                            {idx + 1}. {m.name} {m.strength} • <span className="font-medium text-slate-500 italic">uống {m.dosage} ({m.timing}) trong {m.days} ngày</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedFromFormList(m.id)}
                          className="text-red-500 hover:text-red-600 font-bold px-1.5 shrink-0 cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-950 border border-dashed rounded-xl py-3 text-center">Chưa có loại dược nào được gán bốc kê. Hãy hoàn tất bảng bốc thuốc ở trên.</p>
                )}
              </div>

              {/* AI Interaction Check Result */}
              {isCheckingInteractions && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-medium p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Sparkles className="w-4 h-4 animate-pulse" /> AI đang phân tích tương tác với các đơn thuốc hiện tại...
                </div>
              )}
              {interactionWarning && !isCheckingInteractions && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <div className="w-full min-w-0">
                      <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        Cảnh báo tương tác thuốc
                        <span className="bg-orange-100 dark:bg-orange-900/50 text-[9px] px-1.5 rounded text-orange-700 dark:text-orange-300">Từ AI Lâm Sàng</span>
                      </h4>
                      <div className="prose prose-sm prose-orange dark:prose-invert max-w-none text-xs text-orange-800 dark:text-orange-300 markdown-body leading-relaxed">
                        <Markdown>{interactionWarning}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form submit buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-805">
                <button
                  type="button"
                  onClick={() => setEditingPrescription(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  onClick={handleSavePrescription}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Xác nhận lưu đơn
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Xóa đơn thuốc"
        message={`Bạn chắc chắn muốn xóa đơn thuốc kê ngày ${confirmDelete?.date} của ${confirmDelete ? members.find(m => m.id === confirmDelete.memberId)?.name || 'Thành viên' : ''}?`}
        confirmText="Xóa đơn thuốc"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
