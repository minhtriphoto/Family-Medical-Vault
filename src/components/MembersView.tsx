/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FamilyMember, UserSession } from '../types';
import { getMembers, saveMember, deleteMember, AVATAR_STYLING } from '../lib/db';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Heart, 
  UserPlus, 
  ChevronRight, 
  FileText, 
  User, 
  Scale, 
  Ruler, 
  Activity, 
  AlertOctagon, 
  HelpCircle,
  X,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface MembersViewProps {
  session: UserSession;
}

export default function MembersView({ session }: MembersViewProps) {
  const [members, setMembers] = useState<FamilyMember[]>(() => getMembers(session.familyId));
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editingMember, setEditingMember] = useState<Partial<FamilyMember> | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refreshList = () => {
    const list = getMembers(session.familyId);
    setMembers(list);
    // Sync current selection if open
    if (selectedMember) {
      const updated = list.find(m => m.id === selectedMember.id);
      setSelectedMember(updated || null);
    }
  };

  const handleCreateNew = () => {
    if (session.role !== 'admin' && session.role !== 'member') {
      setErrorMsg('Bạn cần đăng nhập để bổ sung thêm thành viên.');
      return;
    }
    setErrorMsg('');
    setEditingMember({
      id: '',
      name: '',
      birthDate: '1990-01-01',
      gender: 'Nam',
      relationship: 'Con trai',
      bloodType: 'O+',
      height: 170,
      weight: 60,
      chronicDiseases: '',
      allergies: '',
      longTermMeds: '',
      healthNotes: '',
      avatar: '0'
    });
  };

  const handleEdit = (m: FamilyMember, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin' && session.role !== 'member') {
      setErrorMsg('Bạn cần đăng nhập để chỉnh sửa thông số thành viên.');
      return;
    }
    setErrorMsg('');
    setEditingMember({ ...m });
  };

  const handleDelete = (member: FamilyMember, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin' && session.role !== 'member') {
      setErrorMsg('Bạn cần đăng nhập để xoá thành viên y khoa.');
      return;
    }
    setMemberToDelete(member);
  };

  const confirmDelete = () => {
    if (!memberToDelete) return;
    const res = deleteMember(session.familyId, memberToDelete.id, session);
    if (res.success) {
      setSuccessMsg(`Đã xóa thành viên "${memberToDelete.name}" thành công.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
      if (selectedMember?.id === memberToDelete.id) {
        setSelectedMember(null);
      }
    } else {
      setErrorMsg(res.error || 'Xảy ra lỗi trong thao tác xóa.');
    }
    setMemberToDelete(null);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setErrorMsg('');

    if (!editingMember.name?.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của thành viên.');
      return;
    }

    const res = saveMember(session.familyId, editingMember as FamilyMember, session);
    if (res.success) {
      setSuccessMsg('Đã ghi nhận thông tin thành viên thành công.');
      setEditingMember(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Lỗi lưu thông tin.');
    }
  };

  const getAge = (birthStr: string) => {
    if (!birthStr) return 0;
    const birth = new Date(birthStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Thành viên trong gia đình</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Quản lý lý lịch y khoa, nhóm máu, bệnh sử mãn tính và dị ứng thuốc của từng cá nhân
          </p>
        </div>
        {(session.role === 'admin' || session.role === 'member') ? (
          <button
            id="add-member-btn"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer select-none"
          >
            <UserPlus className="w-4 h-4" /> Thêm thành viên
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-3 py-1.5 bg-slate-100 dark:bg-slate-850 rounded-lg">
            <Lock className="w-3.5 h-3.5" /> Chế độ chỉ đọc (Giao diện)
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900 animate-fade-in font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 font-medium">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Members Cards & Detail columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Members Cards Layout List */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.length > 0 ? (
            members.map((m) => {
              const avatarIdx = parseInt(m.avatar) || 0;
              const colorBg = AVATAR_STYLING[avatarIdx % AVATAR_STYLING.length];
              const isSelected = selectedMember?.id === m.id;

              return (
                <div 
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-44 ${
                    isSelected 
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-sm tracking-wide shadow-xs"
                        style={{ backgroundColor: colorBg }}
                      >
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">
                          {m.relationship}
                        </span>
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate mt-1 leading-snug">{m.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{getAge(m.birthDate)} tuổi ({m.gender})</p>
                      </div>
                    </div>
                  </div>

                  {/* Highlights body */}
                  <div className="my-2.5 space-y-1 text-[11px] font-sans">
                    <p className="text-slate-500 dark:text-slate-400 truncate">
                      <span className="font-bold dark:text-slate-300">🩸 Nhóm:</span> {m.bloodType} • {m.height}cm / {m.weight}kg
                    </p>
                    {m.chronicDiseases && m.chronicDiseases !== 'Chưa khai báo' && m.chronicDiseases !== 'Không có' ? (
                      <p className="text-rose-600 dark:text-rose-450 truncate font-semibold">
                        ⚠️ Bệnh nền: {m.chronicDiseases}
                      </p>
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 truncate">Không có bệnh sử nền</p>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-850 pt-2.5 text-slate-400 mt-auto">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 group">
                      Nhấp xem lý lịch <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    {(session.role === 'admin' || session.role === 'member') && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleEdit(m, e)}
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(m, e)}
                          className="p-1 px-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 rounded-md transition-colors"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Mục lục trống rỗng. Hãy thêm thành viên đầu tiên.
            </div>
          )}
        </div>

        {/* Detailed Pane View Column */}
        <div className="lg:col-span-6">
          {selectedMember ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-5 animate-fade-in text-slate-800 dark:text-slate-100">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-extrabold shadow-sm shrink-0"
                    style={{ backgroundColor: AVATAR_STYLING[parseInt(selectedMember.avatar) || 0] }}
                  >
                    {selectedMember.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {selectedMember.relationship}
                    </span>
                    <h2 className="text-lg font-bold font-sans tracking-tight mt-1">{selectedMember.name}</h2>
                    <p className="text-xs text-slate-400 font-medium">Sinh ngày {selectedMember.birthDate} ({getAge(selectedMember.birthDate)} tuổi)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(session.role === 'admin' || session.role === 'member') && (
                    <>
                      <button
                        onClick={(e) => handleEdit(selectedMember, e)}
                        className="p-1 px-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg flex items-center gap-1 text-xs transition-colors cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(selectedMember, e)}
                        className="p-1 px-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-1 text-xs transition-colors cursor-pointer"
                        title="Xoá thành viên"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Xoá</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Physical Parameters Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
                  <Heart className="w-4 h-4 mx-auto text-red-500 mb-1" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Nhóm máu</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1.5">{selectedMember.bloodType}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
                  <Ruler className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Chiều cao</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1.5">{selectedMember.height} cm</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
                  <Scale className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Cân nặng</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1.5">{selectedMember.weight} kg</p>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {/* Chronic diseases box */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Bệnh lý đang có / Tiền sử bệnh nền
                  </p>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 select-all leading-relaxed">
                    {selectedMember.chronicDiseases || 'Chưa ghi nhận bệnh sử nền mãn tính.'}
                  </p>
                </div>

                {/* Allergies box */}
                <div className="space-y-1">
                  <p className="font-bold text-rose-500 dark:text-rose-450 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Dị ứng (Mỹ phẩm, Thuốc, Thực phẩm)
                  </p>
                  <p className="p-2.5 rounded-xl bg-rose-50/20 dark:bg-red-950/10 border border-rose-100/40 dark:border-red-900/10 text-rose-800 dark:text-rose-300 select-all leading-relaxed font-semibold">
                    {selectedMember.allergies || 'Được báo cáo an toàn, không dị ứng.'}
                  </p>
                </div>

                {/* Long term meds */}
                <div className="space-y-1">
                  <p className="font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> Thuốc đang sử dụng dài hạn / Định kỳ
                  </p>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedMember.longTermMeds || 'Không sử dụng thuốc dài hạn hằng ngày.'}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <HelpCircle className="w-3.5 h-3.5" /> Ghi chú chăm sóc & Dòng ý kiến khác
                  </p>
                  <p className="p-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{selectedMember.healthNotes || 'Không có ghi chú thêm.'}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs text-center p-6 h-full">
              <User className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
              <p className="font-medium text-slate-500 dark:text-slate-400">Chưa chọn thành viên xem chi tiết</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Nhấp chọn thành viên bất kỳ ở bảng bên trái để hiển thị hồ sơ y sỹ, các nhóm dị ứng và ghi chú sức khỏe đầy đủ.</p>
            </div>
          )}
        </div>
      </div>

      {/* Addition & Editing Modal (Popup Container) */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 font-sans cursor-default"
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <User className="w-5 h-5" />
                {editingMember.id ? 'Cập nhật hồ sơ thành viên' : 'Khai sinh thành viên y tế mới hành chính'}
              </h3>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Form Layout columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={editingMember.name || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/45 dark:text-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Ngày sinh y khoa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editingMember.birthDate || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/45 dark:text-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giới tính</label>
                  <select
                    value={editingMember.gender || 'Nam'}
                    onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/45 dark:text-slate-50"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quan hệ gia đình</label>
                  <select
                    value={editingMember.relationship || 'Chưa rõ'}
                    onChange={(e) => setEditingMember({ ...editingMember, relationship: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/45 dark:text-slate-50"
                  >
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Con gái">Con gái</option>
                    <option value="Ông">Ông</option>
                    <option value="Bà">Bà</option>
                    <option value="Vợ">Vợ</option>
                    <option value="Chồng">Chồng</option>
                    <option value="Khác">Khác (Anh, em...)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nhóm máu</label>
                  <select
                    value={editingMember.bloodType || 'O+'}
                    onChange={(e) => setEditingMember({ ...editingMember, bloodType: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/45 dark:text-slate-50"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chiều cao (cm)</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={editingMember.height || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, height: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cân nặng (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={editingMember.weight || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, weight: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Màu sắc định danh diện mạo</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_STYLING.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingMember({ ...editingMember, avatar: String(idx) })}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-white ${
                        editingMember.avatar === String(idx) 
                          ? 'ring-4 ring-offset-2 ring-blue-500 border-white' 
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      ✓
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bệnh lý nền (Nhiều nguồn cách nhau dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Tiểu đường, dạ dày tá tràng, cao huyết áp..."
                  value={editingMember.chronicDiseases || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, chronicDiseases: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-500 uppercase mb-1">Chi tiết dị ứng</label>
                <input
                  type="text"
                  placeholder="Dị ứng tôm, dị ứng penicillin, phấn hoa bồ công anh..."
                  value={editingMember.allergies || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, allergies: e.target.value })}
                  className="w-full px-3.5 py-2 bg-rose-50/20 dark:bg-red-950/10 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thuốc sử dụng dài dặc</label>
                <textarea
                  rows={2}
                  placeholder="Amlodipine 5mg hằng ngày uống nửa cốc sáng..."
                  value={editingMember.longTermMeds || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, longTermMeds: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50 scrollbar-thin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú theo dõi sức khỏe</label>
                <textarea
                  rows={2}
                  placeholder="Chăm đo áp gáy đột quỵ..."
                  value={editingMember.healthNotes || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, healthNotes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-50 scrollbar-thin"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Xác nhận xóa thành viên</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa hồ sơ của <strong>{memberToDelete.name}</strong>? Mọi dữ liệu về chỉ số sức khỏe, tài liệu, và đơn thuốc liên đới sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
