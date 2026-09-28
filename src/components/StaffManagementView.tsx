import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import { StaffMember, PersonType, DepartmentType } from '../types';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Printer,
  Upload,
  Eye,
  Phone,
  Mail,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  Download,
  Award,
  ClipboardCheck,
} from 'lucide-react';
import { downloadCsv, getRankBadgeClass, downloadStaffTemplateExcel } from '../utils/exportUtils';
import { ExcelImportModal } from './ExcelImportModal';
import { ClearStaffModal } from './ClearStaffModal';
import { KpiEvaluationSheet } from './KpiEvaluationSheet';

interface StaffManagementViewProps {
  personType: PersonType;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ personType }) => {
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
    setIsQuickIncidentOpen,
    openPrintModal,
    schoolConfig,
    currentUser,
    showToast,
    updateBghName,
  } = useKpi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<StaffMember | null>(null);
  const [subView, setSubView] = useState<'list' | 'evaluation'>('list');
  const [targetEvaluationStaffId, setTargetEvaluationStaffId] = useState<string | undefined>(undefined);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<DepartmentType>('Tổ Toán - Lí - Tin');
  const [position, setPosition] = useState('');
  const [subject, setSubject] = useState('');
  const [classAssigned, setClassAssigned] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Đang công tác' | 'Nghỉ chế độ' | 'Tạm hoãn'>('Đang công tác');
  const [baseScore, setBaseScore] = useState(100);

  // Configure titles based on personType
  const config = useMemo(() => {
    switch (personType) {
      case 'bgh':
        return {
          title: 'QUẢN LÝ BAN GIÁM HIỆU',
          subtitle: `Danh sách Cán bộ Lãnh đạo & Quản lý ${schoolConfig.normalName}`,
          icon: ShieldCheck,
          codePrefix: 'BGH',
          defaultDept: 'Ban Giám hiệu' as DepartmentType,
          defaultPosition: 'Phó Hiệu trưởng',
        };
      case 'nhanvien':
        return {
          title: 'QUẢN LÝ NHÂN VIÊN HÀNH CHÍNH & PHỤC VỤ',
          subtitle: 'Danh sách nhân viên Kế toán, Văn thư, Y tế, Thư viện, Thiết bị, Bảo vệ',
          icon: Briefcase,
          codePrefix: 'NV',
          defaultDept: 'Tổ Văn phòng' as DepartmentType,
          defaultPosition: 'Nhân viên Văn phòng',
        };
      case 'giaovien':
      default:
        return {
          title: 'QUẢN LÝ ĐỘI NGŨ GIÁO VIÊN',
          subtitle: 'Danh sách giáo viên các tổ chuyên môn giảng dạy',
          icon: GraduationCap,
          codePrefix: 'GV',
          defaultDept: 'Tổ Toán - Lí - Tin' as DepartmentType,
          defaultPosition: 'Giáo viên Giảng dạy',
        };
    }
  }, [personType]);

  const Icon = config.icon;

  // Filter list
  const filteredList = useMemo(() => {
    return staffList
      .filter((member) => member.type === personType)
      .filter((member) => {
        const matchesQuery =
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (member.subject && member.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (member.phone && member.phone.includes(searchQuery));

        const matchesDept = selectedDept === 'all' || member.department === selectedDept;
        const matchesSubject = selectedSubject === 'all' || member.subject === selectedSubject;
        const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;

        return matchesQuery && matchesDept && matchesSubject && matchesStatus;
      });
  }, [staffList, personType, searchQuery, selectedDept, selectedSubject, selectedStatus]);

  // Unique lists for filters
  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(staffList.filter((s) => s.type === personType).map((s) => s.department)));
  }, [staffList, personType]);

  const uniqueSubjects = useMemo(() => {
    return Array.from(
      new Set(
        staffList
          .filter((s) => s.type === personType && s.subject)
          .map((s) => s.subject as string)
      )
    );
  }, [staffList, personType]);

  // Open add modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    const count = staffList.filter((s) => s.type === personType).length + 1;
    setCode(`${config.codePrefix}${String(count).padStart(3, '0')}`);
    setName('');
    setDepartment(config.defaultDept);
    setPosition(config.defaultPosition);
    setSubject(personType === 'giaovien' ? 'Toán học' : '');
    setClassAssigned('');
    setPhone('');
    setEmail('');
    setStatus('Đang công tác');
    setBaseScore(100);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (member: StaffMember) => {
    setEditingMember(member);
    setCode(member.code);
    setName(member.name);
    setDepartment(member.department);
    setPosition(member.position);
    setSubject(member.subject || '');
    setClassAssigned(member.classAssigned || '');
    setPhone(member.phone);
    setEmail(member.email);
    setStatus(member.status);
    setBaseScore(member.baseScore || 100);
    setIsFormModalOpen(true);
  };

  // Submit form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (editingMember) {
      updateStaff({
        ...editingMember,
        code,
        name,
        department,
        position,
        subject: personType === 'giaovien' ? subject : undefined,
        classAssigned: personType === 'giaovien' ? classAssigned : undefined,
        phone,
        email,
        status,
        baseScore,
      });

      // If editing primary BGH member (e.g. bgh-01 or Hiệu trưởng), sync user account
      if (personType === 'bgh' && (editingMember.id === 'bgh-01' || editingMember.position.toLowerCase().includes('hiệu trưởng'))) {
        updateBghName(name, position);
      }
    } else {
      addStaff({
        code,
        name,
        type: personType,
        department,
        position,
        subject: personType === 'giaovien' ? subject : undefined,
        classAssigned: personType === 'giaovien' ? classAssigned : undefined,
        phone,
        email,
        status,
        baseScore,
      });
    }
    setIsFormModalOpen(false);
  };

  // Export to Excel
  const handleExportCsv = () => {
    const safeSchoolName = schoolConfig.shortName.replace(/\s+/g, '_');
    const filename = `Danh_sach_${personType}_${safeSchoolName}_${schoolYear.replace(/\s+/g, '')}`;
    const headers =
      personType === 'giaovien'
        ? ['STT', 'Mã GV', 'Họ và tên', 'Tổ chuyên môn', 'Môn giảng dạy', 'Chức vụ', 'Lớp phụ trách', 'Trạng thái', 'KPI Tháng', 'KPI Năm', 'Xếp loại']
        : ['STT', 'Mã', 'Họ và tên', 'Bộ phận/Tổ', 'Chức vụ', 'Điện thoại', 'Email', 'Trạng thái', 'Điểm KPI', 'Xếp loại'];

    const rows = filteredList.map((m, idx) => {
      const summaryMonth = getPersonKpiSummary(m.id, { schoolYear, semester, month });
      const summaryYear = getPersonKpiSummary(m.id, { schoolYear });
      if (personType === 'giaovien') {
        return [
          idx + 1,
          m.code,
          m.name,
          m.department,
          m.subject || '',
          m.position,
          m.classAssigned || '',
          m.status,
          summaryMonth?.finalScore || 100,
          summaryYear?.finalScore || 100,
          summaryYear?.rank || 'Hoàn thành',
        ];
      } else {
        return [
          idx + 1,
          m.code,
          m.name,
          m.department,
          m.position,
          m.phone,
          m.email,
          m.status,
          summaryYear?.finalScore || 100,
          summaryYear?.rank || 'Hoàn thành',
        ];
      }
    });

    downloadCsv(filename, headers, rows);
  };

  if (subView === 'evaluation') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubView('list')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            ← Quay lại danh sách nhân sự
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Mẫu Phiếu Đánh Giá Chấm Điểm KPI Năm Học {schoolYear} – THPT PHƯƠNG XÁ
          </span>
        </div>
        <KpiEvaluationSheet
          initialStaffId={targetEvaluationStaffId}
          onClose={() => setSubView('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sub-view switcher tabs for Teacher / Staff KPI */}
      {(personType === 'giaovien' || personType === 'nhanvien') && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubView('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              subView === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách nhân sự ({filteredList.length})</span>
          </button>

          {personType === 'nhanvien' && (
            <button
              onClick={() => setActiveTab('kpi-nhanvien')}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-xs hover:from-amber-300 hover:to-amber-200"
            >
              <Briefcase className="w-4 h-4 text-slate-950" />
              <span>Mở Module KPI Nhân viên (30đ chung + 70đ vị trí việc làm)</span>
            </button>
          )}

          <button
            onClick={() => {
              setTargetEvaluationStaffId(undefined);
              setSubView('evaluation');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Phiếu chấm điểm KPI chuẩn 100đ (THPT PHƯƠNG XÁ)</span>
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">{config.title}</h2>
            <p className="text-xs text-slate-500">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Xuất danh sách ra file Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() =>
              openPrintModal(
                `DANH SÁCH ${config.title}`,
                `${schoolConfig.normalName} – Năm học ${schoolYear}`
              )
            }
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In danh sách</span>
          </button>

          {currentUser?.role === 'bgh' && (
            <>
              <button
                onClick={() => {
                  downloadStaffTemplateExcel(schoolConfig.shortName);
                  showToast('Đã tải xuống file Excel mẫu 6 cột chuẩn!', 'success');
                }}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Tải về file Excel mẫu 6 cột chuẩn theo quy định"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Tải mẫu Excel</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Nhập danh sách nhân sự từ file Excel (.xlsx, .csv)"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Nhập từ Excel</span>
              </button>

              <button
                onClick={() => setIsClearModalOpen(true)}
                className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Xóa toàn bộ danh sách nhân sự khỏi hệ thống"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa toàn bộ</span>
              </button>
            </>
          )}

          {(personType === 'giaovien' || personType === 'nhanvien') && (
            <button
              onClick={() => {
                setTargetEvaluationStaffId(undefined);
                setSubView('evaluation');
              }}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Chấm điểm KPI theo mẫu chuẩn THPT PHƯƠNG XÁ"
            >
              <Award className="w-4 h-4" />
              <span>Chấm điểm KPI</span>
            </button>
          )}

          <button
            id={`btn-add-${personType}`}
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã số, môn, số điện thoại..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">Tổ/Bộ phận:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả ({filteredList.length})</option>
            {uniqueDepts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter (for Teachers) */}
        {personType === 'giaovien' && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Môn:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
            >
              <option value="all">Tất cả môn</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Trạng thái:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả</option>
            <option value="Đang công tác">Đang công tác</option>
            <option value="Nghỉ chế độ">Nghỉ chế độ</option>
            <option value="Tạm hoãn">Tạm hoãn</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3">Mã</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3">Tổ / Bộ phận</th>
                {personType === 'giaovien' && <th className="py-3 px-3">Môn dạy</th>}
                <th className="py-3 px-3">Chức vụ</th>
                {personType === 'giaovien' && <th className="py-3 px-3">Lớp PT</th>}
                {personType !== 'giaovien' && <th className="py-3 px-3">Liên hệ</th>}
                <th className="py-3 px-3 text-center">Trạng thái</th>
                {personType === 'giaovien' ? (
                  <>
                    <th className="py-3 px-3 text-center">KPI Tháng {month}</th>
                    <th className="py-3 px-3 text-center">KPI Cả năm</th>
                  </>
                ) : (
                  <th className="py-3 px-3 text-center">KPI Hiện tại</th>
                )}
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredList.map((member, index) => {
                  const summaryMonth = getPersonKpiSummary(member.id, { schoolYear, semester, month });
                  const summaryYear = getPersonKpiSummary(member.id, { schoolYear });

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-normal">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {member.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{member.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{member.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {member.department}
                        </span>
                      </td>
                      {personType === 'giaovien' && (
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {member.subject || '—'}
                        </td>
                      )}
                      <td className="py-3 px-3 text-slate-600">{member.position}</td>
                      {personType === 'giaovien' && (
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {member.classAssigned ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                              {member.classAssigned}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      {personType !== 'giaovien' && (
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          <div>{member.phone}</div>
                        </td>
                      )}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            member.status === 'Đang công tác'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{member.status}</span>
                        </span>
                      </td>

                      {/* KPI Score Columns */}
                      {personType === 'giaovien' ? (
                        <>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            <span className="text-blue-700 font-extrabold text-sm">
                              {summaryMonth?.finalScore ?? 100}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="font-extrabold text-sm text-slate-900">
                              {summaryYear?.finalScore ?? 100} đ
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${getRankBadgeClass(
                                summaryYear?.rank || 'Hoàn thành'
                              )}`}
                            >
                              {summaryYear?.rank || 'Hoàn thành'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="py-3 px-3 text-center">
                          <div className="font-black text-sm text-blue-700">
                            {summaryYear?.finalScore ?? 100} đ
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${getRankBadgeClass(
                              summaryYear?.rank || 'Hoàn thành'
                            )}`}
                          >
                            {summaryYear?.rank || 'Hoàn thành'}
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Chấm điểm KPI theo mẫu chuẩn */}
                          {(personType === 'giaovien' || personType === 'nhanvien') && (
                            <button
                              onClick={() => {
                                setTargetEvaluationStaffId(member.id);
                                setSubView('evaluation');
                              }}
                              className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 border border-amber-200 transition cursor-pointer"
                              title="Mở Phiếu đánh giá, chấm điểm KPI chuẩn 100đ THPT PHƯƠNG XÁ"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-600" />
                              <span>Chấm KPI</span>
                            </button>
                          )}

                          {/* View Personal KPI Button */}
                          <button
                            onClick={() => {
                              setSelectedPersonId(member.id);
                              setActiveTab(member.type === 'nhanvien' ? 'kpi-nhanvien' : 'kpi-evaluation');
                            }}
                            className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition"
                            title={member.type === 'nhanvien' ? 'Xem & Chấm KPI Nhân viên' : 'Xem & Chấm KPI'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* View Profile Card */}
                          <button
                            onClick={() => setViewingMember(member)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
                            title="Xem hồ sơ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-md hover:bg-amber-100 text-amber-600 transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingId(member.id)}
                            className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 transition"
                            title="Xóa nhân sự"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Hiển thị <strong className="text-slate-800">{filteredList.length}</strong> nhân sự
          </span>
          <span className="text-[11px] text-slate-400">
            Dữ liệu {schoolConfig.normalName} • Lưu trữ tự động
          </span>
        </div>
      </div>

      {/* MODAL: ADD / EDIT STAFF */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <span>{editingMember ? 'Cập nhật thông tin nhân sự' : `Thêm mới ${config.title}`}</span>
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã định danh:</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ / Bộ phận:</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Ban Giám hiệu">Ban Giám hiệu</option>
                    <option value="Tổ Hóa - Sinh - CN">Tổ Hóa - Sinh - CN</option>
                    <option value="Tổ Toán - Lí - Tin">Tổ Toán - Lí - Tin</option>
                    <option value="Tổ Văn - Ngoại ngữ">Tổ Văn - Ngoại ngữ</option>
                    <option value="Tổ Sử - Địa - KT&PL - TD - QPAN">Tổ Sử - Địa - KT&PL - TD - QPAN</option>
                    <option value="Tổ Văn phòng">Tổ Văn phòng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chức vụ:</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Tổ trưởng, Giáo viên, Kế toán..."
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              {personType === 'giaovien' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Môn giảng dạy chính:</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Toán, Văn, Tiếng Anh, Vật lý..."
                      className="w-full p-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lớp phụ trách / Chủ nhiệm:</label>
                    <input
                      type="text"
                      value={classAssigned}
                      onChange={(e) => setClassAssigned(e.target.value)}
                      placeholder="12A1, 10B2... (nếu có)"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987.xxx.xxx"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email trường:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="...@thptphuongxa.edu.vn"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái công tác:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
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
                    value={baseScore}
                    onChange={(e) => setBaseScore(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {editingMember ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800 mb-1">Xác nhận xóa nhân sự</h3>
            <p className="text-xs text-slate-500 mb-4">
              Hành động này sẽ xóa vĩnh viễn thông tin và các dữ liệu phát sinh KPI liên quan. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStaff(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PROFILE CARD */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-gradient-to-r from-blue-800 to-indigo-900 text-white relative">
              <button
                onClick={() => setViewingMember(null)}
                className="absolute top-4 right-4 text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center text-2xl font-black mb-3">
                {viewingMember.name.charAt(viewingMember.name.lastIndexOf(' ') + 1) || viewingMember.name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold">{viewingMember.name}</h3>
              <p className="text-xs text-blue-200">{viewingMember.position} • {viewingMember.department}</p>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Mã cán bộ/GV:</span>
                <span className="font-bold text-slate-800 font-mono">{viewingMember.code}</span>
              </div>
              {viewingMember.subject && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Môn giảng dạy:</span>
                  <span className="font-bold text-slate-800">{viewingMember.subject}</span>
                </div>
              )}
              {viewingMember.classAssigned && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Lớp chủ nhiệm:</span>
                  <span className="font-bold text-blue-600">{viewingMember.classAssigned}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-medium text-slate-800">{viewingMember.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{viewingMember.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-600">{viewingMember.status}</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedPersonId(viewingMember.id);
                    setActiveTab('kpi-personal');
                    setViewingMember(null);
                  }}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-center"
                >
                  Xem Bảng Điểm KPI Cá Nhân →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Excel Import Modal */}
      <ExcelImportModal
        defaultType={personType}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Clear Staff Confirmation Modal */}
      <ClearStaffModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
