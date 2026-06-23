/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FamilyMember,
  MedicalDocument,
  MedicalRecord,
  Prescription,
  MedicalReminder,
  HealthMetric,
  Expense,
  ActivityLog,
  UserSession,
  ScreeningSession,
  SharedRecord
} from '../types';

// Hardcoded users for local family accounts
const USERS_DB_KEY = 'family_med_vault_users';
const MEMBERS_DB_KEY = 'family_med_vault_members';
const RECORDS_DB_KEY = 'family_med_vault_records';
const DOCUMENTS_DB_KEY = 'family_med_vault_documents';
const REMINDERS_DB_KEY = 'family_med_vault_reminders';
const METRICS_DB_KEY = 'family_med_vault_metrics';
const EXPENSES_DB_KEY = 'family_med_vault_expenses';
const LOGS_DB_KEY = 'family_med_vault_logs';
const SCREENING_DB_KEY = 'family_med_vault_screenings';
const SHARED_DB_KEY = 'family_med_vault_shared';
const CURRENT_USER_KEY = 'family_med_vault_current_session';

// Pre-packaged avatars as beautiful SVG paths/colors index
export const AVATAR_STYLING = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
];

// Helper to format date relative to today for dynamic/fresh placeholders
const daysAgo = (num: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - num);
  return d.toISOString().split('T')[0];
};

const daysAhead = (num: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + num);
  return d.toISOString().split('T')[0];
};

const defaultUsers = [
  {
    email: 'admin@gmail.com',
    password: 'admin123',
    familyId: 'fam-nguyen-van',
    role: 'admin' as const,
    memberName: 'Trần Minh Trí',
    memberId: 'mem-hai'
  },
  {
    email: 'member@gmail.com',
    password: '123456',
    familyId: 'fam-nguyen-van',
    role: 'member' as const,
    memberName: 'Nguyễn Mỹ Linh',
    memberId: 'mem-linh'
  }
];

const defaultMembers: FamilyMember[] = [
  {
    id: 'mem-hai',
    familyId: 'fam-nguyen-van',
    name: 'Trần Minh Trí',
    birthDate: '1981-05-12',
    gender: 'Nam',
    relationship: 'Bố',
    bloodType: 'O+',
    height: 172,
    weight: 74,
    chronicDiseases: 'Cao huyết áp, Gan nhiễm mỡ nhẹ',
    allergies: 'Hải sản (gây mẩn đỏ), Aspirin',
    longTermMeds: 'Amlodipine 5mg (uống sáng hằng ngày)',
    healthNotes: 'Cần hạn chế muối, tập thể dục nhẹ nhàng 30 phút buổi sáng. Khám định kỳ tim mạch mỗi 6 tháng.',
    avatar: '0' // blue
  },
  {
    id: 'mem-thuy',
    familyId: 'fam-nguyen-van',
    name: 'Trần Thị Thu Thủy',
    birthDate: '1984-09-20',
    gender: 'Nữ',
    relationship: 'Mẹ',
    bloodType: 'A+',
    height: 158,
    weight: 52,
    chronicDiseases: 'Đau dạ dày, Rối loạn tiền đình nhẹ',
    allergies: 'Penicillin, Phấn hoa',
    longTermMeds: 'Omeprazole 20mg (khi bị đau dạ dày cấp)',
    healthNotes: 'Đề phòng stress quá mức gây đau đầu và tiền đình. Ăn uống đúng giờ, không bỏ bữa.',
    avatar: '1' // pink
  },
  {
    id: 'mem-nam',
    familyId: 'fam-nguyen-van',
    name: 'Nguyễn Văn Nam',
    birthDate: '2011-03-14',
    gender: 'Nam',
    relationship: 'Con trai',
    bloodType: 'B+',
    height: 165,
    weight: 55,
    chronicDiseases: 'Viêm mũi dị ứng thời tiết',
    allergies: 'Không có dị ứng thuốc, dị ứng tôm cua nhẹ',
    longTermMeds: 'Không dùng thuốc dài hạn',
    healthNotes: 'Đang tuổi phát triển chiều cao, khuyến khích chơi bóng rổ và bơi lội. Đã tiêm ngừa sởi, quai bị đầy đủ.',
    avatar: '2' // emerald
  },
  {
    id: 'mem-linh',
    familyId: 'fam-nguyen-van',
    name: 'Nguyễn Mỹ Linh',
    birthDate: '2014-11-23',
    gender: 'Nữ',
    relationship: 'Con gái',
    bloodType: 'AB-',
    height: 148,
    weight: 38,
    chronicDiseases: 'Cận thị (-2.5 Diop cả 2 mắt)',
    allergies: 'Bụi bặm, lông động vật',
    longTermMeds: 'Nước nhỏ mắt nhân tạo bổ sung vitamin',
    healthNotes: 'Hạn chế xem màn hình quá 2 tiếng liên tục. Tái khám đo thị lực tại mắt bệnh viện Sài Gòn mỗi 6 tháng.',
    avatar: '3' // amber
  }
];

const defaultRecords: MedicalRecord[] = [
  {
    id: 'rec-1',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-hai',
    date: daysAgo(30),
    hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
    department: 'Nội tim mạch',
    doctor: 'PGS.TS. Nguyễn Lân Hiếu',
    reason: 'Đau đầu âm ỉ vùng gáy, chóng mặt buổi sáng',
    symptoms: 'Huyết áp đo tại nhà dao động 145/95 mmHg, thỉnh thoảng hồi hộp đánh trống ngực nhẹ.',
    diagnosis: 'Tăng huyết áp nguyên phát độ 1, rối loạn lipid máu nhẹ',
    conclusion: 'Huyết áp chưa kiểm soát tốt, chế độ ăn nhiều mặn, áp lực công việc cao.',
    treatment: 'Duy trì Amlodipine 5mg hằng ngày. Kèm Crestor 10mg (uống trước khi đi ngủ, ngày 1 viên). Tái khám sau 1 tháng.',
    followUpDate: daysAhead(15),
    cost: 450000,
    attachmentIds: ['doc-1']
  },
  {
    id: 'rec-2',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-thuy',
    date: daysAgo(45),
    hospital: 'Bệnh viện Quân y 175',
    department: 'Tiêu hóa',
    doctor: 'Thượng tá, BS. Nguyễn Văn Thành',
    reason: 'Đau rát vùng thượng vị, ợ hơi, khó tiêu',
    symptoms: 'Các cơn đau xuất hiện lúc đói hoặc sau ăn 2 tiếng, kèm theo buồn nôn nhẹ buổi tối.',
    diagnosis: 'Viêm loét dạ dày tá tràng lành tính, nhiễm khuẩn HP (+)',
    conclusion: 'Viêm hang vị tiến triển có nhiễm trùng vi khuẩn HP.',
    treatment: 'Phác đồ 4 thuốc trị HP gồm: Esomeprazol 40mg, Amoxicillin 1g, Clarithromycin 500mg, bismuth. Dùng liên tục 14 ngày. Ăn đồ mềm.',
    followUpDate: daysAgo(15), // đã tái khám
    cost: 1200000,
    attachmentIds: ['doc-2']
  },
  {
    id: 'rec-3',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-linh',
    date: daysAgo(60),
    hospital: 'Bệnh viện Mắt TP.HCM',
    department: 'Khoa khúc xạ',
    doctor: 'ThS.BS. Lê Thị Kim Chi',
    reason: 'Nhìn mờ bảng viết trên lớp, thỉnh thoảng mỏi mắt nhức đầu',
    symptoms: 'Xem tivi phải ngồi gần, hay nheo mắt tìm chữ bán kính xa.',
    diagnosis: 'Cận thị trục khúc xạ: Mắt trái -2.5D, Mắt phải -2.25D',
    conclusion: 'Độ cận phát triển nhanh do lạm dụng thiết bị điện tử.',
    treatment: 'Cắt kính gọng hiệu chỉnh cận thị. Nhỏ mắt dưỡng Eyelight hằng ngày, hạn chế sử dụng điện thoại ban đêm, tăng cường hoạt động ngoài trời 1-2h.',
    followUpDate: daysAhead(120),
    cost: 350000,
    attachmentIds: ['doc-3']
  }
];

const defaultDocuments: MedicalDocument[] = [
  {
    id: 'doc-1',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-hai',
    title: 'Phiếu xét nghiệm Sinh hóa & Thể tích Máu',
    date: daysAgo(30),
    hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
    type: 'lab',
    notes: 'Chỉ số Cholesterol toàn phần hơi cao (6.2 mmol/L), Men gan AST/ALT hơi cao nhẹ. Các chỉ số khác bình thường.',
    fileName: 'xet_nghiem_mau_nguyen_hai_05_2026.pdf',
    fileSize: '1.4 MB',
    fileData: 'lab_results_mock',
    tags: ['Xét nghiệm máu', 'Tim mạch', 'Mỡ máu']
  },
  {
    id: 'doc-2',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-thuy',
    title: 'Kết quả Nội soi dạ dày tá tràng HP',
    date: daysAgo(45),
    hospital: 'Bệnh viện Quân y 175',
    type: 'endoscopy',
    notes: 'Có loét trợt nhẹ rải rác vùng hang vị, test nhanh vi khuẩn Helicobacter Pylori dương tính (+)',
    fileName: 'noi_soi_da_day_hp_thuy_04_2026.jpg',
    fileSize: '3.2 MB',
    fileData: 'endoscopy_photo_mock',
    tags: ['Nội soi', 'Dạ dày', 'HP dương tính']
  },
  {
    id: 'doc-3',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-linh',
    title: 'Đơn thuốc cận thị & Biên nhận cắt kính',
    date: daysAgo(60),
    hospital: 'Bệnh viện Mắt TP.HCM',
    type: 'prescription',
    notes: 'Được dặn tái khám đo khúc xạ mắt sau mỗi 6 tháng để kịp tăng độ chống nhược thị.',
    fileName: 'don_thuoc_kinh_mat_linh_04_2026.jpg',
    fileSize: '850 KB',
    fileData: 'prescription_photo_mock',
    tags: ['Mắt kính', 'Cận thị', 'Đơn thuốc']
  }
];

const defaultReminders: MedicalReminder[] = [
  {
    id: 'rem-1',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-hai',
    type: 'appointment',
    title: 'Tái khám Tăng huyết áp - PGS.TS Nguyễn Lân Hiếu',
    date: daysAhead(15),
    time: '08:30',
    status: 'pending',
    notes: 'Mang theo sổ khám bệnh cũ và mẫu nhật ký huyết áp tự đo tại nhà 7 ngày qua.'
  },
  {
    id: 'rem-2',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-hai',
    type: 'medication',
    title: 'Uống thuốc huyết áp Amlodipine 5mg hằng ngày',
    date: daysAhead(0), // Hôm nay
    time: '07:00',
    status: 'pending',
    notes: 'Uống đều sau khi ăn sáng. Không tự ý ngưng thuốc.'
  },
  {
    id: 'rem-3',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-nam',
    type: 'vaccination',
    title: 'Tiêm ngừa Vaccine Cúm mùa định kỳ hằng năm',
    date: daysAhead(22),
    time: '09:00',
    status: 'pending',
    notes: 'Tại trạm y tế phường hoặc trung tâm Vnvc gần nhất. Nhớ mang sổ tiêm ngừa.'
  },
  {
    id: 'rem-4',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-linh',
    type: 'routine',
    title: 'Xét nghiệm mắt định kỳ - Khoa khúc xạ BV Mắt',
    date: daysAhead(60),
    time: '14:00',
    status: 'pending',
    notes: 'Kiểm tra xem độ cận của mắt có gia tăng đột biến không để điều chỉnh kính kịp thời.'
  },
  {
    id: 'rem-5',
    familyId: 'fam-nguyen-van',
    memberId: 'mem-thuy',
    type: 'medication',
    title: 'Uống men tiêu hóa bổ sung hằng ngày',
    date: daysAhead(0),
    time: '12:00',
    status: 'completed',
    notes: 'Hỗ trợ khôi phục hệ vi sinh đường ruột sau đợt uống kháng sinh HP.'
  }
];

// Seed detailed health metrics covering the past 6 months to display gorgeous charts
const defaultMetrics: HealthMetric[] = [
  // Nguyễn Văn Hải (Bố) - Tim mạch
  { id: 'met-1', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(120), bpSystolic: 151, bpDiastolic: 98, weight: 75.2, heartRate: 84 },
  { id: 'met-2', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(90), bpSystolic: 148, bpDiastolic: 96, weight: 75.0, heartRate: 80, bloodSugar: 125, cholesterol: 6.5 },
  { id: 'met-3', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(60), bpSystolic: 145, bpDiastolic: 92, weight: 74.5, heartRate: 78, cholesterol: 6.2 },
  { id: 'met-4', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(30), bpSystolic: 140, bpDiastolic: 89, weight: 74.0, heartRate: 76, bloodSugar: 110 },
  { id: 'met-5', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(15), bpSystolic: 135, bpDiastolic: 86, weight: 74.1, heartRate: 74, bloodSugar: 104, cholesterol: 5.4 },
  { id: 'met-6', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(1), bpSystolic: 128, bpDiastolic: 82, weight: 73.8, heartRate: 72, bloodSugar: 98, cholesterol: 5.1 },

  // Trần Thị Thu Thủy (Mẹ) - Dạ dày, cân nặng
  { id: 'met-thuy-1', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(90), weight: 54, bpSystolic: 115, bpDiastolic: 75, heartRate: 74 },
  { id: 'met-thuy-2', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(60), weight: 53.2, bpSystolic: 112, bpDiastolic: 72, heartRate: 76, uricAcid: 280, bloodSugar: 94 },
  { id: 'met-thuy-3', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(45), weight: 51.5, bpSystolic: 110, bpDiastolic: 70, heartRate: 79 },
  { id: 'met-thuy-4', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(15), weight: 52.0, bpSystolic: 115, bpDiastolic: 75, heartRate: 72, bloodSugar: 90 },
  { id: 'met-thuy-5', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(2), weight: 52.4, bpSystolic: 116, bpDiastolic: 76, heartRate: 70, uricAcid: 260 },

  // Nguyễn Văn Nam (Con trai) - Cân nặng chiều cao phát triển
  { id: 'met-nam-1', familyId: 'fam-nguyen-van', memberId: 'mem-nam', date: daysAgo(150), weight: 51, bpSystolic: 110, bpDiastolic: 70, heartRate: 75 },
  { id: 'met-nam-2', familyId: 'fam-nguyen-van', memberId: 'mem-nam', date: daysAgo(100), weight: 52, bpSystolic: 112, bpDiastolic: 72, heartRate: 76 },
  { id: 'met-nam-3', familyId: 'fam-nguyen-van', memberId: 'mem-nam', date: daysAgo(50), weight: 53.8, bpSystolic: 114, bpDiastolic: 72, heartRate: 72 },
  { id: 'met-nam-4', familyId: 'fam-nguyen-van', memberId: 'mem-nam', date: daysAgo(5), weight: 55.0, bpSystolic: 115, bpDiastolic: 74, heartRate: 74 }
];

const defaultExpenses: Expense[] = [
  { id: 'exp-1', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(30), category: 'visit', description: 'Khám tim mạch định kỳ chuyên sâu PGS Nguyễn Lân Hiếu', insuranceAmount: 300000, selfPaidAmount: 150000, totalAmount: 450000, hospital: 'Bệnh viện Đại học Y Dược' },
  { id: 'exp-2', familyId: 'fam-nguyen-van', memberId: 'mem-hai', date: daysAgo(30), category: 'meds', description: 'Thuốc điều trị huyết áp hằng ngày (Amlodipine & Crestor)', insuranceAmount: 180000, selfPaidAmount: 120000, totalAmount: 300000, hospital: 'Nhà thuốc trung sơn Đại học Y Dược' },
  { id: 'exp-3', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(45), category: 'visit', description: 'Nội soi dạ dày gây mê phát hiện HP', insuranceAmount: 850000, selfPaidAmount: 350000, totalAmount: 1200000, hospital: 'Bệnh viện Quân y 175' },
  { id: 'exp-4', familyId: 'fam-nguyen-van', memberId: 'mem-thuy', date: daysAgo(45), category: 'meds', description: 'Combo kháng sinh phác đồ loét dạ dày HP', insuranceAmount: 420000, selfPaidAmount: 280000, totalAmount: 700000, hospital: 'Bệnh viện Quân y 175' },
  { id: 'exp-5', familyId: 'fam-nguyen-van', memberId: 'mem-linh', date: daysAgo(60), category: 'visit', description: 'Đo khám mắt & Khúc xạ chuyên sâu', insuranceAmount: 150000, selfPaidAmount: 200000, totalAmount: 350000, hospital: 'Bệnh viện Mắt TP.HCM' },
  { id: 'exp-6', familyId: 'fam-nguyen-van', memberId: 'mem-linh', date: daysAgo(60), category: 'other', description: 'Cắt kính khúc xạ cận thị gọng chống loá', insuranceAmount: 0, selfPaidAmount: 950000, totalAmount: 950000, hospital: 'Mắt kính Nhật Bản Eyewear' },
  { id: 'exp-7', familyId: 'fam-nguyen-van', memberId: 'mem-nam', date: daysAgo(75), category: 'lab', description: 'Xét nghiệm dị ứng thức ăn panel 60 dị nguyên', insuranceAmount: 500000, selfPaidAmount: 600000, totalAmount: 1100000, hospital: 'Trung tâm xét nghiệm Medic Hòa Hảo' }
];

const defaultLogs: ActivityLog[] = [
  { id: 'log-1', familyId: 'fam-nguyen-van', userEmail: 'admin@gmail.com', action: 'Khởi tạo hệ thống', timestamp: daysAgo(60) + ' 08:00:00', details: 'Hệ thống Family Medical Vault được khởi tạo thành công bởi Admin Nguyễn Văn Hải.' },
  { id: 'log-2', familyId: 'fam-nguyen-van', userEmail: 'admin@gmail.com', action: 'Đồng bộ dữ liệu', timestamp: daysAgo(60) + ' 08:15:00', details: 'Nạp thông tin sức khỏe cơ bản cho 4 thành viên gia đình.' },
  { id: 'log-3', familyId: 'fam-nguyen-van', userEmail: 'admin@gmail.com', action: 'Thêm hồ sơ bệnh án', timestamp: daysAgo(30) + ' 11:30:22', details: 'Thêm lịch sử khám tăng huyết áp cho thành viên Nguyễn Văn Hải tại BV Đại Học Y Dược.' }
];

// Initialize DB with dummy data if not present
export function initDB() {
  if (!localStorage.getItem(USERS_DB_KEY)) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(defaultUsers));
  } else {
    // Migrate existing admin to new password and name
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const adminIndex = users.findIndex((u: any) => u.email === 'admin@gmail.com');
    if (adminIndex !== -1 && users[adminIndex].password === '123456') {
      users[adminIndex].password = 'admin123';
      users[adminIndex].memberName = 'Trần Minh Trí';
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }
  }

  if (!localStorage.getItem(MEMBERS_DB_KEY)) {
    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(defaultMembers));
  } else {
    // Migrate existing member name
    const members = JSON.parse(localStorage.getItem(MEMBERS_DB_KEY) || '[]');
    const adminMemIndex = members.findIndex((m: any) => m.id === 'mem-hai');
    if (adminMemIndex !== -1 && members[adminMemIndex].name === 'Nguyễn Văn Hải') {
      members[adminMemIndex].name = 'Trần Minh Trí';
      localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(members));
    }
  }

  if (!localStorage.getItem(RECORDS_DB_KEY)) {
    localStorage.setItem(RECORDS_DB_KEY, JSON.stringify(defaultRecords));
  }
  if (!localStorage.getItem(DOCUMENTS_DB_KEY)) {
    localStorage.setItem(DOCUMENTS_DB_KEY, JSON.stringify(defaultDocuments));
  }
  if (!localStorage.getItem(REMINDERS_DB_KEY)) {
    localStorage.setItem(REMINDERS_DB_KEY, JSON.stringify(defaultReminders));
  }
  if (!localStorage.getItem(METRICS_DB_KEY)) {
    localStorage.setItem(METRICS_DB_KEY, JSON.stringify(defaultMetrics));
  }
  if (!localStorage.getItem(EXPENSES_DB_KEY)) {
    localStorage.setItem(EXPENSES_DB_KEY, JSON.stringify(defaultExpenses));
  }
  if (!localStorage.getItem(LOGS_DB_KEY)) {
    localStorage.setItem(LOGS_DB_KEY, JSON.stringify(defaultLogs));
  }
}

// Call init standard
initDB();

// ---------------- USER MANAGEMENT & SESSIONS ----------------

export function getCurrentSession(): UserSession | null {
  const sess = localStorage.getItem(CURRENT_USER_KEY);
  if (!sess) return null;
  try {
    return JSON.parse(sess);
  } catch {
    return null;
  }
}

export function setCurrentSession(session: UserSession | null) {
  if (session) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function loginUser(emailInput: string, passwordInput: string): UserSession | { error: string } {
  const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  const email = emailInput.trim().toLowerCase();
  
  const found = users.find((u: any) => u.email === email && u.password === passwordInput);
  if (found) {
    const session: UserSession = {
      email: found.email,
      familyId: found.familyId,
      role: found.role,
      memberName: found.memberName,
      memberId: found.memberId
    };
    setCurrentSession(session);
    logMutation(session.familyId, session.email, 'Đăng nhập', 'Đăng nhập thành công vào hệ thống.');
    return session;
  }

  // Support on-the-fly registration for new users!
  if (email.length > 3 && passwordInput.length >= 6) {
    // Check if user already exists
    const exists = users.find((u: any) => u.email === email);
    if (exists) {
      return { error: 'Mật khẩu không chính xác hoặc tài khoản đã tồn tại' };
    }

    // Create a new family entity dynamically!
    const cleanName = email.split('@')[0];
    const uppercaseName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const newFamilyId = 'fam-' + cleanName + '-' + Date.now().toString().slice(-4);
    const newMemberId = 'mem-user-' + Date.now().toString().slice(-4);

    const newUser = {
      email,
      password: passwordInput,
      familyId: newFamilyId,
      role: 'admin' as const,
      memberName: uppercaseName,
      memberId: newMemberId
    };

    // Add user to DB
    const updatedUsers = [...users, newUser];
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));

    // Create a corresponding primary family member record
    const newMember: FamilyMember = {
      id: newMemberId,
      familyId: newFamilyId,
      name: uppercaseName,
      birthDate: '1990-01-01',
      gender: 'Nam',
      relationship: 'Bố',
      bloodType: 'O+',
      height: 170,
      weight: 60,
      chronicDiseases: 'Chưa khai báo',
      allergies: 'Chưa khai báo',
      longTermMeds: 'Không có',
      healthNotes: 'Tài khoản chính mới tạo.',
      avatar: '0'
    };

    const members = JSON.parse(localStorage.getItem(MEMBERS_DB_KEY) || '[]');
    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify([...members, newMember]));

    const session: UserSession = {
      email: newUser.email,
      familyId: newUser.familyId,
      role: newUser.role,
      memberName: newUser.memberName,
      memberId: newUser.memberId
    };
    setCurrentSession(session);

    // Initial log
    logMutation(newFamilyId, email, 'Khởi tạo tài khoản', `Chào mừng ${uppercaseName} khởi tạo số sức khỏe gia đình mới.`);
    return session;
  }

  return { error: 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc nhập mật khẩu từ 6 ký tự để tự tạo tài khoản.' };
}

export function logout() {
  const session = getCurrentSession();
  if (session) {
    logMutation(session.familyId, session.email, 'Đăng xuất', 'Đóng phiên làm việc.');
  }
  setCurrentSession(null);
}

// ---------------- AUDIT LOGS MUTATION ----------------

function logMutation(familyId: string, email: string, action: string, details: string) {
  const list: ActivityLog[] = JSON.parse(localStorage.getItem(LOGS_DB_KEY) || '[]');
  const now = new Date();
  
  const formattedTime = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + ' ' + 
    String(now.getHours()).padStart(2, '0') + ':' + 
    String(now.getMinutes()).padStart(2, '0') + ':' + 
    String(now.getSeconds()).padStart(2, '0');

  const newLog: ActivityLog = {
    id: 'log-' + Math.random().toString(36).slice(2, 11),
    familyId,
    userEmail: email,
    action,
    timestamp: formattedTime,
    details
  };

  localStorage.setItem(LOGS_DB_KEY, JSON.stringify([newLog, ...list]));
}

export function getLogs(familyId: string): ActivityLog[] {
  const list: ActivityLog[] = JSON.parse(localStorage.getItem(LOGS_DB_KEY) || '[]');
  return list.filter(l => l.familyId === familyId);
}

// ---------------- MEMBERS ----------------

export function getMembers(familyId: string): FamilyMember[] {
  const list: FamilyMember[] = JSON.parse(localStorage.getItem(MEMBERS_DB_KEY) || '[]');
  return list.filter(m => m.familyId === familyId);
}

export function saveMember(familyId: string, member: FamilyMember, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin' && session.role !== 'member') {
    return { success: false, error: 'Chỉ có thành viên gia đình mới được quyền quản lý thành viên.' };
  }

  const list: FamilyMember[] = JSON.parse(localStorage.getItem(MEMBERS_DB_KEY) || '[]');
  const existingIndex = list.findIndex(m => m.id === member.id && m.familyId === familyId);

  if (existingIndex > -1) {
    // Update
    list[existingIndex] = { ...member, familyId };
    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Cập nhật thành viên', `Cập nhật thông tin của thành viên: ${member.name}`);
  } else {
    // Create new
    const newMember = { ...member, id: member.id || 'mem-' + Math.random().toString(36).slice(2, 9), familyId };
    list.push(newMember);
    localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Thêm thành viên', `Đã thêm thành viên mới: ${member.name} (${member.relationship})`);
  }

  return { success: true };
}

export function deleteMember(familyId: string, memberId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin' && session.role !== 'member') {
    return { success: false, error: 'Chỉ có thành viên gia đình mới được quyền quản lý thành viên.' };
  }

  let list: FamilyMember[] = JSON.parse(localStorage.getItem(MEMBERS_DB_KEY) || '[]');
  const member = list.find(m => m.id === memberId && m.familyId === familyId);
  if (!member) return { success: false, error: 'Không tìm thấy thành viên.' };

  list = list.filter(m => !(m.id === memberId && m.familyId === familyId));
  localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(list));
  
  // Cascade delete logic
  // 1. Records
  let records: MedicalRecord[] = JSON.parse(localStorage.getItem(RECORDS_DB_KEY) || '[]');
  records = records.filter(r => !(r.memberId === memberId && r.familyId === familyId));
  localStorage.setItem(RECORDS_DB_KEY, JSON.stringify(records));
  
  // 2. Documents
  let docs: MedicalDocument[] = JSON.parse(localStorage.getItem(DOCUMENTS_DB_KEY) || '[]');
  docs = docs.filter(d => !(d.memberId === memberId && d.familyId === familyId));
  localStorage.setItem(DOCUMENTS_DB_KEY, JSON.stringify(docs));
  
  // 3. Reminders
  let rems: MedicalReminder[] = JSON.parse(localStorage.getItem(REMINDERS_DB_KEY) || '[]');
  rems = rems.filter(r => !(r.memberId === memberId && r.familyId === familyId));
  localStorage.setItem(REMINDERS_DB_KEY, JSON.stringify(rems));
  
  // 4. Metrics
  let mets: HealthMetric[] = JSON.parse(localStorage.getItem(METRICS_DB_KEY) || '[]');
  mets = mets.filter(m => !(m.memberId === memberId && m.familyId === familyId));
  localStorage.setItem(METRICS_DB_KEY, JSON.stringify(mets));
  
  // 5. Expenses
  let exps: Expense[] = JSON.parse(localStorage.getItem(EXPENSES_DB_KEY) || '[]');
  exps = exps.filter(e => !(e.memberId === memberId && e.familyId === familyId));
  localStorage.setItem(EXPENSES_DB_KEY, JSON.stringify(exps));
  
  // 6. Prescriptions (stored in custom key)
  const preKey = 'family_med_vault_prescriptions_data';
  let rxs = JSON.parse(localStorage.getItem(preKey) || '[]');
  rxs = rxs.filter((r: any) => !(r.memberId === memberId && r.familyId === familyId));
  localStorage.setItem(preKey, JSON.stringify(rxs));

  logMutation(familyId, session.email, 'Xóa thành viên', `Xóa thành viên: ${member.name} và toàn bộ dữ liệu liên quan.`);
  return { success: true };
}

// ---------------- MEDICAL RECORDS ----------------

export function getMedicalRecords(familyId: string): MedicalRecord[] {
  const list: MedicalRecord[] = JSON.parse(localStorage.getItem(RECORDS_DB_KEY) || '[]');
  return list.filter(r => r.familyId === familyId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getMedicalRecordById(recordId: string): MedicalRecord | null {
  const list: MedicalRecord[] = JSON.parse(localStorage.getItem(RECORDS_DB_KEY) || '[]');
  return list.find(r => r.id === recordId) || null;
}

export function saveMedicalRecord(familyId: string, record: MedicalRecord, session: UserSession): { success: boolean; error?: string } {
  const list: MedicalRecord[] = JSON.parse(localStorage.getItem(RECORDS_DB_KEY) || '[]');
  const members = getMembers(familyId);
  const targetMemberName = members.find(m => m.id === record.memberId)?.name || 'Không rõ';

  const existingIndex = list.findIndex(r => r.id === record.id && r.familyId === familyId);

  if (existingIndex > -1) {
    list[existingIndex] = { ...record, familyId };
    localStorage.setItem(RECORDS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Cập nhật hồ sơ bệnh án', `Chỉnh sửa bệnh án khám ngày ${record.date} của ${targetMemberName}`);
  } else {
    const newRecord = { ...record, id: record.id || 'rec-' + Math.random().toString(36).slice(2, 9), familyId };
    list.push(newRecord);
    localStorage.setItem(RECORDS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Thêm hồ sơ bệnh án', `Thêm mới hồ sơ khám bệnh (${record.department}) của ${targetMemberName}`);
  }

  return { success: true };
}

export function deleteMedicalRecord(familyId: string, recordId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin' && session.role !== 'member') {
    return { success: false, error: 'Chỉ có thành viên gia đình mới có quyền xóa dữ liệu bệnh án.' };
  }

  let list: MedicalRecord[] = JSON.parse(localStorage.getItem(RECORDS_DB_KEY) || '[]');
  const existing = list.find(r => r.id === recordId && r.familyId === familyId);
  if (!existing) return { success: false, error: 'Không tìm thấy hồ sơ.' };

  list = list.filter(r => !(r.id === recordId && r.familyId === familyId));
  localStorage.setItem(RECORDS_DB_KEY, JSON.stringify(list));

  const members = getMembers(familyId);
  const mName = members.find(m => m.id === existing.memberId)?.name || 'Không rõ';
  logMutation(familyId, session.email, 'Xóa hồ sơ bệnh án', `Xóa bệnh án khám tại ${existing.hospital} của ${mName}`);

  return { success: true };
}

// ---------------- DOCUMENTS ----------------

export function getDocuments(familyId: string): MedicalDocument[] {
  const list: MedicalDocument[] = JSON.parse(localStorage.getItem(DOCUMENTS_DB_KEY) || '[]');
  return list.filter(d => d.familyId === familyId).sort((a, b) => b.date.localeCompare(a.date));
}

export function saveDocument(familyId: string, doc: MedicalDocument, session: UserSession): { success: boolean; error?: string } {
  const list: MedicalDocument[] = JSON.parse(localStorage.getItem(DOCUMENTS_DB_KEY) || '[]');
  const existingIndex = list.findIndex(d => d.id === doc.id && d.familyId === familyId);
  const members = getMembers(familyId);
  const mName = members.find(m => m.id === doc.memberId)?.name || 'Không rõ';

  if (existingIndex > -1) {
    list[existingIndex] = { ...doc, familyId };
    localStorage.setItem(DOCUMENTS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Sửa tài liệu y tế', `Sửa thông tin tài liệu "${doc.title}" gắn với thành viên ${mName}`);
  } else {
    const newDoc = { ...doc, id: doc.id || 'doc-' + Math.random().toString(36).slice(2, 9), familyId };
    list.push(newDoc);
    localStorage.setItem(DOCUMENTS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Thêm tài liệu y tế', `Đã tải lên tài liệu mới: "${doc.title}" của ${mName}`);
  }

  return { success: true };
}

export function deleteDocument(familyId: string, docId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin' && session.role !== 'member') {
    return { success: false, error: 'Chỉ có thành viên gia đình mới có quyền xóa tài liệu y tế.' };
  }

  let list: MedicalDocument[] = JSON.parse(localStorage.getItem(DOCUMENTS_DB_KEY) || '[]');
  const existing = list.find(d => d.id === docId && d.familyId === familyId);
  if (!existing) return { success: false, error: 'Không tìm thấy tài liệu.' };

  list = list.filter(d => !(d.id === docId && d.familyId === familyId));
  localStorage.setItem(DOCUMENTS_DB_KEY, JSON.stringify(list));

  logMutation(familyId, session.email, 'Xóa tài liệu y tế', `Xóa tài liệu y tế "${existing.title}"`);
  return { success: true };
}

// ---------------- PRESCRIPTIONS (Đơn thuốc) ----------------

export function getPrescriptions(familyId: string): Prescription[] {
  // Built directly from records and documents index as custom prescriptions
  const docs = getDocuments(familyId).filter(d => d.type === 'prescription');
  const records = getMedicalRecords(familyId);
  
  // Return typed collections from standard mock or direct matching
  const preKey = 'family_med_vault_prescriptions_data';
  let rxList: Prescription[] = [];
  
  try {
    const store = localStorage.getItem(preKey);
    if (store) {
      rxList = JSON.parse(store);
    } else {
      // Seed initial prescriptions from record history!
      rxList = [
        {
          id: 'rx-hai-1',
          familyId: 'fam-nguyen-van',
          memberId: 'mem-hai',
          date: daysAgo(30),
          doctor: 'PGS.TS. Nguyễn Lân Hiếu',
          hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
          imageAttached: 'prescription_photo_mock',
          meds: [
            { id: 'm-1', name: 'Amlodipine', strength: '5mg', dosage: '1 viên', timesPerDay: 1, timing: 'Sau ăn sáng', days: 30, status: 'active' },
            { id: 'm-2', name: 'Crestor', strength: '10mg', dosage: '1 viên', timesPerDay: 1, timing: 'Sau ăn tối, trước đi ngủ', days: 30, status: 'active' }
          ]
        },
        {
          id: 'rx-thuy-1',
          familyId: 'fam-nguyen-van',
          memberId: 'mem-thuy',
          date: daysAgo(45),
          doctor: 'Thương tá, BS. Nguyễn Văn Thành',
          hospital: 'Bệnh viện Quân y 175',
          imageAttached: 'endoscopy_photo_mock',
          meds: [
            { id: 'm-3', name: 'Esomeprazol', strength: '40mg', dosage: '1 viên', timesPerDay: 1, timing: 'Trước ăn sáng 30 phút', days: 14, status: 'ceased' },
            { id: 'm-4', name: 'Amoxicillin', strength: '500mg', dosage: '2 viên', timesPerDay: 2, timing: 'Sau ăn sáng/tối', days: 14, status: 'ceased' },
            { id: 'm-5', name: 'Clarithromycin', strength: '500mg', dosage: '1 viên', timesPerDay: 2, timing: 'Sau ăn sáng/tối', days: 14, status: 'ceased' }
          ]
        }
      ];
      localStorage.setItem(preKey, JSON.stringify(rxList));
    }
  } catch {
    rxList = [];
  }

  return rxList.filter(rx => rx.familyId === familyId).sort((a,b) => b.date.localeCompare(a.date));
}

export function savePrescription(familyId: string, rx: Prescription, session: UserSession): { success: boolean; error?: string } {
  const preKey = 'family_med_vault_prescriptions_data';
  let rxList = getPrescriptions(familyId);
  const fullStoredList: Prescription[] = JSON.parse(localStorage.getItem(preKey) || '[]');
  
  const existingIdx = fullStoredList.findIndex(r => r.id === rx.id);
  const members = getMembers(familyId);
  const mName = members.find(m => m.id === rx.memberId)?.name || 'Không rõ';

  if (existingIdx > -1) {
    fullStoredList[existingIdx] = { ...rx, familyId };
    localStorage.setItem(preKey, JSON.stringify(fullStoredList));
    logMutation(familyId, session.email, 'Cập nhật đơn thuốc', `Chỉnh sửa thuốc điều trị cho ${mName} kê ngày ${rx.date}`);
  } else {
    const newRx = { ...rx, id: rx.id || 'rx-' + Math.random().toString(36).slice(2, 9), familyId };
    fullStoredList.push(newRx);
    localStorage.setItem(preKey, JSON.stringify(fullStoredList));
    logMutation(familyId, session.email, 'Thêm đơn thuốc', `Kê thành công đơn thuốc mới (gồm ${rx.meds.length} thuốc) cho ${mName}`);
  }

  return { success: true };
}

export function deletePrescription(familyId: string, rxId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin' && session.role !== 'member') {
    return { success: false, error: 'Chỉ có thành viên gia đình mới có quyền xóa đơn thuốc.' };
  }

  const preKey = 'family_med_vault_prescriptions_data';
  // Ensure table is loaded and contains dynamic seeds if not yet loaded in active browser session
  const rxList = getPrescriptions(familyId);
  let fullStoredList: Prescription[] = JSON.parse(localStorage.getItem(preKey) || '[]');
  
  const existing = fullStoredList.find(r => r.id === rxId);
  if (!existing) return { success: false, error: 'Không tìm thấy đơn thuốc.' };

  fullStoredList = fullStoredList.filter(r => r.id !== rxId);
  localStorage.setItem(preKey, JSON.stringify(fullStoredList));

  const members = getMembers(familyId);
  const mName = members.find(m => m.id === existing.memberId)?.name || 'Không rõ';
  logMutation(familyId, session.email, 'Xóa đơn thuốc', `Xóa đơn thuốc của ${mName} cũ bốc ngày ${existing.date}`);

  return { success: true };
}

// ---------------- REMINDERS ----------------

export function getReminders(familyId: string): MedicalReminder[] {
  const list: MedicalReminder[] = JSON.parse(localStorage.getItem(REMINDERS_DB_KEY) || '[]');
  return list.filter(r => r.familyId === familyId).sort((b, a) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

export function saveReminder(familyId: string, reminder: MedicalReminder, session: UserSession): { success: boolean; error?: string } {
  const list: MedicalReminder[] = JSON.parse(localStorage.getItem(REMINDERS_DB_KEY) || '[]');
  const existingIndex = list.findIndex(r => r.id === reminder.id && r.familyId === familyId);
  const members = getMembers(familyId);
  const mName = members.find(m => m.id === reminder.memberId)?.name || 'Không rõ';

  if (existingIndex > -1) {
    list[existingIndex] = { ...reminder, familyId };
    localStorage.setItem(REMINDERS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Cập nhật lịch nhắc', `Sửa lịch nhắc: "${reminder.title}" cho ${mName}`);
  } else {
    const newRem = { ...reminder, id: reminder.id || 'rem-' + Math.random().toString(36).slice(2, 9), familyId };
    list.push(newRem);
    localStorage.setItem(REMINDERS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Thêm lịch nhắc', `Đã lên lịch nhắc: "${reminder.title}" cho ${mName}`);
  }

  return { success: true };
}

export function toggleReminderState(familyId: string, reminderId: string, userEmail: string): { success: boolean } {
  const list: MedicalReminder[] = JSON.parse(localStorage.getItem(REMINDERS_DB_KEY) || '[]');
  const idx = list.findIndex(r => r.id === reminderId && r.familyId === familyId);

  if (idx > -1) {
    const prevStatus = list[idx].status;
    const nextStatus = prevStatus === 'completed' ? 'pending' : 'completed';
    list[idx].status = nextStatus;
    localStorage.setItem(REMINDERS_DB_KEY, JSON.stringify(list));
    logMutation(familyId, userEmail, 'Đánh dấu lịch nhắc', `Chuyển trạng thái lịch nhắc "${list[idx].title}" sang [${nextStatus === 'completed' ? 'Hoàn thành' : 'Chờ thực hiện'}]`);
  }

  return { success: true };
}

export function deleteReminder(familyId: string, reminderId: string, session: UserSession): { success: boolean; error?: string } {
  let list: MedicalReminder[] = JSON.parse(localStorage.getItem(REMINDERS_DB_KEY) || '[]');
  const existing = list.find(r => r.id === reminderId && r.familyId === familyId);
  if (!existing) return { success: false, error: 'Không tìm thấy lịch nhắc.' };

  list = list.filter(r => !(r.id === reminderId && r.familyId === familyId));
  localStorage.setItem(REMINDERS_DB_KEY, JSON.stringify(list));

  logMutation(familyId, session.email, 'Xóa lịch nhắc', `Xóa lịch nhắc "${existing.title}"`);
  return { success: true };
}

// ---------------- HEALTH METRICS ----------------

export function getHealthMetrics(familyId: string, memberId?: string): HealthMetric[] {
  const list: HealthMetric[] = JSON.parse(localStorage.getItem(METRICS_DB_KEY) || '[]');
  const filtered = list.filter(m => m.familyId === familyId);
  if (memberId) {
    return filtered.filter(m => m.memberId === memberId).sort((a, b) => a.date.localeCompare(b.date));
  }
  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

export function addHealthMetric(familyId: string, metric: HealthMetric, session: UserSession): { success: boolean; error?: string } {
  const list: HealthMetric[] = JSON.parse(localStorage.getItem(METRICS_DB_KEY) || '[]');
  const members = getMembers(familyId);
  const mName = members.find(m => m.id === metric.memberId)?.name || 'Không rõ';

  const newMetric = { ...metric, id: 'met-' + Math.random().toString(36).slice(2, 9), familyId };
  list.push(newMetric);
  localStorage.setItem(METRICS_DB_KEY, JSON.stringify(list));

  // Build key metric summaries for logging details
  let detailSummary = '';
  if (metric.bpSystolic && metric.bpDiastolic) detailSummary += `Huyết áp ${metric.bpSystolic}/${metric.bpDiastolic} mmHg. `;
  if (metric.bloodSugar) detailSummary += `Đường huyết ${metric.bloodSugar} mg/dL. `;
  if (metric.weight) detailSummary += `Cân nặng ${metric.weight} kg. `;
  if (metric.heartRate) detailSummary += `Nhịp tim ${metric.heartRate} bpm. `;

  logMutation(familyId, session.email, 'Cập nhật chỉ số sức khỏe', `Ghi nhận chỉ số sức khỏe mới cho ${mName}: ${detailSummary}`);
  return { success: true };
}

export function deleteHealthMetric(familyId: string, metricId: string, session: UserSession): { success: boolean; error?: string } {
  let list: HealthMetric[] = JSON.parse(localStorage.getItem(METRICS_DB_KEY) || '[]');
  const existing = list.find(m => m.id === metricId && m.familyId === familyId);
  if (!existing) return { success: false, error: 'Không tìm thấy bản ghi chỉ số.' };

  list = list.filter(m => !(m.id === metricId && m.familyId === familyId));
  localStorage.setItem(METRICS_DB_KEY, JSON.stringify(list));

  const members = getMembers(familyId);
  const mName = members.find(m => m.id === existing.memberId)?.name || 'Không rõ';
  logMutation(familyId, session.email, 'Xóa chỉ số sức khỏe', `Xóa bản ghi chỉ số ngày ${existing.date} của ${mName}`);

  return { success: true };
}

// ---------------- EXPENSES ----------------

export function getExpenses(familyId: string): Expense[] {
  const list: Expense[] = JSON.parse(localStorage.getItem(EXPENSES_DB_KEY) || '[]');
  return list.filter(e => e.familyId === familyId).sort((a,b) => b.date.localeCompare(a.date));
}

export function saveExpense(familyId: string, expense: Expense, session: UserSession): { success: boolean; error?: string } {
  const list: Expense[] = JSON.parse(localStorage.getItem(EXPENSES_DB_KEY) || '[]');
  const existingIndex = list.findIndex(e => e.id === expense.id && e.familyId === familyId);
  const members = getMembers(familyId);
  const mName = members.find(m => m.id === expense.memberId)?.name || 'Không rõ';

  if (existingIndex > -1) {
    list[existingIndex] = { ...expense, familyId };
    localStorage.setItem(EXPENSES_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Cập nhật chi phí y tế', `Cập nhật chi phí "${expense.description}" (${expense.totalAmount.toLocaleString('vi-VN')} đ) cho ${mName}`);
  } else {
    const newExp = { ...expense, id: expense.id || 'exp-' + Math.random().toString(36).slice(2, 9), familyId };
    list.push(newExp);
    localStorage.setItem(EXPENSES_DB_KEY, JSON.stringify(list));
    logMutation(familyId, session.email, 'Thêm chi phí y tế', `Ghi nhận chi phí mới "${expense.description}" (${expense.totalAmount.toLocaleString('vi-VN')} đ) cho ${mName}`);
  }

  return { success: true };
}

export function deleteExpense(familyId: string, expenseId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin' && session.role !== 'member') {
    return { success: false, error: 'Chỉ có thành viên gia đình mới có quyền xóa chứng từ hóa đơn chi phí.' };
  }

  let list: Expense[] = JSON.parse(localStorage.getItem(EXPENSES_DB_KEY) || '[]');
  const existing = list.find(e => e.id === expenseId && e.familyId === familyId);
  if (!existing) return { success: false, error: 'Không tìm thấy bản ghi chi phí.' };

  list = list.filter(e => !(e.id === expenseId && e.familyId === familyId));
  localStorage.setItem(EXPENSES_DB_KEY, JSON.stringify(list));

  const members = getMembers(familyId);
  const mName = members.find(m => m.id === existing.memberId)?.name || 'Không rõ';
  logMutation(familyId, session.email, 'Xóa chi phí y tế', `Xóa chi phí "${existing.description}" của ${mName}`);

  return { success: true };
}

// ---------------- SCREENING SESSIONS ----------------
export function getScreenings(familyId: string): ScreeningSession[] {
  const list: ScreeningSession[] = JSON.parse(localStorage.getItem(SCREENING_DB_KEY) || '[]');
  return list.filter(s => s.familyId === familyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function saveScreening(familyId: string, sessionData: ScreeningSession, session: UserSession): { success: boolean; error?: string } {
  let list: ScreeningSession[] = JSON.parse(localStorage.getItem(SCREENING_DB_KEY) || '[]');
  const existingIndex = list.findIndex(s => s.id === sessionData.id);
  
  if (existingIndex >= 0) {
    if (list[existingIndex].familyId !== familyId) return { success: false, error: 'Authorization error' };
    list[existingIndex] = sessionData;
    logMutation(familyId, session.email, 'Sửa Sàng lọc', `Sửa kết quả AI sàng lọc ngày ${sessionData.date}`);
  } else {
    list = [sessionData, ...list];
    logMutation(familyId, session.email, 'Thêm Sàng lọc', `Thực hiện phiên AI sàng lọc mới ngày ${sessionData.date}`);
  }
  
  localStorage.setItem(SCREENING_DB_KEY, JSON.stringify(list));
  return { success: true };
}

export function deleteScreening(familyId: string, screeningId: string, session: UserSession): { success: boolean; error?: string } {
  let list: ScreeningSession[] = JSON.parse(localStorage.getItem(SCREENING_DB_KEY) || '[]');
  const item = list.find(s => s.id === screeningId);
  if (!item || item.familyId !== familyId) return { success: false, error: 'Not found' };
  
  list = list.filter(s => s.id !== screeningId);
  localStorage.setItem(SCREENING_DB_KEY, JSON.stringify(list));
  
  logMutation(familyId, session.email, 'Xóa Sàng lọc', `Xóa lịch sử phiên AI sàng lọc ngày ${item.date}`);
  return { success: true };
}

// ---------------- SHARING ----------------
export function createSharedRecord(session: UserSession, recordId: string, expiresAt: string, password?: string): SharedRecord {
  const list: SharedRecord[] = JSON.parse(localStorage.getItem(SHARED_DB_KEY) || '[]');
  const newShare: SharedRecord = {
    id: 'share_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
    familyId: session.familyId,
    recordId,
    createdBy: session.email,
    createdAt: new Date().toISOString(),
    expiresAt,
    password: password || ''
  };
  list.push(newShare);
  localStorage.setItem(SHARED_DB_KEY, JSON.stringify(list));
  logMutation(session.familyId, session.email, 'Chia sẻ Hồ sơ', `Tạo liên kết chia sẻ cho hồ sơ khám (hết hạn: ${expiresAt})`);
  return newShare;
}

export function getSharedRecordByToken(token: string): SharedRecord | null {
  const list: SharedRecord[] = JSON.parse(localStorage.getItem(SHARED_DB_KEY) || '[]');
  return list.find(s => s.id === token) || null;
}

export function getSharedRecordsForFamily(familyId: string): SharedRecord[] {
  const list: SharedRecord[] = JSON.parse(localStorage.getItem(SHARED_DB_KEY) || '[]');
  return list.filter(s => s.familyId === familyId);
}

export function deleteSharedRecord(familyId: string, token: string, session: UserSession): { success: boolean; error?: string } {
  let list: SharedRecord[] = JSON.parse(localStorage.getItem(SHARED_DB_KEY) || '[]');
  const index = list.findIndex(s => s.id === token && s.familyId === familyId);
  if (index < 0) return { success: false, error: 'Không tìm thấy liên kết.' };
  
  list.splice(index, 1);
  localStorage.setItem(SHARED_DB_KEY, JSON.stringify(list));
  logMutation(familyId, session.email, 'Xóa Chia sẻ', `Hủy liên kết chia sẻ hồ sơ`);
  return { success: true };
}

export function clearFamilyDemoData(familyId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin') {
    return { success: false, error: 'Chỉ Quản trị viên mới có quyền xoá dữ liệu.' };
  }

  const tables = [
    { key: RECORDS_DB_KEY, name: 'hồ sơ khám bệnh' },
    { key: DOCUMENTS_DB_KEY, name: 'tài liệu' },
    { key: REMINDERS_DB_KEY, name: 'lịch nhắc' },
    { key: METRICS_DB_KEY, name: 'chỉ số sinh tồn' },
    { key: EXPENSES_DB_KEY, name: 'chi phí y tế' },
    { key: LOGS_DB_KEY, name: 'nhật ký' },
    { key: SCREENING_DB_KEY, name: 'sàng lọc AI' }
  ];

  for (const table of tables) {
    const list = JSON.parse(localStorage.getItem(table.key) || '[]');
    const filtered = list.filter((item: any) => item.familyId !== familyId);
    localStorage.setItem(table.key, JSON.stringify(filtered));
  }

  // Members: keep active user's profile and delete rest
  const memList = JSON.parse(localStorage.getItem(MEMBERS_DB_KEY) || '[]');
  const filteredMems = memList.filter((m: any) => m.familyId !== familyId || m.id === session.memberId);
  localStorage.setItem(MEMBERS_DB_KEY, JSON.stringify(filteredMems));

  // Clear prescriptions list
  const preKey = 'family_med_vault_prescriptions_data';
  const preList = JSON.parse(localStorage.getItem(preKey) || '[]');
  const filteredPre = preList.filter((p: any) => p.familyId !== familyId);
  localStorage.setItem(preKey, JSON.stringify(filteredPre));

  logMutation(familyId, session.email, 'Dọn dẹp hệ thống', 'Đã xoá toàn bộ dữ liệu mẫu/dữ liệu ghi nhận của gia đình (chỉ giữ lại hồ sơ cá nhân quản trị viên).');
  
  return { success: true };
}

export function clearLogs(familyId: string, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin') {
    return { success: false, error: 'Chỉ Quản trị viên mới có quyền làm sạch nhật ký.' };
  }
  const list = JSON.parse(localStorage.getItem(LOGS_DB_KEY) || '[]');
  const filtered = list.filter((item: any) => item.familyId !== familyId);
  localStorage.setItem(LOGS_DB_KEY, JSON.stringify(filtered));
  logMutation(familyId, session.email, 'Làm sạch nhật ký', 'Đã xoá toàn bộ lịch sử hệ thống.');
  return { success: true };
}

export function restoreBackupData(familyId: string, backupObj: any, session: UserSession): { success: boolean; error?: string } {
  if (session.role !== 'admin') {
    return { success: false, error: 'Chỉ Quản trị viên mới có quyền phục hồi dữ liệu.' };
  }

  try {
    if (backupObj.familyId && backupObj.familyId !== familyId) {
       return { success: false, error: 'Tệp JSON không thuộc về gia đình của bạn.' };
    }

    const mergeData = (key: string, itemsToMerge: any[] | undefined) => {
      if (!itemsToMerge || !Array.isArray(itemsToMerge)) return;
      // Filter out existing ones for this family
      const currentList = JSON.parse(localStorage.getItem(key) || '[]').filter((item: any) => item.familyId !== familyId);
      // Append the new ones
      localStorage.setItem(key, JSON.stringify([...currentList, ...itemsToMerge]));
    };

    mergeData(MEMBERS_DB_KEY, backupObj.familyMembers);
    mergeData(RECORDS_DB_KEY, backupObj.medicalRecords);
    
    mergeData('family_med_vault_prescriptions_data', backupObj.prescriptions);
    mergeData(REMINDERS_DB_KEY, backupObj.reminders);
    mergeData(METRICS_DB_KEY, backupObj.metrics);
    mergeData(EXPENSES_DB_KEY, backupObj.expenses);
    mergeData(DOCUMENTS_DB_KEY, backupObj.documents);

    logMutation(familyId, session.email, 'Phục hồi dữ liệu', 'Đã phục hồi dữ liệu thành công từ tệp JSON.');
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Lỗi khi đọc tệp dữ liệu: ' + err.message };
  }
}

