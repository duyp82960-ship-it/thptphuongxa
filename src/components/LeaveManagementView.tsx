import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  LeaveRequest,
  LeaveTypeCode,
  LEAVE_TYPES,
  LeaveSession,
  TeachingSubstitutePlan,
  LeaveRequestStatus,
  DepartmentType,
  getDepartmentId,
} from '../types';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  FileText,
  Search,
  Filter,
  User,
  Building2,
  Phone,
  Send,
  Trash2,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Calendar,
  Check,
  X,
  RefreshCw,
  BookOpen,
  Briefcase,
  Layers,
  ArrowRight,
  Download,
  CheckSquare,
  Square,
  MessageSquare,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const LeaveManagementView: React.FC = () => {
  const {
    currentUser,
    staffList,
    schoolConfig,
    schoolYear,
    leaveRequestsList,
    saveLeaveRequest,
    deleteLeaveRequest,
    bulkDeleteLeaveRequests,
    clearAllLeaveRequests,
    restoreInitialLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    cancelLeaveRequest,
    getStaffLeaveQuota,
    showToast,
  } = useKpi();

  // Primary navigation tab
  const [activeSubTab, setActiveSubTab] = useState<
    'approvals' | 'new_request' | 'my_requests' | 'summary_quota'
  >('approvals');

  // Search & Filter state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('all');

  // Selection for bulk action / export / bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<LeaveRequest | null>(null);
  const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<LeaveRequest | null>(null);
  const [showExportTableModal, setShowExportTableModal] = useState(false);

  // Clear all & delete confirmation modals
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<LeaveRequest | null>(null);

  // Approval note modal
  const [approveModalData, setApproveModalData] = useState<{
    request: LeaveRequest;
    reviewerRole: 'dept' | 'bgh';
  } | null>(null);
  const [approveNoteInput, setApproveNoteInput] = useState('');

  // Reject modal
  const [rejectModalData, setRejectModalData] = useState<{
    request: LeaveRequest;
    reviewerRole: 'dept' | 'bgh';
  } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Current user's staff record
  const currentStaff = useMemo(() => {
    if (!currentUser) return null;
    return staffList.find((s) => s.id === currentUser.personId) || staffList[0];
  }, [currentUser, staffList]);

  // Is user a leader/approver?
  const isBgh = currentUser?.role === 'bgh';
  const isDeptLeader = useMemo(() => {
    if (isBgh) return true;
    if (!currentStaff) return false;
    const pos = currentStaff.position?.toLowerCase() || '';
    return (
      pos.includes('tổ trưởng') ||
      pos.includes('phụ trách') ||
      pos.includes('trưởng ban') ||
      currentStaff.department === 'Tổ Văn phòng'
    );
  }, [isBgh, currentStaff]);

  // My requests
  const myRequests = useMemo(() => {
    if (!currentStaff) return [];
    return leaveRequestsList.filter((r) => r.staffId === currentStaff.id);
  }, [leaveRequestsList, currentStaff]);

  // Filtered requests for the master table
  const filteredRequests = useMemo(() => {
    return leaveRequestsList.filter((r) => {
      // Keyword filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchName = r.staffName?.toLowerCase().includes(q);
        const matchCode = r.staffCode?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
        const matchReason = r.reason?.toLowerCase().includes(q);
        const matchDept = r.department?.toLowerCase().includes(q);
        const matchPos = r.position?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchReason && !matchDept && !matchPos) {
          return false;
        }
      }

      // Department filter
      if (
        filterDepartment !== 'all' &&
        r.department !== filterDepartment &&
        getDepartmentId(r.department) !== getDepartmentId(filterDepartment)
      ) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending') {
          if (r.status !== 'pending_dept' && r.status !== 'pending_bgh') return false;
        } else if (filterStatus === 'pending_dept') {
          if (r.status !== 'pending_dept') return false;
        } else if (filterStatus === 'pending_bgh') {
          if (r.status !== 'pending_bgh') return false;
        } else if (r.status !== filterStatus) {
          return false;
        }
      }

      // Leave type filter
      if (filterLeaveType !== 'all' && r.leaveType !== filterLeaveType) {
        return false;
      }

      return true;
    });
  }, [leaveRequestsList, searchKeyword, filterDepartment, filterStatus, filterLeaveType]);

  // Pending count
  const pendingCount = useMemo(() => {
    return leaveRequestsList.filter((r) => r.status === 'pending_dept' || r.status === 'pending_bgh').length;
  }, [leaveRequestsList]);

  // Quick reason suggestions for easy creation
  const reasonSuggestions = [
    'Giải quyết công việc riêng của gia đình',
    'Đưa người thân (bố mẹ/con) đi khám điều trị bệnh',
    'Bản thân bị ốm đau, cần nghỉ ngơi phục hồi sức khỏe',
    'Tham gia lớp bồi dưỡng / tập huấn nâng cao chuyên môn',
    'Gia đình có việc hỷ (cưới hỏi)',
    'Gia đình có việc tang hiếu',
    'Đi công tác / coi thi / chấm thi theo điều động',
  ];

  // ==================== NEW LEAVE REQUEST FORM STATE ====================
  const [formData, setFormData] = useState<{
    staffId: string;
    leaveType: LeaveTypeCode;
    startDate: string;
    startSession: LeaveSession;
    endDate: string;
    endSession: LeaveSession;
    reason: string;
    addressDuringLeave: string;
    emergencyPhone: string;
    handoverStaffId: string;
    handoverContent: string;
  }>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      staffId: currentStaff?.id || (staffList[0]?.id ?? ''),
      leaveType: 'phep_nam',
      startDate: todayStr,
      startSession: 'full',
      endDate: todayStr,
      endSession: 'full',
      reason: '',
      addressDuringLeave: '',
      emergencyPhone: currentStaff?.phone || '',
      handoverStaffId: '',
      handoverContent: '',
    };
  });

  // Calculate duration in days
  const calculatedDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 1;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    if (diffDays < 0) return 0;

    if (diffDays === 0) {
      if (formData.startSession === 'morning' || formData.startSession === 'afternoon') {
        return 0.5;
      }
      return 1;
    }

    let total = diffDays + 1;
    if (formData.startSession === 'afternoon') total -= 0.5;
    if (formData.endSession === 'morning') total -= 0.5;
    return Math.max(0.5, total);
  }, [formData.startDate, formData.endDate, formData.startSession, formData.endSession]);

  // Form selected staff details
  const formStaff = useMemo(() => {
    return staffList.find((s) => s.id === formData.staffId) || currentStaff || staffList[0];
  }, [staffList, formData.staffId, currentStaff]);

  // Colleagues in the same department
  const deptColleagues = useMemo(() => {
    if (!formStaff) return staffList;
    return staffList.filter((s) => s.department === formStaff.department && s.id !== formStaff.id);
  }, [staffList, formStaff]);

  // Submit leave request
  const handleSubmitNewRequest = async (e: React.FormEvent, andPrint = false) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast('Vui lòng nhập lý do xin nghỉ cụ thể!', 'error');
      return;
    }
    if (calculatedDays <= 0) {
      showToast('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!', 'error');
      return;
    }

    const matchedHandoverStaff = staffList.find((s) => s.id === formData.handoverStaffId);
    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);

    const newRequest: LeaveRequest = {
      id: `LEAVE-${Date.now()}`,
      code: `NP-${dateCode}-${randNum}`,
      staffId: formStaff.id,
      staffCode: formStaff.code,
      staffName: formStaff.name,
      department: formStaff.department,
      position: formStaff.position,
      targetType: formStaff.type,
      phone: formData.emergencyPhone || formStaff.phone,
      email: formStaff.email,
      leaveType: formData.leaveType,
      leaveTypeLabel: LEAVE_TYPES[formData.leaveType]?.name || 'Nghỉ phép',
      startDate: formData.startDate,
      startSession: formData.startSession,
      endDate: formData.endDate,
      endSession: formData.endSession,
      totalDays: calculatedDays,
      reason: formData.reason.trim(),
      addressDuringLeave: formData.addressDuringLeave.trim() || 'Tại nơi cư trú',
      emergencyPhone: formData.emergencyPhone || formStaff.phone,
      handoverStaffId: formData.handoverStaffId,
      handoverStaffName: matchedHandoverStaff?.name || '',
      handoverContent: formData.handoverContent.trim(),
      // Initial status: BGH level directly goes to approved/bgh, others to pending_dept
      status: formStaff.type === 'bgh' ? 'approved' : 'pending_dept',
      deptReviewStatus: 'pending',
      bghReviewStatus: 'pending',
      schoolYear: schoolYear,
      createdAt: new Date().toLocaleString('vi-VN'),
      updatedAt: new Date().toLocaleString('vi-VN'),
      createdBy: currentUser?.name || formStaff.name,
    };

    await saveLeaveRequest(newRequest);
    showToast(`Đã tạo đơn xin nghỉ thành công cho ${formStaff.name}!`, 'success');

    // Reset form
    setFormData({
      staffId: currentStaff?.id || '',
      leaveType: 'phep_nam',
      startDate: new Date().toISOString().split('T')[0],
      startSession: 'full',
      endDate: new Date().toISOString().split('T')[0],
      endSession: 'full',
      reason: '',
      addressDuringLeave: '',
      emergencyPhone: currentStaff?.phone || '',
      handoverStaffId: '',
      handoverContent: '',
    });

    if (andPrint) {
      setSelectedRequestForPrint(newRequest);
    }

    // Switch to table tab
    setActiveSubTab('approvals');
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map((r) => r.id));
    }
  };

  // Toggle single item
  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một đơn xin nghỉ để phê duyệt!', 'error');
      return;
    }

    const reviewerRole = isBgh ? 'bgh' : 'dept';
    for (const id of selectedIds) {
      const req = leaveRequestsList.find((r) => r.id === id);
      if (req && req.status !== 'approved') {
        await approveLeaveRequest(id, reviewerRole, 'Phê duyệt hàng loạt');
      }
    }

    showToast(`Đã phê duyệt thành công ${selectedIds.length} đơn xin nghỉ phép!`, 'success');
    setSelectedIds([]);
  };

  // Bulk Delete confirmed
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await bulkDeleteLeaveRequests(selectedIds);
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
  };

  // Clear All confirmed
  const handleConfirmClearAll = async () => {
    await clearAllLeaveRequests();
    setSelectedIds([]);
    setShowClearAllModal(false);
  };

  // Single Delete confirmed
  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    await deleteLeaveRequest(singleDeleteTarget.id);
    setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteTarget.id));
    setSingleDeleteTarget(null);
  };

  // Export CSV function with UTF-8 BOM
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0
      ? leaveRequestsList.filter((r) => selectedIds.includes(r.id))
      : filteredRequests;

    if (listToExport.length === 0) {
      showToast('Không có dữ liệu đơn nghỉ để xuất bảng!', 'error');
      return;
    }

    const headers = [
      'STT',
      'Mã Đơn',
      'Mã CBGVNV',
      'Họ và Tên',
      'Chức Vụ',
      'Tổ / Bộ Phận',
      'Loại Hình Nghỉ',
      'Từ Ngày',
      'Đến Ngày',
      'Số Ngày Nghỉ',
      'Lý Do Xin Nghỉ',
      'Người Bàn Giao/Dạy Thay',
      'Ngày Tạo Đơn',
      'Trạng Thái',
      'Tổ Trưởng Phê Duyệt',
      'BGH Phê Duyệt',
      'Ý Kiến / Ghi Chú Phê Duyệt',
    ];

    const rows = listToExport.map((r, index) => {
      let statusText = 'Chờ duyệt';
      if (r.status === 'approved') statusText = 'Đã duyệt';
      else if (r.status === 'rejected') statusText = `Từ chối: ${r.rejectionReason || ''}`;
      else if (r.status === 'pending_dept') statusText = 'Chờ Tổ trưởng duyệt';
      else if (r.status === 'pending_bgh') statusText = 'Chờ BGH duyệt';
      else if (r.status === 'cancelled') statusText = 'Đã hủy';

      return [
        index + 1,
        `"${r.code || ''}"`,
        `"${r.staffCode || ''}"`,
        `"${r.staffName || ''}"`,
        `"${r.position || ''}"`,
        `"${r.department || ''}"`,
        `"${r.leaveTypeLabel || ''}"`,
        `"${r.startDate} (${r.startSession === 'morning' ? 'Sáng' : r.startSession === 'afternoon' ? 'Chiều' : 'Cả ngày'})"`,
        `"${r.endDate} (${r.endSession === 'morning' ? 'Sáng' : r.endSession === 'afternoon' ? 'Chiều' : 'Cả ngày'})"`,
        r.totalDays,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${r.handoverStaffName || ''}"`,
        `"${r.createdAt || ''}"`,
        `"${statusText}"`,
        `"${r.deptReviewerName || (r.deptReviewStatus === 'approved' ? 'Đã duyệt' : '')}"`,
        `"${r.bghReviewerName || (r.bghReviewStatus === 'approved' ? 'Đã duyệt' : '')}"`,
        `"${r.bghReviewNote || r.deptReviewNote || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_Tong_Hop_Don_Xin_Nghi_${schoolYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Đã xuất file bảng tính Excel/CSV thành công!', 'success');
  };

  // Helper status badge renderer
  const renderStatusBadge = (status: LeaveRequestStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã duyệt
          </span>
        );
      case 'pending_dept':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Chờ Tổ duyệt
          </span>
        );
      case 'pending_bgh':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Chờ BGH duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Từ chối
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 rounded-2xl text-white p-6 sm:p-7 shadow-xl border border-blue-700/40">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
          <CalendarDays className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-medium border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              NĂM HỌC {schoolYear} – TRƯỜNG THPT PHƯƠNG XÁ
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              QUẢN LÝ ĐƠN NGHỈ PHÉP & PHÊ DUYỆT LÃNH ĐẠO
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Tạo đơn xin nghỉ và lý do nghỉ nhanh chóng, tổng hợp xuất bảng đề nghị để Lãnh đạo và Ban Giám hiệu xem xét, phê duyệt và ký duyệt văn bản.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveSubTab('new_request')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              + Tạo Đơn Xin Nghỉ Mới
            </button>

            <button
              onClick={() => setShowExportTableModal(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              Xuất Bảng Trình Lãnh Đạo Phê Duyệt
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="mt-6 pt-5 border-t border-blue-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-xs text-blue-200">Tổng số đơn xin nghỉ</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {leaveRequestsList.length} <span className="text-xs font-normal text-blue-200">đơn</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-xs text-amber-200">Đang chờ lãnh đạo duyệt</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {pendingCount} <span className="text-xs font-normal text-amber-200">đơn</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-xs text-emerald-200">Đã phê duyệt hoàn tất</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
              {leaveRequestsList.filter((r) => r.status === 'approved').length}{' '}
              <span className="text-xs font-normal text-emerald-200">đơn</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-xs text-cyan-200">Đơn cá nhân của tôi</div>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
              {myRequests.length} <span className="text-xs font-normal text-cyan-200">đơn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeSubTab === 'approvals'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Bảng Tổng Hợp & Phê Duyệt Lãnh Đạo
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('new_request')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeSubTab === 'new_request'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          + Tạo Đơn Xin Nghỉ & Lý Do
        </button>

        <button
          onClick={() => setActiveSubTab('my_requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeSubTab === 'my_requests'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-400" />
          Đơn Của Tôi ({myRequests.length})
        </button>

        <button
          onClick={() => setActiveSubTab('summary_quota')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeSubTab === 'summary_quota'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-400" />
          Thống Kê Quỹ Phép Toàn Trường
        </button>
      </div>

      {/* ==================== TAB 1: BẢNG TỔNG HỢP & PHÊ DUYỆT LÃNH ĐẠO ==================== */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          {/* Action Toolbar & Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã CBGVNV, Họ tên, Lý do xin nghỉ, Tổ bộ phận..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="text-xs rounded-xl border-slate-300 shadow-xs p-2 bg-white font-medium text-slate-700"
                >
                  <option value="all">Tất cả tổ / bộ phận</option>
                  <option value="Tổ Hóa - Sinh - CN">Tổ Hóa - Sinh - CN</option>
                  <option value="Tổ Toán - Lí - Tin">Tổ Toán - Lí - Tin</option>
                  <option value="Tổ Văn - Ngoại ngữ">Tổ Văn - Ngoại ngữ</option>
                  <option value="Tổ Sử - Địa - KT&PL - TD - QPAN">Tổ Sử - Địa - KT&PL - TD - QPAN</option>
                  <option value="Tổ Văn phòng">Tổ Văn phòng</option>
                  <option value="Ban Giám hiệu">Ban Giám hiệu</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs rounded-xl border-slate-300 shadow-xs p-2 bg-white font-medium text-slate-700"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Đang chờ duyệt</option>
                  <option value="pending_bgh">Chờ BGH duyệt</option>
                  <option value="pending_dept">Chờ Tổ trưởng duyệt</option>
                  <option value="approved">Đã duyệt hoàn tất</option>
                  <option value="rejected">Bị từ chối</option>
                </select>

                <select
                  value={filterLeaveType}
                  onChange={(e) => setFilterLeaveType(e.target.value)}
                  className="text-xs rounded-xl border-slate-300 shadow-xs p-2 bg-white font-medium text-slate-700"
                >
                  <option value="all">Tất cả loại nghỉ</option>
                  {(Object.keys(LEAVE_TYPES) as LeaveTypeCode[]).map((code) => (
                    <option key={code} value={code}>
                      {LEAVE_TYPES[code].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick action bar for export, bulk operations, and Clear All */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleToggleSelectAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {selectedIds.length === filteredRequests.length && filteredRequests.length > 0 ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
                      Bỏ chọn tất cả
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      Chọn tất cả danh sách ({filteredRequests.length})
                    </>
                  )}
                </button>

                {selectedIds.length > 0 && (
                  <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Đã chọn: {selectedIds.length} đơn
                  </span>
                )}

                {/* Bulk Delete Button when items selected */}
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa {selectedIds.length} đơn đã chọn
                  </button>
                )}

                {/* Clear ALL Leave Requests & Reasons Button */}
                {leaveRequestsList.length > 0 && (
                  <button
                    onClick={() => setShowClearAllModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-xs transition cursor-pointer"
                    title="Xóa toàn bộ danh sách đơn xin nghỉ phép và lý do nghỉ"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Xóa toàn bộ danh sách ({leaveRequestsList.length})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Duyệt nhanh {selectedIds.length} đơn đã chọn
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Xuất Excel / CSV
                </button>

                <button
                  onClick={() => setShowExportTableModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  Xuất Bảng Trình Lãnh Đạo Phê Duyệt
                </button>
              </div>
            </div>
          </div>

          {/* Master Table of Leave Requests with Reasons */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bảng Danh Sách Đơn Xin Nghỉ & Lý Do ({filteredRequests.length} đơn)
                </h3>
              </div>
              <span className="text-xs text-slate-500 italic">
                Lãnh đạo có thể phê duyệt trực tiếp trên từng hàng hoặc chọn xuất bảng trình ký
              </span>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">
                  {leaveRequestsList.length === 0
                    ? 'Danh sách đơn xin nghỉ phép hiện đang trống'
                    : 'Không tìm thấy đơn xin nghỉ phù hợp với bộ lọc'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {leaveRequestsList.length === 0
                    ? 'Toàn bộ danh sách đơn xin nghỉ và lý do đã được xóa sạch. Bạn có thể tạo đơn mới hoặc khôi phục dữ liệu mẫu khi cần.'
                    : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem danh sách đơn.'}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveSubTab('new_request')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold shadow-xs hover:bg-blue-800 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    Tạo Đơn Xin Nghỉ Mới
                  </button>

                  {leaveRequestsList.length === 0 && (
                    <button
                      onClick={restoreInitialLeaveRequests}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
                      Khôi phục dữ liệu mẫu
                    </button>
                  )}

                  {leaveRequestsList.length > 0 && (
                    <button
                      onClick={() => {
                        setSearchKeyword('');
                        setFilterDepartment('all');
                        setFilterStatus('all');
                        setFilterLeaveType('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200 tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Cán Bộ / GV / NV</th>
                      <th className="py-3 px-3">Tổ / Bộ Phận</th>
                      <th className="py-3 px-3">Loại Nghỉ</th>
                      <th className="py-3 px-3">Thời Gian Nghỉ</th>
                      <th className="py-3 px-4 min-w-[220px]">Lý Do Xin Nghỉ</th>
                      <th className="py-3 px-3 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-center">Lãnh Đạo Phê Duyệt / Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredRequests.map((req, index) => {
                      const isSelected = selectedIds.includes(req.id);
                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            isSelected ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(req.id)}
                              className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* STT */}
                          <td className="py-3 px-3 text-center text-slate-500 font-normal">
                            {index + 1}
                          </td>

                          {/* CBGVNV */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {req.staffName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                {req.staffCode}
                              </span>
                              <span>• {req.position}</span>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                              {req.department}
                            </span>
                          </td>

                          {/* Leave Type */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-blue-900">{req.leaveTypeLabel}</div>
                            <div className="text-[10px] text-slate-500">
                              {req.totalDays} ngày ({req.startSession === 'morning' ? 'Sáng' : req.startSession === 'afternoon' ? 'Chiều' : 'Cả ngày'})
                            </div>
                          </td>

                          {/* Date Range */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">
                              {req.startDate} {req.startDate !== req.endDate ? `➔ ${req.endDate}` : ''}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Gửi: {req.createdAt?.split(' ')[1] || req.createdAt}
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3 px-4">
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 leading-snug font-medium text-xs">
                              {req.reason}
                            </div>
                            {req.handoverStaffName && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                Bàn giao/dạy thay: <strong>{req.handoverStaffName}</strong>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {renderStatusBadge(req.status)}
                          </td>

                          {/* Leadership Actions & Delete */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Quick Approve Button */}
                              {req.status !== 'approved' && (
                                <button
                                  onClick={() => {
                                    const reviewerRole = isBgh ? 'bgh' : 'dept';
                                    approveLeaveRequest(req.id, reviewerRole, 'Đồng ý phê duyệt');
                                    showToast(`Đã duyệt đơn nghỉ cho ${req.staffName}!`, 'success');
                                  }}
                                  title="Phê duyệt nhanh"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Duyệt
                                </button>
                              )}

                              {/* Approve with note */}
                              {req.status !== 'approved' && (
                                <button
                                  onClick={() => {
                                    setApproveModalData({
                                      request: req,
                                      reviewerRole: isBgh ? 'bgh' : 'dept',
                                    });
                                    setApproveNoteInput('Đồng ý giải quyết theo nguyện vọng');
                                  }}
                                  title="Phê duyệt kèm ý kiến chỉ đạo"
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Reject */}
                              {req.status !== 'rejected' && req.status !== 'approved' && (
                                <button
                                  onClick={() => {
                                    setRejectModalData({
                                      request: req,
                                      reviewerRole: isBgh ? 'bgh' : 'dept',
                                    });
                                    setRejectReasonInput('');
                                  }}
                                  title="Từ chối đơn"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Print Individual Form */}
                              <button
                                onClick={() => setSelectedRequestForPrint(req)}
                                title="In đơn xin nghỉ phép cá nhân"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* View Detail */}
                              <button
                                onClick={() => setSelectedRequestForDetail(req)}
                                title="Xem chi tiết đơn"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Individual Leave Request */}
                              <button
                                onClick={() => setSingleDeleteTarget(req)}
                                title="Xóa đơn xin nghỉ này"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Reviewed Info if approved */}
                            {req.status === 'approved' && (
                              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                                {req.bghReviewerName || req.deptReviewerName ? `Duyệt bởi: ${req.bghReviewerName || req.deptReviewerName}` : 'Đã duyệt'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: TẠO ĐƠN XIN NGHỈ & LÝ DO NGHỈ ==================== */}
      {activeSubTab === 'new_request' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 max-w-4xl mx-auto">
          <div className="pb-5 border-b border-slate-100 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-blue-900" />
                TẠO ĐƠN XIN NGHỈ PHÉP & LÝ DO NGHỈ
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Điền thông tin thời gian và lý do xin nghỉ. Đơn sẽ tự động chuyển đến Ban Giám hiệu và Tổ trưởng để xuất bảng phê duyệt.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('approvals')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              ← Về Bảng Tổng Hợp
            </button>
          </div>

          <form onSubmit={(e) => handleSubmitNewRequest(e, false)} className="space-y-6">
            {/* 1. Applicant Selector */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                1. Người làm đơn xin nghỉ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cán bộ / Giáo viên / Nhân viên (*)
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, staffId: e.target.value }))}
                    className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white font-medium text-slate-800"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {s.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chức vụ & Tổ/Bộ phận</label>
                  <input
                    type="text"
                    disabled
                    value={`${formStaff?.position || ''} • ${formStaff?.department || ''}`}
                    className="w-full text-xs rounded-lg border-slate-200 bg-slate-100 text-slate-600 p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emergencyPhone: e.target.value }))}
                    placeholder="Nhập số điện thoại..."
                    className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Leave Type & Duration */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                2. Loại hình nghỉ & Thời gian nghỉ
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Chọn loại hình nghỉ phép (*)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(Object.keys(LEAVE_TYPES) as LeaveTypeCode[]).map((typeCode) => {
                    const info = LEAVE_TYPES[typeCode];
                    const isSelected = formData.leaveType === typeCode;
                    return (
                      <div
                        key={typeCode}
                        onClick={() => setFormData((prev) => ({ ...prev, leaveType: typeCode }))}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{info.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              info.paidStatus === 'Có hưởng lương'
                                ? 'bg-emerald-100 text-emerald-800'
                                : info.paidStatus === 'Hưởng chế độ BHXH'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {info.paidStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{info.shortDesc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Nghỉ từ ngày (*)</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="flex-1 text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white font-medium"
                    />
                    <select
                      value={formData.startSession}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startSession: e.target.value as LeaveSession }))
                      }
                      className="text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white font-medium"
                    >
                      <option value="full">Cả ngày</option>
                      <option value="morning">Buổi sáng</option>
                      <option value="afternoon">Buổi chiều</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Đến hết ngày (*)</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="flex-1 text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white font-medium"
                    />
                    <select
                      value={formData.endSession}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endSession: e.target.value as LeaveSession }))
                      }
                      className="text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white font-medium"
                    >
                      <option value="full">Cả ngày</option>
                      <option value="morning">Buổi sáng</option>
                      <option value="afternoon">Buổi chiều</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-100/60 rounded-xl text-xs text-blue-900 border border-blue-200">
                <span className="font-semibold">
                  Tổng thời gian xin nghỉ: <span className="text-base font-black text-blue-900">{calculatedDays} ngày</span>
                </span>
                <span className="text-[11px] text-blue-700">
                  (Từ ngày {formData.startDate} đến ngày {formData.endDate})
                </span>
              </div>
            </div>

            {/* 3. Reason Section (Focus of the user's prompt) */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                3. Lý do xin nghỉ phép (*)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lý do xin nghỉ cụ thể (Trình Lãnh đạo xem xét) (*)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết lý do xin nghỉ để Ban Giám hiệu xem xét và duyệt..."
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-3 bg-white leading-relaxed font-medium text-slate-900"
                />

                {/* Quick reason suggestions */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Gợi ý lý do phổ biến (nhấp để chọn nhanh):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {reasonSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, reason: suggestion }))}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 transition cursor-pointer"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Handover & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Người dạy thay / Nhận bàn giao công việc (nếu có)
                  </label>
                  <select
                    value={formData.handoverStaffId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, handoverStaffId: e.target.value }))}
                    className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white font-medium text-slate-800"
                  >
                    <option value="">-- [Tùy chọn: Chọn người dạy thay / bàn giao] --</option>
                    {deptColleagues.map((colleague) => (
                      <option key={colleague.id} value={colleague.id}>
                        {colleague.name} ({colleague.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa chỉ lưu trú / Nơi nghỉ trong thời gian phép
                  </label>
                  <input
                    type="text"
                    placeholder="Tại nơi cư trú (hoặc ghi rõ địa chỉ nếu đi xa)..."
                    value={formData.addressDuringLeave}
                    onChange={(e) => setFormData((prev) => ({ ...prev, addressDuringLeave: e.target.value }))}
                    className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSubTab('approvals')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer text-center"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleSubmitNewRequest(e, true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Gửi & In Đơn Ngay
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  Gửi Đơn Trình Phê Duyệt
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB 3: ĐƠN CỦA TÔI ==================== */}
      {activeSubTab === 'my_requests' && (
        <div className="space-y-6">
          {/* Personal Quota */}
          {currentStaff && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-lg">
                    {currentStaff.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {currentStaff.name} ({currentStaff.code})
                    </h2>
                    <p className="text-xs text-slate-500">
                      {currentStaff.position} • {currentStaff.department}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('new_request')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs shadow-xs hover:bg-blue-800 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  Tạo Đơn Mới
                </button>
              </div>

              {/* My list */}
              <div className="mt-4 divide-y divide-slate-100">
                {myRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Bạn chưa gửi đơn xin nghỉ phép nào trong năm học {schoolYear}.
                  </div>
                ) : (
                  myRequests.map((req) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {req.code}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{req.leaveTypeLabel}</span>
                          <span className="text-xs text-slate-500">
                            ({req.totalDays} ngày: {req.startDate} ➔ {req.endDate})
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <strong>Lý do:</strong> {req.reason}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStatusBadge(req.status)}
                        <button
                          onClick={() => setSelectedRequestForPrint(req)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          title="In đơn"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSingleDeleteTarget(req)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="Xóa đơn này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: THỐNG KÊ QUỸ PHÉP ==================== */}
      {activeSubTab === 'summary_quota' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Thống Kê Quỹ Phép Toàn Trường Năm Học {schoolYear}
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi hạn mức 12 ngày phép năm và số ngày nghỉ thực tế của CBGVNV
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Xuất File Báo Cáo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-900 text-white font-bold">
                <tr>
                  <th className="py-3 px-3 text-center">STT</th>
                  <th className="py-3 px-3">Họ và Tên</th>
                  <th className="py-3 px-3">Mã CB</th>
                  <th className="py-3 px-3">Tổ / Bộ Phận</th>
                  <th className="py-3 px-3 text-center">Hạn Mức Phép</th>
                  <th className="py-3 px-3 text-center">Đã Nghỉ</th>
                  <th className="py-3 px-3 text-center">Còn Lại</th>
                  <th className="py-3 px-3 text-center">Việc Riêng</th>
                  <th className="py-3 px-3 text-center">Ốm BHXH</th>
                  <th className="py-3 px-3 text-center">Tổng Số Đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {staffList.map((staff, idx) => {
                  const quota = getStaffLeaveQuota(staff.id, 2026);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {staff.name}
                        <div className="text-[10px] font-normal text-slate-500">{staff.position}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{staff.code}</td>
                      <td className="py-2.5 px-3">{staff.department}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-900">
                        {quota.totalAnnualQuota}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                        {quota.usedAnnualDays}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {quota.remainingAnnualDays}
                      </td>
                      <td className="py-2.5 px-3 text-center">{quota.usedPaidPersonalDays}</td>
                      <td className="py-2.5 px-3 text-center text-rose-700">{quota.usedSickDays}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{quota.totalLeavesCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODAL XÁC NHẬN XÓA TOÀN BỘ DANH SÁCH ==================== */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Xác nhận xóa toàn bộ danh sách đơn nghỉ?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hành động này sẽ xóa sạch <strong className="text-rose-700">{leaveRequestsList.length} đơn xin nghỉ phép</strong> và lý do nghỉ trên toàn hệ thống dữ liệu (bao gồm cả Firestore và bộ nhớ máy).
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Lưu ý:
              </div>
              <div>Bạn có thể khôi phục lại dữ liệu mẫu ban đầu sau khi xóa nếu cần kiểm thử.</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xác nhận xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL XÁC NHẬN XÓA CÁC ĐƠN ĐÃ CHỌN ==================== */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Xóa {selectedIds.length} đơn xin nghỉ đã chọn?
              </h3>
              <p className="text-xs text-slate-600">
                Các đơn được chọn sẽ bị xóa vĩnh viễn khỏi danh sách và cơ sở dữ liệu.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xóa {selectedIds.length} đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL XÁC NHẬN XÓA 1 ĐƠN CỤ THỂ ==================== */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Xác nhận xóa đơn xin nghỉ
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc muốn xóa đơn xin nghỉ mã <strong>{singleDeleteTarget.code}</strong> của{' '}
              <strong>{singleDeleteTarget.staffName}</strong> ({singleDeleteTarget.totalDays} ngày nghỉ: {singleDeleteTarget.reason})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSingleDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Xóa đơn này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL XUẤT BẢNG TRÌNH LÃNH ĐẠO PHÊ DUYỆT (PRINT / PDF) ==================== */}
      {showExportTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-900" />
                  Bản In Chuẩn: Bảng Tổng Hợp Đơn Xin Nghỉ Phép Trình Ban Giám Hiệu Phê Duyệt
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Văn bản hành chính chuẩn trình Hiệu trưởng / Lãnh đạo nhà trường ký duyệt danh sách nghỉ phép
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  In Bảng Trình Ký (Print/PDF)
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Tải Excel
                </button>
                <button
                  onClick={() => setShowExportTableModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Official Administrative Document Content */}
            <div className="p-6 sm:p-8 border border-slate-300 rounded-xl bg-white text-slate-900 font-serif leading-relaxed space-y-5 print:border-none print:p-0">
              {/* National Header */}
              <div className="grid grid-cols-2 text-center pb-3 border-b border-slate-300">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs uppercase">{schoolConfig.department}</div>
                  <div className="font-black text-sm uppercase">{schoolConfig.fullName}</div>
                  <div className="text-[11px] italic">Số: ...... /TTr-THPTPX</div>
                </div>

                <div className="space-y-0.5">
                  <div className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-bold text-xs underline decoration-1 underline-offset-2">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="text-[11px] italic pt-1">
                    Phương Xá, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center pt-2 space-y-1">
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                  BẢNG TỔNG HỢP & ĐỀ NGHỊ PHÊ DUYỆT ĐƠN XIN NGHỈ PHÉP
                </h2>
                <div className="text-xs italic">
                  (Căn cứ quy chế chuyên môn & quản lý CBGVNV năm học {schoolYear})
                </div>
              </div>

              {/* Recipient */}
              <div className="text-xs space-y-1 pt-1 font-bold text-center">
                Kính gửi: BAN GIÁM HIỆU - HIỆU TRƯỞNG {schoolConfig.fullName.toUpperCase()}
              </div>

              {/* Summary Table */}
              <div className="pt-2">
                <table className="w-full text-[11px] border border-slate-400 text-center border-collapse">
                  <thead className="bg-slate-100 font-bold border-b border-slate-400">
                    <tr>
                      <th className="p-2 border-r border-slate-400 w-8">STT</th>
                      <th className="p-2 border-r border-slate-400 w-20">Mã CB</th>
                      <th className="p-2 border-r border-slate-400 text-left">Họ và Tên</th>
                      <th className="p-2 border-r border-slate-400 text-left">Tổ / Bộ Phận</th>
                      <th className="p-2 border-r border-slate-400">Loại Nghỉ</th>
                      <th className="p-2 border-r border-slate-400">Thời Gian</th>
                      <th className="p-2 border-r border-slate-400 w-12">Số Ngày</th>
                      <th className="p-2 border-r border-slate-400 text-left min-w-[160px]">Lý Do Xin Nghỉ</th>
                      <th className="p-2 border-r border-slate-400 text-left">Người Dạy/Làm Thay</th>
                      <th className="p-2">Ý Kiến Phê Duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(selectedIds.length > 0
                      ? leaveRequestsList.filter((r) => selectedIds.includes(r.id))
                      : filteredRequests
                    ).map((req, idx) => (
                      <tr key={req.id} className="align-top">
                        <td className="p-2 border-r border-slate-300">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono font-bold">{req.staffCode}</td>
                        <td className="p-2 border-r border-slate-300 text-left font-bold">{req.staffName}</td>
                        <td className="p-2 border-r border-slate-300 text-left">{req.department}</td>
                        <td className="p-2 border-r border-slate-300">{req.leaveTypeLabel}</td>
                        <td className="p-2 border-r border-slate-300">
                          {req.startDate} ➔ {req.endDate}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-bold">{req.totalDays}</td>
                        <td className="p-2 border-r border-slate-300 text-left leading-snug">
                          {req.reason}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-left">
                          {req.handoverStaffName || 'Theo quy chế'}
                        </td>
                        <td className="p-2 font-bold text-slate-800">
                          {req.status === 'approved' ? (
                            <span className="text-emerald-800">Đã đồng ý</span>
                          ) : req.status === 'rejected' ? (
                            <span className="text-rose-800">Không đồng ý</span>
                          ) : (
                            <span className="text-slate-400 italic font-normal">Trình ký...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Section */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="font-bold uppercase">NGƯỜI LẬP BẢNG</div>
                  <div className="text-[10px] italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-20 flex items-center justify-center font-bold text-slate-800">
                    {currentUser?.name || 'Tổ Văn phòng'}
                  </div>
                </div>

                <div>
                  <div className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN / VP</div>
                  <div className="text-[10px] italic">(Ký xác nhận)</div>
                  <div className="h-20 flex items-center justify-center font-bold text-slate-800">
                    (Đã duyệt cấp tổ)
                  </div>
                </div>

                <div>
                  <div className="text-[10px] italic">..., ngày ... tháng ... năm {new Date().getFullYear()}</div>
                  <div className="font-bold uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</div>
                  <div className="text-[10px] italic">(Ký tên và đóng dấu)</div>
                  <div className="h-20 flex items-center justify-center font-bold text-blue-950">
                    {isBgh ? `ĐÃ PHÊ DUYỆT - ${currentUser?.name || ''}` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINT INDIVIDUAL FORM MODAL ==================== */}
      {selectedRequestForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-900" />
                Đơn Xin Nghỉ Phép Cá Nhân – {selectedRequestForPrint.staffName}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer"
                >
                  In Ngay (Print)
                </button>
                <button
                  onClick={() => setSelectedRequestForPrint(null)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="p-6 border border-slate-300 rounded-xl bg-white text-slate-900 font-serif leading-relaxed space-y-4 print:border-none print:p-0">
              <div className="text-center space-y-1 pb-2 border-b border-slate-300">
                <div className="font-bold text-xs uppercase">{schoolConfig.department}</div>
                <div className="font-bold text-sm uppercase">{schoolConfig.fullName}</div>
                <div className="pt-1 font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-xs underline">Độc lập - Tự do - Hạnh phúc</div>
              </div>

              <div className="text-center pt-2 space-y-0.5">
                <h2 className="text-base font-bold uppercase tracking-wide">ĐƠN XIN NGHỈ PHÉP</h2>
                <div className="text-xs italic">(Năm học {schoolYear})</div>
              </div>

              <div className="text-xs space-y-1 pt-1">
                <div className="font-bold">Kính gửi: - Ban Giám hiệu {schoolConfig.fullName}</div>
                <div className="font-bold pl-12">- Tổ trưởng / Phụ trách {selectedRequestForPrint.department}</div>
              </div>

              <div className="text-xs space-y-2 pt-1 leading-relaxed">
                <div>
                  Tôi tên là: <strong>{selectedRequestForPrint.staffName}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Mã số: <strong>{selectedRequestForPrint.staffCode}</strong>
                </div>
                <div>Chức vụ / Đơn vị: <strong>{selectedRequestForPrint.position}</strong> • <strong>{selectedRequestForPrint.department}</strong></div>
                <div>Số điện thoại liên hệ: <strong>{selectedRequestForPrint.phone}</strong></div>
                <div>Nay tôi làm đơn này kính xin Ban Giám hiệu và Tổ trưởng cho phép tôi được nghỉ phép:</div>
                <div className="pl-4 font-semibold text-blue-900">- Loại hình nghỉ: {selectedRequestForPrint.leaveTypeLabel}</div>
                <div className="pl-4">
                  - Thời gian: Từ ngày <strong>{selectedRequestForPrint.startDate}</strong> đến hết ngày{' '}
                  <strong>{selectedRequestForPrint.endDate}</strong> (Tổng cộng: <strong>{selectedRequestForPrint.totalDays} ngày</strong>)
                </div>
                <div className="pl-4 bg-slate-50 p-2 rounded border border-slate-200">
                  - <strong>Lý do xin nghỉ:</strong> {selectedRequestForPrint.reason}
                </div>
                <div className="pl-4">- Nơi nghỉ trong thời gian phép: {selectedRequestForPrint.addressDuringLeave || 'Tại nơi cư trú'}</div>
                {selectedRequestForPrint.handoverStaffName && (
                  <div className="pl-4">- Người nhận bàn giao công việc / dạy thay: <strong>{selectedRequestForPrint.handoverStaffName}</strong></div>
                )}
                <div className="pt-1 italic">
                  Tôi cam đoan thực hiện đầy đủ việc bàn giao công việc và trở lại công tác đúng thời hạn quy định. Kính mong Ban Giám hiệu và Tổ trưởng xem xét phê duyệt.
                </div>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="font-bold">Ý KIẾN TỔ TRƯỞNG</div>
                  <div className="text-[10px] italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-center justify-center font-bold text-emerald-800">
                    {selectedRequestForPrint.deptReviewerName ? `Đã duyệt: ${selectedRequestForPrint.deptReviewerName}` : ''}
                  </div>
                </div>

                <div>
                  <div className="font-bold">NGƯỜI DẠY / LÀM THAY</div>
                  <div className="text-[10px] italic">(Ký xác nhận)</div>
                  <div className="h-16 flex items-center justify-center font-bold text-blue-900">
                    {selectedRequestForPrint.handoverStaffName || ''}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] italic">..., ngày ... tháng ... năm {new Date().getFullYear()}</div>
                  <div className="font-bold">NGƯỜI LÀM ĐƠN</div>
                  <div className="text-[10px] italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-center justify-center font-bold text-slate-900">
                    {selectedRequestForPrint.staffName}
                  </div>
                </div>
              </div>

              <div className="pt-3 text-center text-xs border-t border-slate-300">
                <div className="font-bold uppercase">BAN GIÁM HIỆU PHÊ DUYỆT</div>
                <div className="text-[10px] italic">(Hiệu trưởng / Phó Hiệu trưởng ký và ghi rõ họ tên)</div>
                <div className="h-16 flex items-center justify-center font-bold text-emerald-900">
                  {selectedRequestForPrint.bghReviewerName ? `ĐÃ PHÊ DUYỆT - ${selectedRequestForPrint.bghReviewerName}` : '(Chờ phê duyệt)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== APPROVE WITH NOTE MODAL ==================== */}
      {approveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Phê Duyệt Đơn Xin Nghỉ Phép
            </h3>
            <p className="text-xs text-slate-600">
              Đơn của: <strong>{approveModalData.request.staffName}</strong> ({approveModalData.request.staffCode})<br />
              Lý do xin nghỉ: <em>"{approveModalData.request.reason}"</em>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ý kiến chỉ đạo / Ghi chú của Lãnh đạo
              </label>
              <textarea
                rows={3}
                value={approveNoteInput}
                onChange={(e) => setApproveNoteInput(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 p-2.5 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApproveModalData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  await approveLeaveRequest(
                    approveModalData.request.id,
                    approveModalData.reviewerRole,
                    approveNoteInput.trim()
                  );
                  showToast('Đã phê duyệt đơn thành công!', 'success');
                  setApproveModalData(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-xs cursor-pointer"
              >
                Xác nhận phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REJECT MODAL ==================== */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Từ chối phê duyệt đơn xin nghỉ
            </h3>
            <p className="text-xs text-slate-600">
              Đơn của: <strong>{rejectModalData.request.staffName}</strong> ({rejectModalData.request.code}).
            </p>

            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối (ví dụ: Trùng lịch thi khảo sát chất lượng, chưa bàn giao công việc...)"
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="w-full text-xs rounded-lg border-slate-300 p-2.5 focus:border-rose-500 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!rejectReasonInput.trim()) {
                    showToast('Vui lòng nhập lý do từ chối!', 'error');
                    return;
                  }
                  await rejectLeaveRequest(
                    rejectModalData.request.id,
                    rejectModalData.reviewerRole,
                    rejectReasonInput.trim()
                  );
                  showToast('Đã từ chối đơn xin nghỉ!', 'info');
                  setRejectModalData(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      {selectedRequestForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedRequestForDetail.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Chi Tiết Đơn Xin Nghỉ Phép – {selectedRequestForDetail.staffName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Người làm đơn:</span>
                  <div className="font-bold text-slate-900">
                    {selectedRequestForDetail.staffName} ({selectedRequestForDetail.staffCode})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Chức vụ & Đơn vị:</span>
                  <div className="font-bold text-slate-900">
                    {selectedRequestForDetail.position} • {selectedRequestForDetail.department}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Loại hình phép:</span>
                  <div className="font-bold text-blue-900">{selectedRequestForDetail.leaveTypeLabel}</div>
                </div>
                <div>
                  <span className="text-slate-500">Thời gian nghỉ:</span>
                  <div className="font-bold text-slate-900">
                    {selectedRequestForDetail.startDate} ➔ {selectedRequestForDetail.endDate} (
                    {selectedRequestForDetail.totalDays} ngày)
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold">Lý do xin nghỉ:</span>
                <div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  {selectedRequestForDetail.reason}
                </div>
              </div>

              {selectedRequestForDetail.handoverStaffName && (
                <div>
                  <span className="text-slate-500 font-semibold">Người nhận bàn giao / dạy thay:</span>
                  <div className="mt-1 p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 text-slate-800 font-medium">
                    {selectedRequestForDetail.handoverStaffName}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Nhật ký phê duyệt:</div>
                {selectedRequestForDetail.deptReviewedAt && (
                  <div className="text-[11px] text-emerald-800">
                    ✓ Tổ trưởng ({selectedRequestForDetail.deptReviewerName}) đã duyệt lúc{' '}
                    {selectedRequestForDetail.deptReviewedAt}: {selectedRequestForDetail.deptReviewNote}
                  </div>
                )}
                {selectedRequestForDetail.bghReviewedAt && (
                  <div className="text-[11px] text-emerald-800">
                    ✓ Ban Giám hiệu ({selectedRequestForDetail.bghReviewerName}) đã duyệt lúc{' '}
                    {selectedRequestForDetail.bghReviewedAt}: {selectedRequestForDetail.bghReviewNote}
                  </div>
                )}
                {selectedRequestForDetail.rejectionReason && (
                  <div className="text-[11px] text-rose-800">
                    ✗ Bị từ chối: {selectedRequestForDetail.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedRequestForPrint(selectedRequestForDetail);
                  setSelectedRequestForDetail(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                In Đơn Xin Nghỉ Phép
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
