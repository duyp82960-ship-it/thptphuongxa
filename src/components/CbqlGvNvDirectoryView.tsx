import React, { useState, useMemo, useRef } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  StaffMember,
  PersonType,
  DepartmentType,
  CANONICAL_DEPARTMENTS,
  ALL_SCHOOL_DEPARTMENTS_WITH_BGH,
  getDepartmentId,
  getDepartmentDisplayName,
} from '../types';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Printer,
  Upload,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  ChevronRight,
  X,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Building2,
  FlaskConical,
  Calculator,
  BookOpen,
  Landmark,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { downloadCsv, getRankBadgeClass, downloadStaffTemplateExcel } from '../utils/exportUtils';
import { isCbqlStaff } from '../utils/cbqlUtils';
import { ExcelImportModal } from './ExcelImportModal';
import { ClearStaffModal } from './ClearStaffModal';

interface DeptTabItem {
  id: string; // e.g. 'all', 'to-hoa-sinh-cn', 'to-toan-li-tin', 'to-van-nn', 'to-su-dia', 'to-van-phong', 'ban-giam-hieu'
  name: string;
  shortName: string;
  type: 'ALL' | 'BAN_GIAM_HIEU' | 'CHUYEN_MON' | 'VAN_PHONG';
  icon: React.ElementType;
  color: string;
  bgLight: string;
  borderColor: string;
}

const DEPARTMENT_TABS: DeptTabItem[] = [
  {
    id: 'all',
    name: 'Tất cả CBGVNV',
    shortName: 'Tất cả',
    type: 'ALL',
    icon: Users,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'to-hoa-sinh-cn',
    name: 'Tổ Hóa - Sinh - CN',
    shortName: 'Tổ Hóa - Sinh - CN',
    type: 'CHUYEN_MON',
    icon: FlaskConical,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'to-toan-li-tin',
    name: 'Tổ Toán - Lí - Tin',
    shortName: 'Tổ Toán - Lí - Tin',
    type: 'CHUYEN_MON',
    icon: Calculator,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'to-van-nn',
    name: 'Tổ Văn - Ngoại ngữ',
    shortName: 'Tổ Văn - Ngoại ngữ',
    type: 'CHUYEN_MON',
    icon: BookOpen,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'to-su-dia',
    name: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
    shortName: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
    type: 'CHUYEN_MON',
    icon: Landmark,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'to-van-phong',
    name: 'Tổ Văn phòng',
    shortName: 'Tổ Văn phòng',
    type: 'VAN_PHONG',
    icon: Building2,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'ban-giam-hieu',
    name: 'Ban Giám hiệu',
    shortName: 'Ban Giám hiệu',
    type: 'BAN_GIAM_HIEU',
    icon: ShieldCheck,
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
];

export const CbqlGvNvDirectoryView: React.FC = () => {
  const {
    staffList,
    addStaff,
    updateStaff,
    deleteStaff,
    getPersonKpiSummary,
    schoolYear,
    semester,
    month,
    setActiveTab,
    setSelectedPersonId,
    openPrintModal,
    schoolConfig,
    currentUser,
    showToast,
    restoreInitialStaff,
  } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  // Primary Selection: Selected Department ID
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

  // Secondary Filters & View State
  const [selectedTypeTab, setSelectedTypeTab] = useState<'all' | 'bgh' | 'giaovien' | 'nhanvien'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRank, setSelectedRank] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'kpi' | 'dept'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formType, setFormType] = useState<PersonType>('giaovien');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState<DepartmentType | string>('Tổ Toán - Lí - Tin');
  const [formPosition, setFormPosition] = useState('Giáo viên Giảng dạy');
  const [formSubject, setFormSubject] = useState('');
  const [formClassAssigned, setFormClassAssigned] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'Đang công tác' | 'Nghỉ chế độ' | 'Tạm hoãn'>('Đang công tác');
  const [formBaseScore, setFormBaseScore] = useState(100);
  const [formDegree, setFormDegree] = useState('Đại học');
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ'>('Nữ');

  // Dynamic Department Personnel Counts (Strictly computed from actual active staff in staffList)
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      'to-hoa-sinh-cn': 0,
      'to-toan-li-tin': 0,
      'to-van-nn': 0,
      'to-su-dia': 0,
      'to-van-phong': 0,
      'ban-giam-hieu': 0,
    };

    staffList.forEach((s) => {
      const deptId = getDepartmentId(s.departmentId || s.department_id || s.department, s.type);
      counts.all = (counts.all || 0) + 1;
      counts[deptId] = (counts[deptId] || 0) + 1;
    });

    return counts;
  }, [staffList]);

  // Overall Personnel Counts
  const bghCount = useMemo(() => staffList.filter((s) => isCbqlStaff(s)).length, [staffList]);
  const gvCount = useMemo(() => staffList.filter((s) => s.type === 'giaovien').length, [staffList]);
  const nvCount = useMemo(
    () =>
      staffList.filter(
        (s) =>
          s.type === 'nhanvien' ||
          getDepartmentId(s.departmentId || s.department_id || s.department, s.type) === 'to-van-phong'
      ).length,
    [staffList]
  );
  const totalCount = staffList.length;

  // Filtered and Sorted Staff List (Core requirement: filter by department_id relationship)
  const processedList = useMemo(() => {
    let list = staffList.map((member) => {
      const summary = getPersonKpiSummary(member.id, { schoolYear, semester, month });
      const deptId = getDepartmentId(member.departmentId || member.department_id || member.department, member.type);
      return {
        member,
        deptId,
        summary: summary || {
          person: member,
          baseScore: member.baseScore,
          totalPlus: 0,
          totalMinus: 0,
          finalScore: member.baseScore,
          rank: 'Tốt' as const,
          incidentsCount: 0,
        },
      };
    });

    // 1. Primary Filter by Selected Department ID (Exact relation filter, no string guessing)
    if (selectedDeptId !== 'all') {
      list = list.filter((item) => item.deptId === selectedDeptId);
    }

    // 2. Secondary Filter by Personnel Category Tab (CBQL, GV, NV)
    if (selectedTypeTab !== 'all') {
      if (selectedTypeTab === 'bgh') {
        list = list.filter((item) => isCbqlStaff(item.member));
      } else if (selectedTypeTab === 'nhanvien') {
        list = list.filter(
          (item) => item.member.type === 'nhanvien' || item.deptId === 'to-van-phong'
        );
      } else {
        list = list.filter((item) => item.member.type === 'giaovien');
      }
    }

    // 3. Filter by Working Status
    if (selectedStatus !== 'all') {
      list = list.filter((item) => item.member.status === selectedStatus);
    }

    // 4. Filter by KPI Rank
    if (selectedRank !== 'all') {
      list = list.filter((item) => item.summary.rank === selectedRank);
    }

    // 5. Search Query (Combines seamlessly with department filter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        ({ member }) =>
          member.name.toLowerCase().includes(q) ||
          member.code.toLowerCase().includes(q) ||
          member.email.toLowerCase().includes(q) ||
          member.phone.includes(q) ||
          (member.subject && member.subject.toLowerCase().includes(q)) ||
          (member.classAssigned && member.classAssigned.toLowerCase().includes(q)) ||
          member.position.toLowerCase().includes(q)
      );
    }

    // 6. Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'code') {
        comparison = a.member.code.localeCompare(b.member.code);
      } else if (sortBy === 'name') {
        const getLastName = (fullName: string) => {
          const parts = fullName.trim().split(/\s+/);
          return parts[parts.length - 1] || fullName;
        };
        comparison = getLastName(a.member.name).localeCompare(getLastName(b.member.name), 'vi');
      } else if (sortBy === 'kpi') {
        comparison = b.summary.finalScore - a.summary.finalScore;
      } else if (sortBy === 'dept') {
        comparison = (a.member.department || '').localeCompare(b.member.department || '', 'vi');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [
    staffList,
    selectedDeptId,
    selectedTypeTab,
    selectedStatus,
    selectedRank,
    searchQuery,
    sortBy,
    sortOrder,
    getPersonKpiSummary,
    schoolYear,
    semester,
    month,
  ]);

  // Handle open Add modal
  const handleOpenAdd = () => {
    setEditingStaff(null);
    let targetType: PersonType = selectedTypeTab === 'all' ? 'giaovien' : selectedTypeTab;
    let defaultDept: DepartmentType | string = 'Tổ Toán - Lí - Tin';
    let defaultPosition = 'Giáo viên Giảng dạy';

    if (selectedDeptId === 'to-van-phong') {
      targetType = 'nhanvien';
      defaultDept = 'Tổ Văn phòng';
      defaultPosition = 'Nhân viên Văn phòng';
    } else if (selectedDeptId === 'ban-giam-hieu') {
      targetType = 'bgh';
      defaultDept = 'Ban Giám hiệu';
      defaultPosition = 'Phó Hiệu trưởng';
    } else if (selectedDeptId === 'to-hoa-sinh-cn') {
      defaultDept = 'Tổ Hóa - Sinh - CN';
    } else if (selectedDeptId === 'to-toan-li-tin') {
      defaultDept = 'Tổ Toán - Lí - Tin';
    } else if (selectedDeptId === 'to-van-nn') {
      defaultDept = 'Tổ Văn - Ngoại ngữ';
    } else if (selectedDeptId === 'to-su-dia') {
      defaultDept = 'Tổ Sử - Địa - KT&PL - TD - AN';
    }

    setFormType(targetType);
    const existingCodes = staffList.filter((s) => s.type === targetType).map((s) => s.code);
    const prefix = targetType === 'bgh' ? 'BGH' : targetType === 'giaovien' ? 'GV' : 'NV';
    const nextNum = existingCodes.length + 1;
    const formattedCode = `${prefix}${String(nextNum).padStart(3, '0')}`;

    setFormCode(formattedCode);
    setFormName('');
    setFormDept(defaultDept);
    setFormPosition(defaultPosition);
    setFormSubject(targetType === 'giaovien' ? 'Toán học' : '');
    setFormClassAssigned('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('Đang công tác');
    setFormBaseScore(100);
    setFormDegree(targetType === 'bgh' ? 'Thạc sĩ' : 'Đại học');
    setFormGender('Nữ');
    setIsFormModalOpen(true);
  };

  // Handle open Edit modal
  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormType(staff.type);
    setFormCode(staff.code);
    setFormName(staff.name);
    setFormDept(staff.department);
    setFormPosition(staff.position);
    setFormSubject(staff.subject || '');
    setFormClassAssigned(staff.classAssigned || '');
    setFormPhone(staff.phone);
    setFormEmail(staff.email);
    setFormStatus(staff.status);
    setFormBaseScore(staff.baseScore);
    setFormDegree(staff.degree || 'Đại học');
    setFormGender(staff.gender || 'Nữ');
    setIsFormModalOpen(true);
  };

  // Save Form (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      showToast('Vui lòng điền mã số và họ tên nhân sự!', 'warning');
      return;
    }

    const emailToUse =
      formEmail.trim() ||
      `${formCode.toLowerCase()}@thptphuongxa.edu.vn`;

    const deptId = getDepartmentId(formDept, formType);
    const employeeType = formType === 'bgh' ? 'BGH' : formType === 'nhanvien' ? 'NHAN_VIEN' : 'GIAO_VIEN';

    if (editingStaff) {
      updateStaff({
        ...editingStaff,
        code: formCode.trim(),
        name: formName.trim(),
        type: formType,
        employee_type: employeeType,
        department: formDept,
        departmentId: deptId,
        department_id: deptId,
        position: formPosition.trim(),
        subject: formType === 'giaovien' ? formSubject.trim() : undefined,
        classAssigned: formType === 'giaovien' ? formClassAssigned.trim() : undefined,
        phone: formPhone.trim(),
        email: emailToUse,
        status: formStatus,
        is_active: formStatus === 'Đang công tác',
        baseScore: formBaseScore,
        degree: formDegree,
        gender: formGender,
      });
      showToast(`Đã cập nhật hồ sơ cán bộ: ${formName}`, 'success');
    } else {
      addStaff({
        code: formCode.trim(),
        name: formName.trim(),
        type: formType,
        employee_type: employeeType,
        department: formDept,
        departmentId: deptId,
        department_id: deptId,
        position: formPosition.trim(),
        subject: formType === 'giaovien' ? formSubject.trim() : undefined,
        classAssigned: formType === 'giaovien' ? formClassAssigned.trim() : undefined,
        phone: formPhone.trim(),
        email: emailToUse,
        status: formStatus,
        is_active: formStatus === 'Đang công tác',
        baseScore: formBaseScore,
        degree: formDegree,
        gender: formGender,
      });
      showToast(`Đã thêm mới thành công cán bộ: ${formName}`, 'success');
    }

    setIsFormModalOpen(false);
  };

  // Delete Staff
  const confirmDelete = () => {
    if (!deletingId) return;
    const staff = staffList.find((s) => s.id === deletingId);
    const success = deleteStaff(deletingId);
    if (success) {
      showToast(`Đã xóa cán bộ ${staff?.name || ''} khỏi hệ thống`, 'success');
    }
    setDeletingId(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Mã Định Danh',
      'Họ và Tên',
      'Phân Loại',
      'Tổ / Phòng Ban',
      'Chức Vụ',
      'Trình Độ',
      'Môn Giảng Dạy',
      'Lớp Phụ Trách',
      'Số Điện Thoại',
      'Email Công Vụ',
      'Trạng Thái',
      'Điểm KPI',
      'Xếp Loại KPI',
    ];

    const rows = processedList.map(({ member, summary }, index) => [
      index + 1,
      member.code,
      member.name,
      member.type === 'bgh' ? 'CBQL' : member.type === 'giaovien' ? 'Giáo viên' : 'Nhân viên',
      member.department,
      member.position,
      member.degree || 'Đại học',
      member.subject || '-',
      member.classAssigned || '-',
      member.phone,
      member.email,
      member.status,
      summary.finalScore,
      summary.rank,
    ]);

    const filename = `Danh_sach_CBQL_GV_NV_THPT_Phuong_Xa_${schoolYear.replace(/\s+/g, '')}`;
    downloadCsv(filename, headers, rows);
    showToast('Đã xuất danh sách CBQLGVNV thành công!', 'success');
  };

  // Print List
  const handlePrint = () => {
    const currentDeptName =
      selectedDeptId === 'all'
        ? 'TOÀN TRƯỜNG'
        : DEPARTMENT_TABS.find((d) => d.id === selectedDeptId)?.name || 'TỔ CHUYÊN MÔN';
    const subtitle = `${schoolConfig.normalName} – ${currentDeptName} – Năm học ${schoolYear} (Tổng hợp ${processedList.length} nhân sự)`;
    openPrintModal('DANH SÁCH CÁN BỘ QUẢN LÝ, GIÁO VIÊN VÀ NHÂN VIÊN', subtitle);
  };

  // Quick navigate to KPI evaluation sheet
  const handleViewKpiPersonal = (personId: string) => {
    setSelectedPersonId(personId);
    const staff = staffList.find((s) => s.id === personId);
    setActiveTab(staff?.type === 'nhanvien' ? 'kpi-nhanvien' : 'kpi-evaluation');
  };

  // Render badge helper
  const renderTypeBadge = (type: PersonType) => {
    switch (type) {
      case 'bgh':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <ShieldCheck className="w-3 h-3 text-amber-700" />
            CBQL
          </span>
        );
      case 'giaovien':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <GraduationCap className="w-3 h-3 text-blue-700" />
            Giáo viên
          </span>
        );
      case 'nhanvien':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Briefcase className="w-3 h-3 text-purple-700" />
            Nhân viên
          </span>
        );
    }
  };

  const currentActiveTabInfo = DEPARTMENT_TABS.find((d) => d.id === selectedDeptId) || DEPARTMENT_TABS[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {schoolConfig.shortName}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Năm học {schoolYear} – Học kỳ {semester === 1 ? 'I' : 'II'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-0.5">
              DANH SÁCH CBGV – GV – NV
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý hồ sơ cán bộ, tổ chuyên môn và kết quả đánh giá KPI trực tuyến
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Xuất toàn bộ danh sách trích ngang ra file Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="In bảng danh sách trích ngang theo thể thức hành chính"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In danh sách</span>
          </button>

          {isBgh && (
            <>
              <button
                onClick={() => {
                  downloadStaffTemplateExcel(schoolConfig.shortName);
                  showToast('Đã tải xuống file Excel mẫu 6 cột chuẩn!', 'success');
                }}
                id="btn-download-sample-template"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Tải về file Excel mẫu chuẩn 6 cột theo quy định"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Tải mẫu Excel</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                id="btn-import-excel"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Nhập danh sách Cán bộ Quản lý, Giáo viên, Nhân viên từ file Excel (.xlsx, .csv)"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Nhập từ Excel</span>
              </button>

              <button
                onClick={() => setIsClearModalOpen(true)}
                id="btn-clear-all-staff"
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Xóa toàn bộ danh sách cán bộ, giáo viên và nhân viên khỏi hệ thống"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa toàn bộ</span>
              </button>

              <button
                onClick={handleOpenAdd}
                id="btn-add-cbqlgvnv"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm mới nhân sự</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. CHỌN TỔ CHUYÊN MÔN / TỔ VĂN PHÒNG (CORE DEPARTMENT SWITCHER) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Chọn Tổ Chuyên Môn / Tổ Văn Phòng:</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Đang chọn:{' '}
            <strong className="text-blue-700">{currentActiveTabInfo.name}</strong> •{' '}
            <span>{departmentCounts[selectedDeptId] ?? processedList.length} nhân sự</span>
          </div>
        </div>

        {/* Dynamic Department Tabs with Active Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {DEPARTMENT_TABS.map((dept) => {
            const Icon = dept.icon;
            const isSelected = dept.id === selectedDeptId;
            const count = departmentCounts[dept.id] ?? 0;

            return (
              <button
                key={dept.id}
                id={`dept-tab-${dept.id}`}
                onClick={() => {
                  setSelectedDeptId(dept.id);
                  setSelectedTypeTab('all');
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedRank('all');
                }}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30'
                    : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : `${dept.bgLight} ${dept.color}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-[12px] font-bold truncate leading-tight">{dept.shortName}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {dept.type === 'VAN_PHONG'
                        ? 'Nhân viên'
                        : dept.type === 'BAN_GIAM_HIEU'
                        ? 'BGH'
                        : dept.type === 'ALL'
                        ? 'Toàn trường'
                        : 'Giáo viên'}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
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

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Category Tabs & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSelectedTypeTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTypeTab === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tất cả loại ({totalCount})</span>
            </button>

            <button
              onClick={() => setSelectedTypeTab('bgh')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTypeTab === 'bgh'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>CBQL ({bghCount})</span>
            </button>

            <button
              onClick={() => setSelectedTypeTab('giaovien')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTypeTab === 'giaovien'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Giáo viên ({gvCount})</span>
            </button>

            <button
              onClick={() => setSelectedTypeTab('nhanvien')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTypeTab === 'nhanvien'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-600" />
              <span>Nhân viên ({nvCount})</span>
            </button>
          </div>

          {/* Table / Card View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500'
              }`}
              title="Xem dạng Bảng chi tiết"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Dạng Bảng</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'card' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500'
              }`}
              title="Xem dạng Thẻ hồ sơ"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dạng Thẻ</span>
            </button>
          </div>
        </div>

        {/* Search & Detailed Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          {/* Search Box */}
          <div className="sm:col-span-2 lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm trong ${selectedDeptId === 'all' ? 'toàn trường' : currentActiveTabInfo.shortName} theo tên, mã, môn, SĐT...`}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Select */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đang công tác">Đang công tác</option>
              <option value="Nghỉ chế độ">Nghỉ chế độ</option>
              <option value="Tạm hoãn">Tạm hoãn</option>
            </select>
          </div>

          {/* Rank Select */}
          <div className="lg:col-span-2">
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="all">Tất cả xếp loại KPI</option>
              <option value="Xuất sắc">Xuất sắc (≥110)</option>
              <option value="Tốt">Tốt (95-109)</option>
              <option value="Hoàn thành">Hoàn thành (80-94)</option>
              <option value="Cần cố gắng">Cần cố gắng (&lt;80)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2 flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              title="Sắp xếp theo"
            >
              <option value="code">Mã CB</option>
              <option value="name">Tên</option>
              <option value="kpi">KPI</option>
              <option value="dept">Tổ</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title={sortOrder === 'asc' ? 'Thứ tự tăng dần' : 'Thứ tự giảm dần'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={() => {
                setSelectedDeptId('all');
                setSelectedTypeTab('all');
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedRank('all');
              }}
              className="w-full p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center gap-1 transition cursor-pointer border border-slate-200"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Table or Card Grid */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 text-center w-12">STT</th>
                  <th className="p-3.5">Mã & Họ tên</th>
                  <th className="p-3.5">Phân loại</th>
                  <th className="p-3.5">Chức vụ</th>
                  <th className="p-3.5">Tổ / Bộ phận</th>
                  <th className="p-3.5">Môn / Lớp</th>
                  <th className="p-3.5">Liên hệ</th>
                  <th className="p-3.5 text-center">Trạng thái</th>
                  <th className="p-3.5 text-center">Điểm KPI</th>
                  <th className="p-3.5 text-center">Xếp loại</th>
                  <th className="p-3.5 text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processedList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      {staffList.length === 0 ? (
                        <div className="space-y-3">
                          <p className="font-bold text-slate-700 text-sm">Danh sách nhân sự hiện đang trống</p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Bạn có thể nhập danh sách cán bộ giáo viên từ file Excel (.xlsx, .csv) hoặc khôi phục dữ liệu mẫu ban đầu.
                          </p>
                          {isBgh && (
                            <div className="flex items-center justify-center gap-2 pt-2">
                              <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Nhập từ file Excel</span>
                              </button>
                              <button
                                onClick={restoreInitialStaff}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                              >
                                Khôi phục dữ liệu mẫu
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-600">
                            Không tìm thấy cán bộ, giáo viên, nhân viên phù hợp trong {currentActiveTabInfo.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tất cả CBGVNV&quot;
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  processedList.map(({ member, summary }, idx) => {
                    const avatarLetter =
                      member.name.trim().charAt(member.name.trim().lastIndexOf(' ') + 1) || member.name.charAt(0);
                    return (
                      <tr key={member.id} className="hover:bg-blue-50/40 transition">
                        {/* STT */}
                        <td className="p-3.5 text-center font-medium text-slate-400">{idx + 1}</td>

                        {/* Code & Name */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                member.type === 'bgh'
                                  ? 'bg-amber-100 text-amber-800'
                                  : member.type === 'giaovien'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {avatarLetter}
                            </div>
                            <div>
                              <button
                                onClick={() => setViewingStaff(member)}
                                className="font-bold text-slate-900 hover:text-blue-600 transition text-left cursor-pointer"
                              >
                                {member.name}
                              </button>
                              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                                <span>{member.code}</span>
                                {member.degree && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                    {member.degree}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="p-3.5">{renderTypeBadge(member.type)}</td>

                        {/* Position */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{member.position}</div>
                          {member.concurrentPosition && (
                            <div className="text-[11px] text-slate-400 italic">
                              Kiêm: {member.concurrentPosition}
                            </div>
                          )}
                        </td>

                        {/* Department */}
                        <td className="p-3.5 font-medium text-slate-800">{member.department}</td>

                        {/* Subject & Class */}
                        <td className="p-3.5">
                          {member.subject ? (
                            <div>
                              <span className="font-medium text-slate-700">{member.subject}</span>
                              {member.classAssigned && (
                                <span className="ml-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  CN {member.classAssigned}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="p-3.5">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <a href={`tel:${member.phone}`} className="hover:text-blue-600">
                                {member.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]" title={member.email}>
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              member.status === 'Đang công tác' ? 'text-emerald-700' : 'text-amber-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.status === 'Đang công tác' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {member.status}
                          </span>
                        </td>

                        {/* KPI Score */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`font-black text-sm px-2 py-0.5 rounded ${
                              summary.finalScore >= 110
                                ? 'text-emerald-700 bg-emerald-50'
                                : summary.finalScore >= 95
                                ? 'text-blue-700 bg-blue-50'
                                : summary.finalScore >= 80
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {summary.finalScore}
                          </span>
                        </td>

                        {/* Rank */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${getRankBadgeClass(summary.rank)}`}>
                            {summary.rank}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Profile View */}
                            <button
                              onClick={() => setViewingStaff(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Xem hồ sơ chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* View KPI Sheet */}
                            <button
                              onClick={() => handleViewKpiPersonal(member.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Xem chi tiết bảng điểm KPI"
                            >
                              <Award className="w-4 h-4" />
                            </button>

                            {/* Edit (BGH only) */}
                            {isBgh && (
                              <button
                                onClick={() => handleOpenEdit(member)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete (BGH only) */}
                            {isBgh && (
                              <button
                                onClick={() => setDeletingId(member.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Xóa cán bộ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              Đang hiển thị <strong className="text-slate-800">{processedList.length}</strong> / {totalCount} nhân sự
              {selectedDeptId !== 'all' && (
                <span className="ml-1 text-blue-700 font-bold">({currentActiveTabInfo.name})</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {schoolConfig.fullName} • Đồng bộ dữ liệu theo quan hệ Tổ/Bộ phận (department_id)
            </div>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {processedList.map(({ member, summary }) => {
            const avatarLetter =
              member.name.trim().charAt(member.name.trim().lastIndexOf(' ') + 1) || member.name.charAt(0);
            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4">
                  {/* Top Row: Type & Status */}
                  <div className="flex items-center justify-between mb-3">
                    {renderTypeBadge(member.type)}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        member.status === 'Đang công tác' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Đang công tác' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {member.status}
                    </span>
                  </div>

                  {/* Header info with Avatar */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        member.type === 'bgh'
                          ? 'bg-amber-100 text-amber-800'
                          : member.type === 'giaovien'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {avatarLetter}
                    </div>
                    <div className="overflow-hidden">
                      <h3
                        onClick={() => setViewingStaff(member)}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition truncate cursor-pointer"
                        title={member.name}
                      >
                        {member.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 truncate">{member.position}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{member.code}</div>
                    </div>
                  </div>

                  {/* Department & Subject */}
                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Đơn vị:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px]" title={member.department}>
                        {member.department}
                      </span>
                    </div>
                    {member.subject && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Bộ môn:</span>
                        <span className="font-semibold text-blue-700">
                          {member.subject} {member.classAssigned && `(CN ${member.classAssigned})`}
                        </span>
                      </div>
                    )}
                    {member.degree && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Trình độ:</span>
                        <span className="font-medium text-slate-600">{member.degree}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="text-[11px] text-slate-500 space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <a href={`tel:${member.phone}`} className="hover:text-blue-600">
                        {member.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 truncate" title={member.email}>
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>

                  {/* KPI Progress Bento */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Điểm KPI</div>
                      <div className="text-lg font-black text-slate-800">{summary.finalScore}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getRankBadgeClass(summary.rank)}`}>
                        {summary.rank}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewingStaff(member)}
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Hồ sơ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewKpiPersonal(member.id)}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                      title="Xem bảng điểm KPI"
                    >
                      <Award className="w-3.5 h-3.5" />
                    </button>
                    {isBgh && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                          title="Sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(member.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: PROFILE DETAILS */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-lg border border-white/20">
                  {viewingStaff.name.trim().charAt(viewingStaff.name.trim().lastIndexOf(' ') + 1) || viewingStaff.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">{viewingStaff.name}</h3>
                    {renderTypeBadge(viewingStaff.type)}
                  </div>
                  <p className="text-xs text-blue-200">
                    Mã số: <span className="font-mono text-white font-semibold">{viewingStaff.code}</span> • {viewingStaff.position}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingStaff(null)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Personnel Basic Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Đơn vị / Tổ:</span>
                  <span className="font-bold text-slate-800">{viewingStaff.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Chức vụ chính:</span>
                  <span className="font-bold text-slate-800">{viewingStaff.position}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái công tác:</span>
                  <span className="font-semibold text-emerald-700">{viewingStaff.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                  <span className="font-bold text-slate-800">{viewingStaff.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email công vụ:</span>
                  <span className="font-bold text-slate-800 truncate block">{viewingStaff.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trình độ đào tạo:</span>
                  <span className="font-bold text-slate-800">{viewingStaff.degree || 'Đại học Sư phạm'}</span>
                </div>
                {viewingStaff.subject && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Môn giảng dạy:</span>
                    <span className="font-bold text-blue-700">{viewingStaff.subject}</span>
                  </div>
                )}
                {viewingStaff.classAssigned && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Chủ nhiệm lớp:</span>
                    <span className="font-bold text-blue-700">{viewingStaff.classAssigned}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[11px]">Điểm chuẩn ban đầu:</span>
                  <span className="font-bold text-slate-800">{viewingStaff.baseScore} điểm</span>
                </div>
              </div>

              {/* KPI Status for this staff */}
              {(() => {
                const summary = getPersonKpiSummary(viewingStaff.id, { schoolYear, semester, month });
                if (!summary) return null;
                return (
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Kết quả đánh giá thi đua KPI (Năm học {schoolYear})</span>
                    </h4>
                    <div className="grid grid-cols-4 gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500">Điểm cơ sở</div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">{summary.baseScore}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Điểm cộng (+)</div>
                        <div className="font-bold text-emerald-700 text-sm mt-0.5">+{summary.totalPlus}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-600 font-semibold">Điểm trừ (-)</div>
                        <div className="font-bold text-rose-700 text-sm mt-0.5">-{summary.totalMinus}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-800 font-bold">Tổng điểm KPI</div>
                        <div className="font-black text-blue-900 text-base mt-0.5">{summary.finalScore}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setViewingStaff(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  const id = viewingStaff.id;
                  setViewingStaff(null);
                  handleViewKpiPersonal(id);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>Xem chi tiết bảng KPI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: THÊM MỚI / SỬA HỒ SƠ CBQLGVNV */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingStaff ? 'Chỉnh sửa hồ sơ CBQLGVNV' : 'Thêm mới Cán bộ / Giáo viên / Nhân viên'}
                </h3>
                <p className="text-xs text-blue-200">{schoolConfig.fullName}</p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-blue-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Phân loại nhân sự:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('bgh');
                      setFormDept('Ban Giám hiệu');
                      setFormPosition('Phó Hiệu trưởng');
                      if (!editingStaff) setFormCode(`BGH${String(bghCount + 1).padStart(3, '0')}`);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      formType === 'bgh'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>CBQL (BGH)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('giaovien');
                      setFormDept('Tổ Toán - Lí - Tin');
                      setFormPosition('Giáo viên Giảng dạy');
                      if (!editingStaff) setFormCode(`GV${String(gvCount + 1).padStart(3, '0')}`);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      formType === 'giaovien'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Giáo viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('nhanvien');
                      setFormDept('Tổ Văn phòng');
                      setFormPosition('Nhân viên Văn phòng');
                      if (!editingStaff) setFormCode(`NV${String(nvCount + 1).padStart(3, '0')}`);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      formType === 'nhanvien'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Nhân viên</span>
                  </button>
                </div>
              </div>

              {/* Code & Name */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã định danh: *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên: *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Ví dụ: Nguyễn Văn Hoàng"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/30 font-medium"
                  />
                </div>
              </div>

              {/* Dept & Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ chuyên môn / Phòng ban:</label>
                  <select
                    value={formDept}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setFormDept(newDept);
                      if (newDept === 'Tổ Văn phòng') {
                        setFormType('nhanvien');
                        if (formPosition.includes('Giáo viên')) setFormPosition('Nhân viên Văn phòng');
                      } else if (newDept === 'Ban Giám hiệu') {
                        setFormType('bgh');
                        if (formPosition.includes('Giáo viên')) setFormPosition('Phó Hiệu trưởng');
                      } else {
                        if (formType === 'nhanvien') setFormType('giaovien');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {ALL_SCHOOL_DEPARTMENTS_WITH_BGH.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chức vụ đảm nhiệm:</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="Ví dụ: Giáo viên, Tổ trưởng, Kế toán..."
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Subject & Class (Only for GV) */}
              {formType === 'giaovien' && (
                <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">Môn giảng dạy chính:</label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Toán học, Ngữ văn, Vật lý..."
                      className="w-full p-2 rounded-lg border border-blue-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">Lớp chủ nhiệm (nếu có):</label>
                    <input
                      type="text"
                      value={formClassAssigned}
                      onChange={(e) => setFormClassAssigned(e.target.value)}
                      placeholder="Ví dụ: 12A1"
                      className="w-full p-2 rounded-lg border border-blue-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Degree & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trình độ chuyên môn:</label>
                  <select
                    value={formDegree}
                    onChange={(e) => setFormDegree(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Đại học">Đại học</option>
                    <option value="Cao đẳng">Cao đẳng</option>
                    <option value="Trung cấp">Trung cấp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính:</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0988.xxx.xxx"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email trường:</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="...@thptphuongxa.edu.vn"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Status & Base Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái công tác:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Đang công tác">Đang công tác</option>
                    <option value="Nghỉ chế độ">Nghỉ chế độ</option>
                    <option value="Tạm hoãn">Tạm hoãn</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm KPI chuẩn ban đầu:</label>
                  <input
                    type="number"
                    value={formBaseScore}
                    onChange={(e) => setFormBaseScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  {editingStaff ? 'Lưu thay đổi' : 'Thêm mới nhân sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: XÁC NHẬN XÓA NHÂN SỰ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Xác nhận xóa cán bộ?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa cán bộ{' '}
              <strong className="text-slate-800">
                {staffList.find((s) => s.id === deletingId)?.name}
              </strong>{' '}
              khỏi danh sách nhân sự Trường THPT Phương Xá? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer text-xs shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Modal Clear All Staff */}
      <ClearStaffModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
