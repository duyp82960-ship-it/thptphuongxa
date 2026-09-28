import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useKpi } from '../context/KpiContext';
import { PersonType, TeacherKpiEvaluation, StaffMember, EvaluationPeriod, getDepartmentId, CANONICAL_DEPARTMENTS } from '../types';
import {
  isCbqlStaff,
  isCbqlEvaluation,
  getCbqlCategory,
  getCbqlCategoryBadge,
  isBghLeader,
  isTtcmOrTpcm,
  COUNCIL_EVALUATOR_INFO,
  getBghEvaluatorCandidates,
  validateCbqlEvaluator,
} from '../utils/cbqlUtils';
import { getEvaluationPeriodLabel } from '../utils/periodUtils';
import {
  detectStaffPositionKey,
  OFFICIAL_STAFF_POSITIONS,
  getOfficialStaffCriteria,
} from '../data/kpiEvaluationTemplates';
import {
  X,
  PlusCircle,
  Search,
  Users,
  Calendar,
  UserCheck,
  Award,
  AlertTriangle,
  Check,
  ShieldCheck,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface CreateKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: PersonType; // 'bgh' | 'giaovien' | 'nhanvien'
  onSuccess?: () => void;
  initialSelectedStaffId?: string;
  initialPeriod?: EvaluationPeriod;
}

export const CreateKpiModal: React.FC<CreateKpiModalProps> = ({
  isOpen,
  onClose,
  targetType,
  onSuccess,
  initialSelectedStaffId,
  initialPeriod,
}) => {
  const {
    staffList,
    evaluationsList,
    saveEvaluation,
    schoolYear,
    month: currentMonth,
    showToast,
    users,
  } = useKpi();

  // Search & Filter state in form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [cbqlRoleFilter, setCbqlRoleFilter] = useState<'all' | 'bgh' | 'totruong' | 'topho'>('all');

  // Selected Personnel IDs
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Period Selection: 'ki1' (Kì I), 'ki2' (Kì II), 'canam' (Cả năm), 'thang' (Theo tháng)
  const [evalPeriod, setEvalPeriod] = useState<EvaluationPeriod>('ki1');
  const [evalMonth, setEvalMonth] = useState<number>(currentMonth || 9);
  const [evalYear, setEvalYear] = useState<number>(2026);

  // Evaluator Selection State
  const [selectedTtcmId, setSelectedTtcmId] = useState<string>('');
  const [deptTtcmMap, setDeptTtcmMap] = useState<Record<string, string>>({});
  const [selectedBghId, setSelectedBghId] = useState<string>('');

  // Track previous CBQL selection category to automatically adapt and reset evaluator dropdown
  const prevCbqlSelectionType = useRef<'NONE' | 'BGH' | 'TTCM' | 'MIXED'>('NONE');

  // Error message state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter staff by targetType (For BGH, include Ban Giám hiệu, Tổ trưởng, and Tổ phó chuyên môn)
  const eligibleStaff = useMemo(() => {
    if (targetType === 'bgh') {
      return staffList.filter((s) => isCbqlStaff(s));
    }
    if (targetType === 'nhanvien') {
      return staffList.filter(
        (s) =>
          s.type === 'nhanvien' ||
          s.employee_type === 'NHAN_VIEN' ||
          getDepartmentId(s.department_id || s.department, s.type) === 'to-van-phong'
      );
    }
    // targetType === 'giaovien'
    return staffList.filter(
      (s) =>
        (s.type === 'giaovien' || s.employee_type === 'GIAO_VIEN') &&
        s.type !== 'nhanvien' &&
        s.employee_type !== 'NHAN_VIEN' &&
        getDepartmentId(s.department_id || s.department, s.type) !== 'to-van-phong'
    );
  }, [staffList, targetType]);

  // Selected staff objects and their unique departments
  const selectedStaffMembers = useMemo(() => {
    return staffList.filter((s) => selectedStaffIds.includes(s.id));
  }, [staffList, selectedStaffIds]);

  const selectedDepartments = useMemo(() => {
    return Array.from(new Set(selectedStaffMembers.map((s) => s.department)));
  }, [selectedStaffMembers]);

  // BGH Candidates List (Only Leadership: Hiệu trưởng & Phó Hiệu trưởng)
  const bghCandidates = useMemo(() => {
    return getBghEvaluatorCandidates(staffList);
  }, [staffList]);

  // Determine role category of selected staff for CBQL module
  const cbqlSelectionCategory = useMemo(() => {
    if (targetType !== 'bgh' || selectedStaffMembers.length === 0) return 'NONE';
    const hasBgh = selectedStaffMembers.some((s) => isBghLeader(s));
    const hasTtcm = selectedStaffMembers.some((s) => isTtcmOrTpcm(s) || !isBghLeader(s));
    if (hasBgh && hasTtcm) return 'MIXED';
    if (hasBgh) return 'BGH';
    if (hasTtcm) return 'TTCM';
    return 'NONE';
  }, [targetType, selectedStaffMembers]);

  // Automatic routing & reset of evaluator when CBQL target changes
  useEffect(() => {
    if (targetType === 'bgh') {
      if (cbqlSelectionCategory === 'BGH') {
        // If selection switched to BGH leadership (Hiệu trưởng / Phó HT) -> auto select Council
        setSelectedBghId(COUNCIL_EVALUATOR_INFO.id);
        setErrorMessage(null);
      } else if (cbqlSelectionCategory === 'TTCM') {
        // If selection switched from BGH (Council) to TTCM -> reset Council value, forcing user to pick a valid BGH member
        if (selectedBghId === COUNCIL_EVALUATOR_INFO.id || prevCbqlSelectionType.current === 'BGH') {
          setSelectedBghId('');
        }
        setErrorMessage(null);
      }
      prevCbqlSelectionType.current = cbqlSelectionCategory;
    }
  }, [targetType, cbqlSelectionCategory, selectedBghId]);

  // Sync initialSelectedStaffId and initialPeriod when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedStaffId) {
        setSelectedStaffIds([initialSelectedStaffId]);
        const initStaff = staffList.find((s) => s.id === initialSelectedStaffId);
        if (targetType === 'bgh' && initStaff) {
          if (isBghLeader(initStaff)) {
            setSelectedBghId(COUNCIL_EVALUATOR_INFO.id);
          } else {
            setSelectedBghId('');
          }
        }
      } else {
        setSelectedStaffIds([]);
        setSelectedBghId('');
      }
      if (initialPeriod) {
        setEvalPeriod(initialPeriod);
      }
      setSelectedTtcmId('');
      setDeptTtcmMap({});
      setErrorMessage(null);
    }
  }, [isOpen, initialSelectedStaffId, initialPeriod, targetType, staffList]);

  // Helper to get TTCM Candidates for a specific department (For regular teachers module)
  const getTtcmCandidatesForDept = (deptName?: string) => {
    const deptStaff = staffList.filter((s) => s.department === deptName);
    const sortedDeptStaff = [...deptStaff].sort((a, b) => {
      const aIsTt = a.position.toLowerCase().includes('tổ trưởng') || a.position.toLowerCase().includes('ttcm');
      const bIsTt = b.position.toLowerCase().includes('tổ trưởng') || b.position.toLowerCase().includes('ttcm');
      if (aIsTt && !bIsTt) return -1;
      if (!aIsTt && bIsTt) return 1;
      return 0;
    });

    const otherTtcmStaff = staffList.filter(
      (s) =>
        s.department !== deptName &&
        (s.position.toLowerCase().includes('tổ trưởng') || s.position.toLowerCase().includes('ttcm'))
    );

    const combined = [...sortedDeptStaff, ...otherTtcmStaff];
    const uniqueMap = new Map<string, StaffMember>();
    combined.forEach((s) => uniqueMap.set(s.id, s));
    return Array.from(uniqueMap.values());
  };

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    if (targetType === 'nhanvien') {
      return ['Tổ Văn phòng'];
    }
    if (targetType === 'giaovien') {
      return [
        'Tổ Hóa - Sinh - CN',
        'Tổ Sử - Địa - KT&PL - TD - QPAN',
        'Tổ Văn - Ngoại ngữ',
        'Tổ Toán - Lí - Tin',
      ];
    }
    return Array.from(new Set(eligibleStaff.map((s) => s.department)));
  }, [eligibleStaff, targetType]);

  // Filtered staff based on search, department & CBQL role
  const filteredStaff = useMemo(() => {
    return eligibleStaff.filter((s) => {
      if (targetType === 'bgh' && cbqlRoleFilter !== 'all') {
        const cat = getCbqlCategory(s);
        if (cat !== cbqlRoleFilter) return false;
      }

      const matchSearch =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        s.position.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchDept =
        selectedDeptFilter === 'all' ||
        s.department === selectedDeptFilter ||
        getDepartmentId(s.department_id || s.department, s.type) === getDepartmentId(selectedDeptFilter);

      return matchSearch && matchDept;
    });
  }, [eligibleStaff, searchQuery, selectedDeptFilter, cbqlRoleFilter, targetType]);

  // Toggle single staff selection
  const handleToggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setErrorMessage(null);
  };

  // Toggle Select All filtered staff
  const handleToggleSelectAll = () => {
    const filteredIds = filteredStaff.map((s) => s.id);
    const allSelected = filteredIds.every((id) => selectedStaffIds.includes(id));

    if (allSelected) {
      setSelectedStaffIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
    setErrorMessage(null);
  };

  // Target criteria set description label
  const criteriaSetTitle = useMemo(() => {
    switch (targetType) {
      case 'bgh':
        return 'Bộ tiêu chí Đánh giá KPI Cán bộ Quản lý (Khung 100 điểm)';
      case 'giaovien':
        return 'Bộ tiêu chí Đánh giá KPI Giáo viên Giảng dạy (Khung 100 điểm)';
      case 'nhanvien':
        return 'Bộ tiêu chí Đánh giá KPI Nhân viên (30đ KPI chung + 70đ Vị trí việc làm)';
      default:
        return 'Bộ tiêu chí KPI chuẩn THPT Phương Xá';
    }
  }, [targetType]);

  const targetCategoryTitle = useMemo(() => {
    switch (targetType) {
      case 'bgh':
        return 'CÁN BỘ QUẢN LÝ';
      case 'giaovien':
        return 'GIÁO VIÊN';
      case 'nhanvien':
        return 'NHÂN VIÊN VĂN PHÒNG';
    }
  }, [targetType]);

  if (!isOpen) return null;

  // Handle Form Submission with strict validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate selection count
    if (selectedStaffIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 01 đối tượng để tạo phiếu KPI!');
      return;
    }

    // 2. Validate Evaluator for non-CBQL (Giáo viên / Nhân viên)
    if (targetType !== 'bgh') {
      if (selectedDepartments.length <= 1) {
        if (!selectedTtcmId) {
          setErrorMessage('Vui lòng chọn Tổ trưởng chuyên môn (C1. TTCM) chấm điểm!');
          return;
        }
      } else {
        const missingDepts = selectedDepartments.filter((d) => !deptTtcmMap[d]);
        if (missingDepts.length > 0) {
          setErrorMessage(`Vui lòng chọn TTCM cho các tổ: ${missingDepts.join(', ')}`);
          return;
        }
      }

      if (!selectedBghId) {
        setErrorMessage('Vui lòng chọn Cán bộ quản lý (C2. Hiệu trưởng / Phó Hiệu trưởng) đánh giá/duyệt!');
        return;
      }
    }

    // 3. Strict Evaluator Validation for CBQL module
    if (targetType === 'bgh') {
      const hasTtcmStaff = selectedStaffMembers.some((s) => isTtcmOrTpcm(s) || !isBghLeader(s));
      const hasBghStaff = selectedStaffMembers.some((s) => isBghLeader(s));

      if (hasTtcmStaff) {
        if (!selectedBghId || selectedBghId === COUNCIL_EVALUATOR_INFO.id) {
          setErrorMessage('Đối tượng TTCM/TPCM chỉ được đánh giá bởi Hiệu trưởng hoặc Phó Hiệu trưởng.');
          return;
        }
        const bghStaff = staffList.find((s) => s.id === selectedBghId);
        if (!bghStaff || !isBghLeader(bghStaff)) {
          setErrorMessage('Đối tượng TTCM/TPCM chỉ được đánh giá bởi Hiệu trưởng hoặc Phó Hiệu trưởng.');
          return;
        }
      }

      if (hasBghStaff && cbqlSelectionCategory === 'BGH') {
        if (selectedBghId !== COUNCIL_EVALUATOR_INFO.id) {
          setErrorMessage('Hiệu trưởng/Phó Hiệu trưởng phải được đánh giá bởi Hội đồng Thi đua – Khen thưởng.');
          return;
        }
      }
    }

    const periodDisplay =
      evalPeriod === 'ki1'
        ? 'Kì I'
        : evalPeriod === 'ki2'
        ? 'Kì II'
        : evalPeriod === 'canam'
        ? 'Cả năm'
        : `Tháng ${String(evalMonth).padStart(2, '0')}/${evalYear}`;

    // 4. Duplicate check logic
    const duplicateStaffList: StaffMember[] = [];
    const createEligibleStaffList: StaffMember[] = [];

    selectedStaffIds.forEach((id) => {
      const staffMember = staffList.find((s) => s.id === id);
      if (!staffMember) return;

      const existing = evaluationsList.find((e) => {
        if (e.staffId !== id) return false;
        if (targetType === 'bgh') {
          if (!isCbqlEvaluation(e, staffList) && e.targetType !== 'bgh') return false;
        } else if (e.targetType && e.targetType !== targetType) {
          return false;
        }

        if (evalPeriod === 'ki1') {
          return (
            (e.evaluationPeriod === 'ki1' || (!e.evaluationPeriod && e.semester === 1 && !e.month)) &&
            (e.schoolYear === schoolYear || e.year === evalYear)
          );
        }
        if (evalPeriod === 'ki2') {
          return (
            (e.evaluationPeriod === 'ki2' || (!e.evaluationPeriod && e.semester === 2 && !e.month)) &&
            (e.schoolYear === schoolYear || e.year === evalYear)
          );
        }
        if (evalPeriod === 'canam') {
          return (
            (e.evaluationPeriod === 'canam' || (e.periodName && e.periodName.toLowerCase().includes('cả năm'))) &&
            (e.schoolYear === schoolYear || e.year === evalYear)
          );
        }
        return (
          e.month === evalMonth &&
          (e.year === evalYear || e.schoolYear.includes(String(evalYear)))
        );
      });

      if (existing) {
        duplicateStaffList.push(staffMember);
      } else {
        createEligibleStaffList.push(staffMember);
      }
    });

    if (selectedStaffIds.length === 1 && duplicateStaffList.length === 1) {
      setErrorMessage(`Đã tồn tại phiếu KPI của cán bộ này trong kỳ đánh giá "${periodDisplay}".`);
      return;
    }

    if (createEligibleStaffList.length === 0) {
      setErrorMessage(`Tất cả đối tượng đã chọn đều đã có phiếu KPI trong kỳ đánh giá "${periodDisplay}".`);
      return;
    }

    // 5. Create KPI Evaluations for non-duplicates
    createEligibleStaffList.forEach((staff) => {
      const isTargetBghLeader = isBghLeader(staff);
      const isTargetTtcm = isTtcmOrTpcm(staff) || (!isTargetBghLeader && targetType === 'bgh');

      let evalObj: Partial<TeacherKpiEvaluation> = {};

      if (targetType === 'bgh') {
        if (isTargetBghLeader) {
          // Rule 2 & 3: Hiệu trưởng / Phó Hiệu trưởng -> COUNCIL
          evalObj = {
            evaluatorId: COUNCIL_EVALUATOR_INFO.id,
            evaluator_id: COUNCIL_EVALUATOR_INFO.id,
            evaluatorType: 'COUNCIL',
            evaluator_type: 'COUNCIL',
            evaluatorName: COUNCIL_EVALUATOR_INFO.name,
            evaluator_name: COUNCIL_EVALUATOR_INFO.name,
            evaluatorRole: COUNCIL_EVALUATOR_INFO.role,
            evaluator_role: COUNCIL_EVALUATOR_INFO.role,
            evaluationLevel: 'CAP_HOI_DONG',
            evaluation_level: 'CAP_HOI_DONG',
            bghEvaluatorId: COUNCIL_EVALUATOR_INFO.id,
            bghEvaluatorName: COUNCIL_EVALUATOR_INFO.name,
            bghEvaluatorRole: COUNCIL_EVALUATOR_INFO.role,
            bgh_evaluator_id: COUNCIL_EVALUATOR_INFO.id,
            bgh_evaluator_name: COUNCIL_EVALUATOR_INFO.name,
            bgh_evaluator_role: COUNCIL_EVALUATOR_INFO.role,
          };
        } else {
          // Rule 1: TTCM / TPCM -> BGH (Hiệu trưởng / Phó Hiệu trưởng)
          const bghStaff = staffList.find((s) => s.id === selectedBghId);
          const bghName = bghStaff?.name || 'Hiệu trưởng / Phó Hiệu trưởng';
          const bghRole = bghStaff?.position || 'Ban Giám hiệu';

          evalObj = {
            evaluatorId: bghStaff?.id || '',
            evaluator_id: bghStaff?.id || '',
            evaluatorType: 'BGH',
            evaluator_type: 'BGH',
            evaluatorName: bghName,
            evaluator_name: bghName,
            evaluatorRole: bghRole,
            evaluator_role: bghRole,
            evaluationLevel: 'CAP_BGH',
            evaluation_level: 'CAP_BGH',
            bghEvaluatorId: bghStaff?.id || '',
            bghEvaluatorName: bghName,
            bghEvaluatorRole: bghRole,
            bgh_evaluator_id: bghStaff?.id || '',
            bgh_evaluator_name: bghName,
            bgh_evaluator_role: bghRole,
          };
        }
      } else {
        // Regular Teacher / Staff
        const teacherDept = staff.department;
        const ttcmId = selectedDepartments.length > 1 ? deptTtcmMap[teacherDept] : selectedTtcmId;
        const ttcmStaff = staffList.find((s) => s.id === ttcmId);
        const bghStaff = staffList.find((s) => s.id === selectedBghId);

        const ttcmName = ttcmStaff?.name || '';
        const bghName = bghStaff?.name || '';

        evalObj = {
          evaluatorId: bghStaff?.id || ttcmStaff?.id || '',
          evaluator_id: bghStaff?.id || ttcmStaff?.id || '',
          evaluatorType: 'BGH',
          evaluator_type: 'BGH',
          evaluatorName: `${ttcmName || 'TTCM'} / ${bghName || 'BGH'}`,
          evaluator_name: `${ttcmName || 'TTCM'} / ${bghName || 'BGH'}`,
          evaluationLevel: 'CAP_BGH',
          evaluation_level: 'CAP_BGH',
          ttcmEvaluatorId: ttcmStaff?.id || '',
          ttcmEvaluatorName: ttcmName,
          ttcmEvaluatorRole: ttcmStaff?.position || 'Tổ trưởng chuyên môn',
          ttcmEvaluatorDepartment: ttcmStaff?.department || staff.department,
          bghEvaluatorId: bghStaff?.id || '',
          bghEvaluatorName: bghName,
          bghEvaluatorRole: bghStaff?.position || 'Ban Giám hiệu',
          ttcm_evaluator_id: ttcmStaff?.id || '',
          ttcm_evaluator_name: ttcmName,
          ttcm_evaluator_role: ttcmStaff?.position || 'Tổ trưởng chuyên môn',
          ttcm_evaluator_department: ttcmStaff?.department || staff.department,
          bgh_evaluator_id: bghStaff?.id || '',
          bgh_evaluator_name: bghName,
          bgh_evaluator_role: bghStaff?.position || 'Ban Giám hiệu',
        };
      }

      const newEval: TeacherKpiEvaluation = {
        id: `eval-${staff.id}-${targetType}-${evalPeriod}-${evalPeriod === 'thang' ? evalMonth : 0}-${evalYear}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)}`,
        staffId: staff.id,
        staffCode: staff.code,
        staffName: staff.name,
        department: staff.department,
        position: staff.position,
        subject: staff.subject,
        targetType: targetType,
        schoolYear: schoolYear,
        semester: evalPeriod === 'ki2' ? 2 : 1,
        month: evalPeriod === 'thang' ? evalMonth : undefined,
        year: evalYear,
        evaluationPeriod: evalPeriod,
        periodName: periodDisplay,
        ...evalObj,
        scores: {},
        selfTotalScore: 0,
        deptTotalScore: 0,
        bghTotalScore: 0,
        selfRank: 'Chưa hoàn thành',
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };

      saveEvaluation(newEval);
    });

    // Show feedback
    if (duplicateStaffList.length > 0) {
      showToast(
        `Đã tạo ${createEligibleStaffList.length} phiếu KPI (${periodDisplay}). ${duplicateStaffList.length} đối tượng bị trùng đã bỏ qua.`,
        'warning'
      );
    } else {
      showToast(
        `Tạo thành công ${createEligibleStaffList.length} phiếu KPI kỳ ${periodDisplay}!`,
        'success'
      );
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-amber-300 font-black">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                TẠO PHIẾU KPI MỚI • MODULE {targetCategoryTitle}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                TẠO PHIẾU ĐÁNH GIÁ KPI KỲ THÁNG {String(evalMonth).padStart(2, '0')}/{evalYear}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* A. ĐỐI TƯỢNG ĐÁNH GIÁ */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">
                  A. ĐỐI TƯỢNG ĐÁNH GIÁ ({targetCategoryTitle})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                  {eligibleStaff.length} nhân sự
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-bold text-blue-700 transition cursor-pointer text-[11px]"
                >
                  {filteredStaff.every((s) => selectedStaffIds.includes(s.id)) && filteredStaff.length > 0
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả danh sách'}
                </button>
              </div>
            </div>

            {/* Search & Role Filter for Personnel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo Mã, Họ tên, Chức vụ..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {targetType === 'bgh' ? (
                <select
                  value={cbqlRoleFilter}
                  onChange={(e) => setCbqlRoleFilter(e.target.value as any)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả phân loại CBQL ({eligibleStaff.length})</option>
                  <option value="bgh">Ban Giám hiệu (Hiệu trưởng & Phó HT)</option>
                  <option value="totruong">Tổ trưởng Chuyên môn</option>
                  <option value="topho">Tổ phó Chuyên môn</option>
                </select>
              ) : (
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả tổ / bộ phận ({departmentsList.length})</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Personnel Checkbox List */}
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <div className="p-6 text-center text-slate-400 italic">
                  Không tìm thấy nhân sự phù hợp
                </div>
              ) : (
                filteredStaff.map((staff) => {
                  const isChecked = selectedStaffIds.includes(staff.id);
                  const isAlreadyEvaluated = evaluationsList.some((e) => {
                    if (e.staffId !== staff.id) return false;
                    if (targetType === 'bgh') {
                      if (!isCbqlEvaluation(e, staffList) && e.targetType !== 'bgh') return false;
                    } else if (e.targetType && e.targetType !== targetType) {
                      return false;
                    }
                    if (evalPeriod === 'ki1') {
                      return e.evaluationPeriod === 'ki1' || (!e.evaluationPeriod && e.semester === 1 && !e.month);
                    }
                    if (evalPeriod === 'ki2') {
                      return e.evaluationPeriod === 'ki2' || (!e.evaluationPeriod && e.semester === 2 && !e.month);
                    }
                    if (evalPeriod === 'canam') {
                      return e.evaluationPeriod === 'canam' || (e.periodName && e.periodName.toLowerCase().includes('cả năm'));
                    }
                    return e.month === evalMonth && (e.year === evalYear || e.schoolYear.includes(String(evalYear)));
                  });

                  const currentPeriodLabel =
                    evalPeriod === 'ki1'
                      ? 'Kì I'
                      : evalPeriod === 'ki2'
                      ? 'Kì II'
                      : evalPeriod === 'canam'
                      ? 'Cả năm'
                      : `T${evalMonth}`;

                  const cat = targetType === 'bgh' ? getCbqlCategory(staff) : null;
                  const catBadge = cat ? getCbqlCategoryBadge(cat) : null;

                  return (
                    <label
                      key={staff.id}
                      className={`flex items-center justify-between p-2.5 hover:bg-blue-50/50 transition cursor-pointer ${
                        isChecked ? 'bg-blue-50/80 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStaff(staff.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-slate-800 font-bold flex items-center gap-2">
                            <span>{staff.name}</span>
                            <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                              {staff.code}
                            </span>
                            {catBadge && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${catBadge.badgeClass}`}>
                                <span>{catBadge.shortLabel}</span>
                              </span>
                            )}
                            {isAlreadyEvaluated && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                                Đã có phiếu {currentPeriodLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {staff.position} • <span className="text-slate-700">{staff.department}</span>
                          </div>
                        </div>
                      </div>

                      {isChecked && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </label>
                  );
                })
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between px-1">
              <span>Số nhân sự được chọn: <strong className="text-blue-700 text-xs">{selectedStaffIds.length}</strong> người</span>
              <span>(Có thể chọn 1 người hoặc chọn nhiều người để tạo hàng loạt)</span>
            </div>
          </div>

          {/* B. KỲ ĐÁNH GIÁ */}
          <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">
                  B. KỲ ĐÁNH GIÁ KPI (*)
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Năm học {schoolYear}
              </span>
            </div>

            {/* 4 Interactive Segmented Options: Kì I, Kì II, Cả năm, Theo tháng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Chọn Kỳ đánh giá (*):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEvalPeriod('ki1');
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    evalPeriod === 'ki1'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wide">Kì I</span>
                    {evalPeriod === 'ki1' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`text-[11px] mt-1 ${evalPeriod === 'ki1' ? 'text-blue-100 font-medium' : 'text-slate-500'}`}>
                    Học kì I
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEvalPeriod('ki2');
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    evalPeriod === 'ki2'
                      ? 'bg-purple-600 border-purple-600 text-white shadow-md ring-2 ring-purple-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wide">Kì II</span>
                    {evalPeriod === 'ki2' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`text-[11px] mt-1 ${evalPeriod === 'ki2' ? 'text-purple-100 font-medium' : 'text-slate-500'}`}>
                    Học kì II
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEvalPeriod('canam');
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    evalPeriod === 'canam'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wide">Cả năm</span>
                    {evalPeriod === 'canam' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`text-[11px] mt-1 ${evalPeriod === 'canam' ? 'text-emerald-100 font-medium' : 'text-slate-500'}`}>
                    Cả năm học
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEvalPeriod('thang');
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    evalPeriod === 'thang'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-md ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wide">Theo tháng</span>
                    {evalPeriod === 'thang' && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`text-[11px] mt-1 ${evalPeriod === 'thang' ? 'text-amber-100 font-medium' : 'text-slate-500'}`}>
                    Tháng 1 - 12
                  </div>
                </button>
              </div>
            </div>

            {/* Period Details: Monthly Picker (if 'thang') and Year Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {evalPeriod === 'thang' ? (
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Tháng đánh giá (*):</label>
                  <select
                    value={evalMonth}
                    onChange={(e) => {
                      setEvalMonth(Number(e.target.value));
                      setErrorMessage(null);
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Quy định kỳ:</label>
                  <div className="p-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {evalPeriod === 'ki1' && <span className="text-blue-700">📘 Đánh giá tổng kết Học kỳ I</span>}
                    {evalPeriod === 'ki2' && <span className="text-purple-700">📙 Đánh giá tổng kết Học kỳ II</span>}
                    {evalPeriod === 'canam' && <span className="text-emerald-700">🏆 Đánh giá tổng kết Cả năm học</span>}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Năm đánh giá (*):</label>
                <select
                  value={evalYear}
                  onChange={(e) => {
                    setEvalYear(Number(e.target.value));
                    setErrorMessage(null);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                >
                  <option value={2026}>Năm 2026 (Năm học {schoolYear})</option>
                  <option value={2025}>Năm 2025</option>
                  <option value={2027}>Năm 2027</option>
                </select>
              </div>
            </div>
          </div>

          {/* C. NGƯỜI ĐÁNH GIÁ (QUY TRÌNH PHÂN LUỒNG CHUẨN) */}
          {targetType === 'bgh' ? (
            /* ====================================================================
               CBQL MODULE EVALUATOR ROUTING (Strict Role-Based Routing)
               1. If TTCM / TPCM: ONLY Hiệu trưởng / Phó Hiệu trưởng
               2. If Hiệu trưởng / Phó HT: ONLY Hội đồng Thi đua – Khen thưởng
               ==================================================================== */
            <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span className="font-extrabold text-amber-950 uppercase tracking-wide text-xs">
                    {cbqlSelectionCategory === 'BGH'
                      ? 'C. NGƯỜI/HỘI ĐỒNG ĐÁNH GIÁ (CẤP HỘI ĐỒNG THI ĐUA)'
                      : 'C. NGƯỜI ĐÁNH GIÁ (CẤP BAN GIÁM HIỆU)'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                  Phân luồng theo chức vụ
                </span>
              </div>

              {/* Case A: Hiệu trưởng / Phó Hiệu trưởng selected */}
              {cbqlSelectionCategory === 'BGH' && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="block font-bold text-slate-800 text-xs">
                    Lựa chọn Hội đồng đánh giá (*):
                  </label>
                  <select
                    value={COUNCIL_EVALUATOR_INFO.id}
                    disabled
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-100/60 font-bold text-amber-950 text-xs cursor-default"
                  >
                    <option value={COUNCIL_EVALUATOR_INFO.id}>
                      🏛️ {COUNCIL_EVALUATOR_INFO.name}
                    </option>
                  </select>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium bg-amber-100/50 p-2 rounded-lg border border-amber-200">
                    <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Quy định: Đối tượng là <strong>Hiệu trưởng / Phó Hiệu trưởng</strong> chỉ được đánh giá bởi <strong>Hội đồng Thi đua – Khen thưởng</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Case B: Tổ trưởng chuyên môn (TTCM) / Tổ phó chuyên môn (TPCM) selected */}
              {cbqlSelectionCategory === 'TTCM' && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="block font-bold text-slate-800 text-xs">
                    Lựa chọn người đánh giá (*):
                  </label>
                  <select
                    value={selectedBghId}
                    onChange={(e) => {
                      setSelectedBghId(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="">-- [-- Chọn Hiệu trưởng/Phó Hiệu trưởng --] --</option>
                    {bghCandidates.map((bgh) => (
                      <option key={bgh.id} value={bgh.id}>
                        ✓ {bgh.name} – {bgh.position} ({bgh.code})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-800 font-medium bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>
                      Quy định: Đối tượng là <strong>Tổ trưởng / Tổ phó chuyên môn</strong> chỉ được đánh giá bởi <strong>Hiệu trưởng hoặc Phó Hiệu trưởng</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Case C: Mixed Selection (both BGH and TTCM checked) */}
              {cbqlSelectionCategory === 'MIXED' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl space-y-1 text-xs">
                    <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Danh sách chọn bao gồm cả BGH và Tổ trưởng/Tổ phó CM:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-0.5 pt-1 font-medium">
                      <li><strong>Hiệu trưởng / Phó Hiệu trưởng</strong> sẽ tự động gán người đánh giá: <em>Hội đồng Thi đua – Khen thưởng</em></li>
                      <li><strong>Tổ trưởng / Tổ phó CM</strong> sẽ được đánh giá bởi Cán bộ BGH bạn chọn dưới đây:</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 text-xs mb-1">
                      Chọn Hiệu trưởng / Phó Hiệu trưởng đánh giá TTCM/TPCM (*):
                    </label>
                    <select
                      value={selectedBghId}
                      onChange={(e) => {
                        setSelectedBghId(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="">-- [-- Chọn Hiệu trưởng/Phó Hiệu trưởng --] --</option>
                      {bghCandidates.map((bgh) => (
                        <option key={bgh.id} value={bgh.id}>
                          ✓ {bgh.name} – {bgh.position} ({bgh.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Case D: No staff selected yet */}
              {cbqlSelectionCategory === 'NONE' && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-center italic text-xs">
                  Vui lòng tích chọn đối tượng Cán bộ Quản lý ở mục A bên trên để hiển thị người/hội đồng đánh giá tương ứng.
                </div>
              )}
            </div>
          ) : (
            /* ====================================================================
               REGULAR TEACHER & STAFF EVALUATOR SECTION (2-Tier Flow)
               C1: TTCM (Cấp tổ) + C2: BGH (Cấp trường)
               ==================================================================== */
            <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">
                  C. NGƯỜI ĐÁNH GIÁ (QUY TRÌNH 2 CẤP ĐỘ)
                </span>
              </div>

              {/* C1. TỔ TRƯỜNG CHUYÊN MÔN (TTCM) */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-xs">
                  C1. TỔ TRƯỜNG CHUYÊN MÔN (TTCM) CHẤM ĐIỂM CẤP TỔ (*):
                </label>

                {selectedDepartments.length <= 1 ? (
                  <select
                    value={selectedTtcmId}
                    onChange={(e) => {
                      setSelectedTtcmId(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="">-- [▼ Chọn TTCM] --</option>
                    {getTtcmCandidatesForDept(selectedDepartments[0]).map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} – {cand.position || 'TTCM'} – {cand.department} ({cand.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 space-y-2 text-xs">
                    <div className="font-bold text-amber-900 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Giáo viên được chọn thuộc {selectedDepartments.length} tổ khác nhau. Vui lòng chọn TTCM từng tổ:</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {selectedDepartments.map((deptName) => {
                        const countInDept = selectedStaffMembers.filter((s) => s.department === deptName).length;
                        const candList = getTtcmCandidatesForDept(deptName);

                        return (
                          <div key={deptName} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                            <div className="font-extrabold text-blue-900 flex items-center justify-between">
                              <span>{deptName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {countInDept} giáo viên
                              </span>
                            </div>

                            <select
                              value={deptTtcmMap[deptName] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDeptTtcmMap((prev) => ({ ...prev, [deptName]: val }));
                                setErrorMessage(null);
                              }}
                              className="w-full p-2 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- [▼ Chọn TTCM cho {deptName}] --</option>
                              {candList.map((cand) => (
                                <option key={cand.id} value={cand.id}>
                                  {cand.name} – {cand.position || 'TTCM'} ({cand.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* C2. HIỆU TRƯỜNG / PHÓ HIỆU TRƯỜNG ĐÁNH GIÁ/DUYỆT */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  C2. CÁN BỘ QUẢN LÝ (HIỆU TRƯỜNG / PHÓ HIỆU TRƯỜNG) ĐÁNH GIÁ & DUYỆT (*):
                </label>
                <select
                  value={selectedBghId}
                  onChange={(e) => {
                    setSelectedBghId(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="">-- [▼ Chọn Hiệu trưởng / Phó Hiệu trưởng] --</option>
                  {bghCandidates.map((bgh) => (
                    <option key={bgh.id} value={bgh.id}>
                      {bgh.name} – {bgh.position} ({bgh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* D. BỘ TIÊU CHÍ KPI */}
          <div className="space-y-2 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-indigo-950">
            <div className="flex items-center gap-2 font-extrabold uppercase text-xs text-indigo-900">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>D. BỘ TIÊU CHÍ KPI TỰ ĐỘNG ÁP DỤNG</span>
            </div>
            <div className="text-xs font-bold text-indigo-900">{criteriaSetTitle}</div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Hệ thống tự động liên kết bộ tiêu chí tương ứng của module đang chọn. Sau khi khởi tạo, phiếu KPI sẽ xuất hiện ở trạng thái <strong className="text-slate-900">&quot;Chưa đánh giá&quot;</strong> trong danh sách.
            </p>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-slate-500 text-[11px] font-medium">
              Chỉ tạo phiếu khi nhấn nút <strong className="text-blue-700">&quot;TẠO PHIẾU KPI&quot;</strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {selectedStaffIds.length > 1
                    ? `TẠO PHIẾU CHO ${selectedStaffIds.length} NGƯỜI ĐÃ CHỌN`
                    : 'TẠO PHIẾU KPI'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
