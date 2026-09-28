import React, { useState, useMemo, useEffect } from 'react';
import { useKpi } from '../context/KpiContext';
import { DepartmentType, StaffMember, getDepartmentId, TeacherKpiEvaluation } from '../types';
import { ThreeTierKpiEvaluationModal } from './ThreeTierKpiEvaluationModal';
import {
  FlaskConical,
  Calculator,
  BookOpen,
  Landmark,
  Building2,
  Users,
  Award,
  PlusCircle,
  Printer,
  Download,
  Search,
  UserPlus,
  Eye,
  TrendingUp,
  MinusCircle,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  X,
  Phone,
  Mail,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { downloadCsv, getRankBadgeClass } from '../utils/exportUtils';
import * as XLSX from 'xlsx';

export interface DepartmentConfig {
  id: string;
  name: DepartmentType;
  shortName: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  subjects: string;
  description: string;
}

export const DEPARTMENTS_DATA: DepartmentConfig[] = [
  {
    id: 'to-hoa-sinh-cn',
    name: 'Tổ Hóa - Sinh - CN',
    shortName: 'Hóa - Sinh - CN',
    icon: FlaskConical,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    subjects: 'Hóa học, Sinh học, Công nghệ (Nông nghiệp, Công nghiệp)',
    description: 'Quản lý giảng dạy bộ môn Khoa học thực nghiệm & Công nghệ ứng dụng',
  },
  {
    id: 'to-toan-li-tin',
    name: 'Tổ Toán - Lí - Tin',
    shortName: 'Toán - Lí - Tin',
    icon: Calculator,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-800',
    subjects: 'Toán học, Vật lý, Tin học, Quản trị hệ thống máy tính',
    description: 'Bộ môn Khoa học Cơ bản, Tư duy Logic & Chuyển đổi số trường học',
  },
  {
    id: 'to-van-nn',
    name: 'Tổ Văn - Ngoại ngữ',
    shortName: 'Văn - Ngoại ngữ',
    icon: BookOpen,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    subjects: 'Ngữ văn, Tiếng Anh / Ngoại ngữ, Hoạt động trải nghiệm',
    description: 'Phát triển năng lực ngôn ngữ, văn hóa nhân văn & hội nhập quốc tế',
  },
  {
    id: 'to-su-dia',
    name: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
    shortName: 'Sử - Địa - KT&PL - TD - QPAN',
    icon: Landmark,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800',
    subjects: 'Lịch sử, Địa lý, KT&PL (Kinh tế & Pháp luật), Thể dục (GDTC), GDQP-AN',
    description: 'Giáo dục lý luận, truyền thống lịch sử, pháp luật, thể chất & quốc phòng',
  },
  {
    id: 'to-van-phong',
    name: 'Tổ Văn phòng',
    shortName: 'Tổ Văn phòng',
    icon: Building2,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100 text-purple-800',
    subjects: 'Kế toán, Văn thư, Thủ quỹ, Y tế, Thư viện, Thiết bị, Bảo vệ, Phục vụ',
    description: 'Bộ máy tham mưu tài chính, hành chính, quản trị cơ sở vật chất & y tế trường học',
  },
];

interface DepartmentModuleViewProps {
  initialDeptName?: DepartmentType;
}

export const DepartmentModuleView: React.FC<DepartmentModuleViewProps> = ({
  initialDeptName = 'Tổ Hóa - Sinh - CN',
}) => {
  const {
    staffList,
    incidentsList,
    addStaff,
    deleteIncident,
    getAllSummaries,
    schoolYear,
    semester,
    month,
    setActiveTab,
    setSelectedPersonId,
    setIsQuickIncidentOpen,
    openPrintModal,
    currentUser,
    schoolConfig,
    showToast,
  } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  // Active department state
  const [selectedDeptName, setSelectedDeptName] = useState<DepartmentType>(initialDeptName);

  useEffect(() => {
    if (initialDeptName) {
      setSelectedDeptName(initialDeptName);
    }
  }, [initialDeptName]);
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'incidents' | 'chart'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<'all' | 'Xuất sắc' | 'Tốt' | 'Hoàn thành' | 'Cần cố gắng'>('all');

  // Modal to add new member to current department
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('Giáo viên Giảng dạy');
  const [newSubject, setNewSubject] = useState('');
  const [newClassAssigned, setNewClassAssigned] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDegree, setNewDegree] = useState('Đại học');

  // 3-Tier Evaluation Modal State
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [selectedMemberForEval, setSelectedMemberForEval] = useState<StaffMember | null>(null);

  // Current department configuration
  const currentDeptConfig = useMemo(() => {
    return (
      DEPARTMENTS_DATA.find((d) => d.name === selectedDeptName) || DEPARTMENTS_DATA[0]
    );
  }, [selectedDeptName]);

  const DeptIcon = currentDeptConfig.icon;

  // Get all members of the selected department
  const deptMembers = useMemo(() => {
    return staffList.filter((s) => {
      if (s.is_active === false) return false;
      const sDeptId = s.department_id || getDepartmentId(s.department, s.type);
      return sDeptId === currentDeptConfig.id || s.department === selectedDeptName;
    });
  }, [staffList, selectedDeptName, currentDeptConfig.id]);

  // Leaders of the department
  const deptLeaders = useMemo(() => {
    const head = deptMembers.find(
      (m) =>
        m.position.toLowerCase().includes('tổ trưởng') ||
        m.position.toLowerCase().includes('kế toán trưởng')
    );
    const deputy = deptMembers.find(
      (m) =>
        m.position.toLowerCase().includes('tổ phó') ||
        m.position.toLowerCase().includes('phó')
    );
    return { head, deputy };
  }, [deptMembers]);

  // Summaries of this department
  const deptSummaries = useMemo(() => {
    const all = getAllSummaries({ schoolYear, semester });
    return all.filter((s) => {
      const sDeptId = s.person.department_id || getDepartmentId(s.person.department, s.person.type);
      return sDeptId === currentDeptConfig.id || s.person.department === selectedDeptName;
    });
  }, [getAllSummaries, schoolYear, semester, selectedDeptName, currentDeptConfig.id]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return deptSummaries.filter((s) => {
      const matchSearch =
        s.person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.person.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.person.subject && s.person.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.person.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRank = rankFilter === 'all' || s.rank === rankFilter;
      return matchSearch && matchRank;
    });
  }, [deptSummaries, searchQuery, rankFilter]);

  // Incidents in this department
  const deptIncidents = useMemo(() => {
    return incidentsList.filter((inc) => {
      if (inc.schoolYear !== schoolYear) return false;
      const incDeptId = inc.department_id || getDepartmentId(inc.department);
      return incDeptId === currentDeptConfig.id || inc.department === selectedDeptName;
    });
  }, [incidentsList, schoolYear, selectedDeptName, currentDeptConfig.id]);

  // Key KPI Metrics for the Department
  const metrics = useMemo(() => {
    const totalCount = deptMembers.length;
    const avgScore =
      deptSummaries.length > 0
        ? Number(
            (
              deptSummaries.reduce((sum, s) => sum + s.finalScore, 0) /
              deptSummaries.length
            ).toFixed(1)
          )
        : 100;

    const rankCounts = {
      excellent: deptSummaries.filter((s) => s.rank === 'Xuất sắc').length,
      good: deptSummaries.filter((s) => s.rank === 'Tốt').length,
      fair: deptSummaries.filter((s) => s.rank === 'Hoàn thành').length,
      poor: deptSummaries.filter((s) => s.rank === 'Cần cố gắng').length,
    };

    const totalPlus = deptIncidents
      .filter((i) => i.type === 'plus')
      .reduce((sum, i) => sum + i.totalPoints, 0);

    const totalMinus = deptIncidents
      .filter((i) => i.type === 'minus')
      .reduce((sum, i) => sum + i.totalPoints, 0);

    return {
      totalCount,
      avgScore,
      rankCounts,
      totalPlus,
      totalMinus,
    };
  }, [deptMembers, deptSummaries, deptIncidents]);

  // Chart data for comparing members
  const chartData = useMemo(() => {
    return deptSummaries.map((s) => ({
      name: s.person.name.split(' ').slice(-2).join(' '),
      fullName: s.person.name,
      score: s.finalScore,
      plus: s.totalPlus,
      minus: s.totalMinus,
    }));
  }, [deptSummaries]);

  // Export Excel specifically for this department
  const handleExportExcel = () => {
    const exportData = deptSummaries.map((s, idx) => ({
      'STT': idx + 1,
      'Mã cán bộ': s.person.code,
      'Họ và tên': s.person.name,
      'Chức vụ': s.person.position,
      'Bộ môn / Nhiệm vụ': s.person.subject || 'Văn phòng',
      'Lớp phụ trách': s.person.classAssigned || '',
      'Số điện thoại': s.person.phone,
      'Email': s.person.email,
      'Điểm chuẩn': s.baseScore,
      'Điểm thưởng (+)': s.totalPlus,
      'Điểm trừ (-)': s.totalMinus,
      'Điểm KPI Tổng kết': s.finalScore,
      'Xếp loại Thi đua': s.rank,
      'Số vụ ghi nhận': s.incidentsCount,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 25 },
      { wch: 22 },
      { wch: 20 },
      { wch: 14 },
      { wch: 15 },
      { wch: 28 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentDeptConfig.shortName);
    const cleanFileName = `Bang_Diem_KPI_${currentDeptConfig.shortName.replace(/[\s-]/g, '_')}_HK${semester}_${schoolYear.replace(/\s+/g, '')}.xlsx`;
    XLSX.writeFile(wb, cleanFileName);
    showToast(`Đã xuất file Excel cho ${selectedDeptName} thành công!`, 'success');
  };

  // Handle adding new staff member to this department
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Vui lòng nhập họ và tên thành viên!', 'warning');
      return;
    }

    const memberType = selectedDeptName === 'Tổ Văn phòng' ? 'nhanvien' : 'giaovien';
    const autoCode =
      newCode.trim() ||
      `${memberType === 'giaovien' ? 'GV' : 'NV'}${String(staffList.length + 1).padStart(3, '0')}`;

    addStaff({
      code: autoCode,
      name: newName.trim(),
      type: memberType,
      department: selectedDeptName,
      position: newPosition.trim(),
      subject: memberType === 'giaovien' ? newSubject.trim() || undefined : undefined,
      classAssigned: newClassAssigned.trim() || undefined,
      phone: newPhone.trim(),
      email: newEmail.trim() || `${autoCode.toLowerCase()}@thptphuongxa.edu.vn`,
      degree: newDegree,
      status: 'Đang công tác',
      baseScore: 100,
    });

    showToast(`Đã thêm thành viên ${newName.trim()} vào ${selectedDeptName}!`, 'success');
    setIsAddMemberOpen(false);
    // Reset form
    setNewCode('');
    setNewName('');
    setNewPosition(memberType === 'nhanvien' ? 'Nhân viên Văn phòng' : 'Giáo viên Giảng dạy');
    setNewSubject('');
    setNewClassAssigned('');
    setNewPhone('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      {/* 5 DEPARTMENTS SWITCHER TABS (Prominent Top Subnav) */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Chọn Module Tổ Chuyên Môn & Văn Phòng:</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">5 Tổ chuyên môn chính quy</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {DEPARTMENTS_DATA.map((dept) => {
            const Icon = dept.icon;
            const isSelected = dept.name === selectedDeptName;
            const count = staffList.filter((s) => s.department === dept.name).length;

            return (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDeptName(dept.name);
                  setSearchQuery('');
                  setRankFilter('all');
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30'
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/90 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : `${dept.bgLight} ${dept.color}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate leading-tight">{dept.shortName}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {dept.name === 'Tổ Văn phòng' ? 'Nhân viên' : 'Giáo viên'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-white text-blue-700' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DEPARTMENT MAIN BANNER / HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl ${currentDeptConfig.bgLight} ${currentDeptConfig.color} flex items-center justify-center border ${currentDeptConfig.borderColor} shadow-xs shrink-0`}
              >
                <DeptIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentDeptConfig.name}
                  </h1>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${currentDeptConfig.badgeBg}`}
                  >
                    Năm học {schoolYear}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                  {currentDeptConfig.description} •{' '}
                  <span className="font-semibold text-slate-700">Môn phụ trách:</span>{' '}
                  {currentDeptConfig.subjects}
                </p>

                {/* Leadership pills */}
                <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-slate-600">
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tổ trưởng:</span>
                    <strong className="text-slate-800">
                      {deptLeaders.head ? deptLeaders.head.name : 'Đang cập nhật'}
                    </strong>
                  </div>
                  {deptLeaders.deputy && (
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tổ phó:</span>
                      <strong className="text-slate-800">{deptLeaders.deputy.name}</strong>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quân số:</span>
                    <strong className="text-slate-800">{deptMembers.length} thành viên</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {selectedDeptName === 'Tổ Văn phòng' && (
                <button
                  onClick={() => setActiveTab('kpi-nhanvien')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 transition cursor-pointer border border-amber-300"
                  title="Tạo phiếu đánh giá KPI Tổ Văn phòng theo vị trí việc làm"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>+ TẠO PHIẾU ĐÁNH GIÁ KPI</span>
                </button>
              )}

              {isBgh && (
                <button
                  onClick={() => setIsQuickIncidentOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  title="Ghi nhận điểm phát sinh cho thành viên"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nhập KPI</span>
                </button>
              )}

              {isBgh && (
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  title="Thêm thành viên mới vào tổ này"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm nhân sự</span>
                </button>
              )}

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                title="Tải bảng điểm Excel của tổ"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>

              <button
                onClick={() =>
                  openPrintModal(
                    `BÁO CÁO ĐÁNH GIÁ THI ĐUA KPI ${currentDeptConfig.name.toUpperCase()}`,
                    `Năm học: ${schoolYear} • Học kỳ ${semester}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                title="In danh sách & bảng điểm của tổ"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">In báo cáo</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 STATS CARDS OF THIS DEPARTMENT */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 bg-slate-50/50">
          {/* 1. Tổng số thành viên */}
          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Thành viên trong tổ</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentDeptConfig.name === 'Tổ Văn phòng' ? 'Nhân viên hành chính' : 'Giáo viên bộ môn'}
            </div>
          </div>

          {/* 2. KPI Trung bình */}
          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-semibold text-blue-800 flex items-center justify-between">
              <span>KPI Trung bình tổ</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1">{metrics.avgScore}</div>
            <div className="text-[10px] text-blue-500 mt-0.5">
              {metrics.avgScore >= 100 ? 'Đạt chuẩn thi đua (+)' : 'Cần tăng tốc (-)'}
            </div>
          </div>

          {/* 3. Phân loại xếp loại */}
          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Cơ cấu xếp loại</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="Xuất sắc">
                XS: {metrics.rankCounts.excellent}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800" title="Tốt">
                Tốt: {metrics.rankCounts.good}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700" title="Hoàn thành">
                HT: {metrics.rankCounts.fair}
              </span>
              {metrics.rankCounts.poor > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800" title="Cần cố gắng">
                  CCG: {metrics.rankCounts.poor}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Đánh giá theo chuẩn học kỳ {semester}</div>
          </div>

          {/* 4. Tổng điểm thưởng / phạt */}
          <div className="p-4 sm:p-5">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Phát sinh điểm</span>
              <PlusCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mt-1 font-bold text-sm">
              <span className="text-emerald-600">+{metrics.totalPlus} đ thưởng</span>
              <span className="text-rose-600">-{metrics.totalMinus} đ phạt</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{deptIncidents.length} lượt sự vụ ghi nhận</div>
          </div>
        </div>
      </div>

      {/* SUB-TABS: DANH SÁCH THÀNH VIÊN / NHẬT KÝ SỰ VỤ / BIỂU ĐỒ NỘI BỘ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Sub-tab buttons header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('members')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeSubTab === 'members'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách Cán bộ - Giáo viên ({deptMembers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('incidents')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeSubTab === 'incidents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Nhật ký Điểm phát sinh ({deptIncidents.length})
            </button>
            <button
              onClick={() => setActiveSubTab('chart')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeSubTab === 'chart'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Biểu đồ & Xếp hạng nội bộ
            </button>
          </div>

          {/* Search & Rank filter (active when on members tab) */}
          {activeSubTab === 'members' && (
            <div className="flex items-center gap-2 pb-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm thành viên trong tổ..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-blue-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value as any)}
                className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="all">Tất cả xếp loại</option>
                <option value="Xuất sắc">Xuất sắc</option>
                <option value="Tốt">Tốt</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Cần cố gắng">Cần cố gắng</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: MEMBERS TABLE */}
        {activeSubTab === 'members' && (
          <div className="overflow-x-auto">
            {filteredSummaries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600">Không tìm thấy thành viên phù hợp trong {selectedDeptName}</p>
                <p className="mt-1">Thử thay đổi từ khóa tìm kiếm hoặc nhấn &quot;Thêm nhân sự&quot; để bổ sung.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">STT</th>
                    <th className="py-3 px-3">Mã số</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3">Chức vụ / Nhiệm vụ</th>
                    <th className="py-3 px-3">Môn giảng dạy</th>
                    <th className="py-3 px-3">Lớp chủ nhiệm</th>
                    <th className="py-3 px-3 text-center">Gốc</th>
                    <th className="py-3 px-3 text-center text-emerald-600">Điểm (+)</th>
                    <th className="py-3 px-3 text-center text-rose-600">Điểm (-)</th>
                    <th className="py-3 px-3 text-center font-extrabold text-blue-700">Tổng điểm</th>
                    <th className="py-3 px-3 text-center">Xếp loại</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.map((s, idx) => {
                    const m = s.person;
                    const rankClass = getRankBadgeClass(s.rank);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{m.code}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {m.position.toLowerCase().includes('tổ trưởng') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                Tổ trưởng
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            {m.phone && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {m.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{m.position}</td>
                        <td className="py-3 px-3 text-slate-600">{m.subject || '—'}</td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{m.classAssigned || '—'}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{s.baseScore}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">
                          {s.totalPlus > 0 ? `+${s.totalPlus}` : '0'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600">
                          {s.totalMinus > 0 ? `-${s.totalMinus}` : '0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-black text-blue-700">{s.finalScore}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${rankClass}`}>
                            {s.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isBgh && (
                              <button
                                onClick={() => {
                                  setSelectedPersonId(m.id);
                                  setIsQuickIncidentOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition cursor-pointer"
                                title="Nhập điểm phát sinh KPI cho thầy/cô"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedMemberForEval(m);
                                setIsEvalModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                              title="Mở phiếu đánh giá 3 cấp cho thành viên này"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Đánh giá</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: INCIDENTS LOG TABLE */}
        {activeSubTab === 'incidents' && (
          <div className="overflow-x-auto">
            {deptIncidents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Award className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600">Chưa có phát sinh điểm KPI nào trong {selectedDeptName}</p>
                <p className="mt-1">Nhấn &quot;Nhập KPI&quot; phía trên để ghi nhận điểm thưởng hoặc nhắc nhở kỷ luật.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">STT</th>
                    <th className="py-3 px-3">Ngày</th>
                    <th className="py-3 px-3">Người ghi nhận</th>
                    <th className="py-3 px-3">Nội dung tiêu chí KPI</th>
                    <th className="py-3 px-3 text-center">Loại</th>
                    <th className="py-3 px-3 text-center">Điểm</th>
                    <th className="py-3 px-3">Minh chứng / Ghi chú</th>
                    <th className="py-3 px-3">Người duyệt</th>
                    {isBgh && <th className="py-3 px-3 text-right">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptIncidents.map((inc, idx) => (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{inc.date}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{inc.personName}</td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 leading-snug">{inc.criterionName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Mã: {inc.criterionCode}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.type === 'plus'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inc.type === 'plus' ? 'Cộng thưởng' : 'Trừ vi phạm'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-black">
                        <span className={inc.type === 'plus' ? 'text-emerald-600' : 'text-rose-600'}>
                          {inc.type === 'plus' ? `+${inc.totalPoints}` : `-${inc.totalPoints}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs">
                        <div>{inc.notes || '—'}</div>
                        {inc.evidenceRef && (
                          <div className="text-[10px] text-blue-600 italic mt-0.5 truncate">
                            MC: {inc.evidenceRef}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{inc.createdBy}</td>
                      {isBgh && (
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa bản ghi điểm "${inc.criterionName}" của ${inc.personName}?`)) {
                                deleteIncident(inc.id);
                                showToast('Đã xóa bản ghi phát sinh!', 'info');
                              }
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: INTERNAL COMPARISON BAR CHART */}
        {activeSubTab === 'chart' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>So Sánh Điểm Thi Đua Nội Bộ: {selectedDeptName}</span>
                </h4>
                <p className="text-[11px] text-slate-500">Mức điểm chuẩn thi đua khởi điểm là 100 điểm</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Học kỳ {semester} - Năm học {schoolYear}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis domain={[80, 130]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} điểm`,
                      name === 'score' ? 'Điểm KPI Tổng' : name,
                    ]}
                    labelFormatter={(label) => `Thầy/Cô: ${label}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" label="Chuẩn: 100" />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD MEMBER TO THIS DEPARTMENT */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${currentDeptConfig.bgLight} ${currentDeptConfig.color} flex items-center justify-center`}>
                  <DeptIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Thêm Cán Bộ / Giáo Viên Vào Tổ</h3>
                  <p className="text-[11px] text-slate-400">{selectedDeptName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã cán bộ:</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Để trống để tự tạo (GV...)"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên (*):</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nguyễn Văn A..."
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chức vụ trong tổ:</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="Tổ trưởng, Giáo viên..."
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trình độ chuyên môn:</label>
                  <select
                    value={newDegree}
                    onChange={(e) => setNewDegree(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Đại học">Đại học</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Cao đẳng">Cao đẳng</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                  </select>
                </div>
              </div>

              {selectedDeptName !== 'Tổ Văn phòng' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Môn giảng dạy chính:</label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Toán, Lý, Hóa, Văn..."
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lớp chủ nhiệm (nếu có):</label>
                    <input
                      type="text"
                      value={newClassAssigned}
                      onChange={(e) => setNewClassAssigned(e.target.value)}
                      placeholder="12A1, 10B2..."
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0987.xxx.xxx"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="...@thptphuongxa.edu.vn"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  Thêm vào tổ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 3-Tier Evaluation Modal */}
      {isEvalModalOpen && selectedMemberForEval && (
        <ThreeTierKpiEvaluationModal
          isOpen={isEvalModalOpen}
          onClose={() => {
            setIsEvalModalOpen(false);
            setSelectedMemberForEval(null);
          }}
          initialStaffId={selectedMemberForEval.id}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
