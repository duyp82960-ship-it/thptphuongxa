import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useKpi } from '../context/KpiContext';
import { PersonType, TeacherKpiEvaluation, StaffMember, EvaluationPeriod, getDepartmentId, CANONICAL_DEPARTMENTS } from '../types';
import {
  getEvaluationPeriod,
  getEvaluationPeriodLabel,
  getEvaluationPeriodBadge,
  matchesEvaluationPeriod,
  EVALUATION_PERIOD_OPTIONS,
} from '../utils/periodUtils';
import {
  Award,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  UserCheck,
  Building2,
  FileCheck2,
  CheckCircle2,
  Clock,
  Lock,
  Download,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  HelpCircle,
  ArrowUpDown,
  X,
  FileText,
  ClipboardCheck,
  MoreHorizontal,
  RotateCcw,
  LayoutList,
  Grid3X3,
  SlidersHorizontal,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  isCbqlStaff,
  isCbqlEvaluation,
  getCbqlCategory,
  getCbqlCategoryBadge,
  CbqlCategoryType,
  getCbqlEvaluatorDisplay,
  isBghLeader,
  isTtcmOrTpcm,
} from '../utils/cbqlUtils';
import { CreateKpiModal } from './CreateKpiModal';
import { KpiEvaluationSheet } from './KpiEvaluationSheet';
import { StaffKpiModuleView } from './StaffKpiModuleView';
import { ThreeTierKpiEvaluationModal } from './ThreeTierKpiEvaluationModal';
import { KpiRankingConfigModal } from './KpiRankingConfigModal';
import { getRankBadgeClass, exportKpiEvaluationToWord } from '../utils/exportUtils';
import { getEvaluationDisplayScores, DisplayScoresResult } from '../utils/scoreUtils';
import {
  getKpiRankingResult,
  KpiRankingResult,
  getStoredRankingTiers,
} from '../utils/rankingUtils';
import { TEACHER_KPI_CRITERIA, STAFF_KPI_CRITERIA } from '../data/kpiEvaluationTemplates';
import * as XLSX from 'xlsx';

interface KpiModuleViewProps {
  targetType: PersonType; // 'bgh' | 'giaovien' | 'nhanvien'
}

type QuickFilterTab =
  | 'all'
  | 'self_pending'
  | 'ttcm_pending'
  | 'bgh_pending'
  | 'ranked'
  | 'unranked';

export const KpiModuleView: React.FC<KpiModuleViewProps> = ({ targetType }) => {
  const {
    staffList,
    evaluationsList,
    deleteEvaluation,
    clearAllEvaluations,
    schoolYear,
    semester,
    month: globalMonth,
    openPrintModal,
    showToast,
    currentUser,
    schoolConfig,
    setActiveEvaluationStaffId,
    setActiveTab,
    openCriteriaEditor,
  } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  // Sub-tab selection for CBQL module: 'staff_list' | 'evaluations'
  const [bghSubTab, setBghSubTab] = useState<'staff_list' | 'evaluations'>('staff_list');
  const [cbqlTierFilter, setCbqlTierFilter] = useState<'all' | 'bgh' | 'totruong' | 'topho'>('all');
  const [cbqlStatusFilter, setCbqlStatusFilter] = useState<'all' | 'has_eval' | 'no_eval'>('all');
  const [preselectedStaffId, setPreselectedStaffId] = useState<string | undefined>(undefined);

  // View Mode: 'compact' (default - fits on 1366px screens without scrolling) or 'detailed'
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  // Quick Filter Tab
  const [activeTabFilter, setActiveTabFilter] = useState<QuickFilterTab>('all');

  // Detailed Filter controls state
  const [periodFilter, setPeriodFilter] = useState<EvaluationPeriod | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>(2026);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [rankingFilter, setRankingFilter] = useState<string>('all');
  const [scoringProgressFilter, setScoringProgressFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown action menu state (row id)
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeActionMenuId) {
        setActiveActionMenuId(null);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeActionMenuId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeActionMenuId) {
        const target = e.target as HTMLElement;
        if (target.closest('.teacher-kpi-action-portal-menu') || target.closest('.teacher-kpi-action-btn')) {
          return;
        }
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeActionMenuId]);

  // Modals & Active Sheet State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isRankingConfigModalOpen, setIsRankingConfigModalOpen] = useState(false);
  const [rankingVersion, setRankingVersion] = useState(0); // bump to force recalculate
  const [clearScope, setClearScope] = useState<'module' | 'all'>('module');
  const [activeEvaluation, setActiveEvaluation] = useState<TeacherKpiEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isThreeTierModalOpen, setIsThreeTierModalOpen] = useState(false);
  const [selectedEvalFor3Tier, setSelectedEvalFor3Tier] = useState<TeacherKpiEvaluation | null>(null);
  const [selectedTierFor3Tier, setSelectedTierFor3Tier] = useState<'tier1' | 'tier2' | 'tier3' | 'comparison'>('tier1');
  const [previewEvaluation, setPreviewEvaluation] = useState<TeacherKpiEvaluation | null>(null);
  const [deletingEvalId, setDeletingEvalId] = useState<string | null>(null);

  // Close action dropdown menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Configure Title & Metadata according to module targetType
  const moduleInfo = useMemo(() => {
    switch (targetType) {
      case 'bgh':
        return {
          title: 'KPI CÁN BỘ QUẢN LÝ',
          subtitle: 'Module quản lý và đánh giá KPI Ban Giám hiệu, Tổ trưởng & Tổ phó chuyên môn',
          personLabel: 'Cán bộ quản lý',
          icon: ShieldCheck,
          bgGradient: 'from-amber-900 via-amber-950 to-slate-900',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'nhanvien':
        return {
          title: 'KPI NHÂN VIÊN VĂN PHÒNG',
          subtitle: 'Module quản lý phiếu KPI Nhân viên (30 điểm chung + 70 điểm vị trí việc làm)',
          personLabel: 'Nhân viên',
          icon: Briefcase,
          bgGradient: 'from-purple-900 via-indigo-950 to-slate-900',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      case 'giaovien':
      default:
        return {
          title: 'KPI GIÁO VIÊN',
          subtitle: 'Module quản lý và đánh giá phiếu KPI Giáo viên các tổ chuyên môn giảng dạy',
          personLabel: 'Giáo viên',
          icon: GraduationCap,
          bgGradient: 'from-slate-900 via-indigo-950 to-blue-900',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        };
    }
  }, [targetType]);

  const Icon = moduleInfo.icon;

  // Base list of evaluations matching the current targetType, period, month and year
  const baseEvaluations = useMemo(() => {
    return evaluationsList.filter((e) => {
      if (targetType === 'bgh') {
        const isCbql = isCbqlEvaluation(e, staffList) || e.targetType === 'bgh';
        if (!isCbql) return false;
      } else if (deptFilter !== 'all') {
        const filterDeptId = getDepartmentId(deptFilter);
        const evalDeptId = getDepartmentId(e.department_id || e.department, e.targetType);
        if (filterDeptId !== evalDeptId && e.department !== deptFilter) return false;
      } else {
        if (targetType === 'nhanvien') {
          if (e.targetType !== 'nhanvien' && getDepartmentId(e.department_id || e.department, e.targetType) !== 'to-van-phong') {
            return false;
          }
        }
        if (targetType === 'giaovien') {
          if (e.targetType === 'nhanvien' || getDepartmentId(e.department_id || e.department, e.targetType) === 'to-van-phong') {
            return false;
          }
        }
      }

      if (!matchesEvaluationPeriod(e, periodFilter, monthFilter, yearFilter)) return false;

      return true;
    });
  }, [evaluationsList, targetType, deptFilter, periodFilter, monthFilter, yearFilter, staffList]);

  // All Cán bộ Quản lý (BGH, Tổ trưởng, Tổ phó)
  const cbqlStaffList = useMemo(() => {
    return staffList.filter((s) => isCbqlStaff(s));
  }, [staffList]);

  // Breakdown tier counts for CBQL
  const bghTierCounts = useMemo(() => {
    let bghCount = 0;
    let totruongCount = 0;
    let tophoCount = 0;
    cbqlStaffList.forEach((s) => {
      const cat = getCbqlCategory(s);
      if (cat === 'bgh') bghCount++;
      else if (cat === 'totruong') totruongCount++;
      else if (cat === 'topho') tophoCount++;
    });
    return {
      total: cbqlStaffList.length,
      bgh: bghCount,
      totruong: totruongCount,
      topho: tophoCount,
    };
  }, [cbqlStaffList]);

  // Filtered CBQL staff list
  const filteredCbqlStaff = useMemo(() => {
    return cbqlStaffList.filter((s) => {
      if (cbqlTierFilter !== 'all') {
        const cat = getCbqlCategory(s);
        if (cat !== cbqlTierFilter) return false;
      }
      if (deptFilter !== 'all') {
        const filterDeptId = getDepartmentId(deptFilter);
        const staffDeptId = getDepartmentId(s.department_id || s.departmentId || s.department, s.type);
        if (filterDeptId !== staffDeptId && s.department !== deptFilter) return false;
      }

      const staffEval = baseEvaluations.find((e) => e.staffId === s.id || e.staffCode === s.code);
      if (cbqlStatusFilter === 'has_eval' && !staffEval) return false;
      if (cbqlStatusFilter === 'no_eval' && staffEval) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        const matchDept = s.department.toLowerCase().includes(q);
        const matchPos = s.position.toLowerCase().includes(q);
        const matchSubject = s.subject?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCode && !matchDept && !matchPos && !matchSubject) return false;
      }
      return true;
    });
  }, [cbqlStaffList, cbqlTierFilter, deptFilter, cbqlStatusFilter, searchQuery, baseEvaluations]);

  // Ranking stats & tab counts for the period (Requirement 12)
  const rankingStats = useMemo(() => {
    let htsxnv = 0;
    let httnv = 0;
    let htnv = 0;
    let khtnv = 0;
    let chuaXepLoai = 0;

    let self_pending = 0;
    let ttcm_pending = 0;
    let bgh_pending = 0;

    baseEvaluations.forEach((item) => {
      const rankRes = getKpiRankingResult(item);
      const sc = getEvaluationDisplayScores(item);

      if (rankRes.code === 'HTSXNV') htsxnv++;
      else if (rankRes.code === 'HTTNV') httnv++;
      else if (rankRes.code === 'HTNV') htnv++;
      else if (rankRes.code === 'KHTNV') khtnv++;
      else chuaXepLoai++;

      if (sc.selfTotal === 0 && item.status === 'draft') {
        self_pending++;
      } else if (!sc.hasTtcmEvaluated) {
        ttcm_pending++;
      } else if (!sc.hasBghEvaluated) {
        bgh_pending++;
      }
    });

    const ranked = htsxnv + httnv + htnv + khtnv;

    return {
      total: baseEvaluations.length,
      htsxnv,
      httnv,
      htnv,
      khtnv,
      chuaXepLoai,
      ranked,
      self_pending,
      ttcm_pending,
      bgh_pending,
    };
  }, [baseEvaluations, rankingVersion]);

  // Filtered evaluations list
  const createdEvaluations = useMemo(() => {
    return baseEvaluations.filter((e) => {
      const scoresInfo = getEvaluationDisplayScores(e);
      const rankRes = getKpiRankingResult(e);

      // Quick tab filter
      if (activeTabFilter === 'self_pending') {
        if (scoresInfo.selfTotal > 0 && e.status !== 'draft') return false;
      } else if (activeTabFilter === 'ttcm_pending') {
        if (scoresInfo.hasTtcmEvaluated) return false;
      } else if (activeTabFilter === 'bgh_pending') {
        if (!scoresInfo.hasTtcmEvaluated || scoresInfo.hasBghEvaluated) return false;
      } else if (activeTabFilter === 'ranked') {
        if (!rankRes.isRanked) return false;
      } else if (activeTabFilter === 'unranked') {
        if (rankRes.isRanked) return false;
      }

      // Department filter
      if (deptFilter !== 'all') {
        const filterDeptId = getDepartmentId(deptFilter);
        const evalDeptId = getDepartmentId(e.department_id || e.department, e.targetType);
        if (filterDeptId !== evalDeptId && e.department !== deptFilter) return false;
      }

      // Ranking filter (Requirement 11)
      if (rankingFilter !== 'all') {
        if (rankingFilter === 'CHUA_XEP_LOAI') {
          if (rankRes.isRanked) return false;
        } else {
          if (rankRes.code !== rankingFilter) return false;
        }
      }

      // Scoring Progress filter
      if (scoringProgressFilter !== 'all') {
        if (scoringProgressFilter === 'self_zero' && scoresInfo.selfTotal > 0) return false;
        if (scoringProgressFilter === 'ttcm_pending' && scoresInfo.hasTtcmEvaluated) return false;
        if (
          scoringProgressFilter === 'bgh_pending' &&
          (!scoresInfo.hasTtcmEvaluated || scoresInfo.hasBghEvaluated)
        )
          return false;
        if (
          scoringProgressFilter === 'all_scored' &&
          (!scoresInfo.hasTtcmEvaluated || !scoresInfo.hasBghEvaluated)
        )
          return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = e.staffName.toLowerCase().includes(q);
        const matchCode = e.staffCode.toLowerCase().includes(q);
        const matchDept = e.department.toLowerCase().includes(q);
        const matchPos = e.position.toLowerCase().includes(q);
        const matchSubject = e.subject?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCode && !matchDept && !matchPos && !matchSubject) return false;
      }

      // CBQL Role filter (when targetType === 'bgh')
      if (targetType === 'bgh' && cbqlTierFilter !== 'all') {
        const staffObj = staffList.find((s) => s.id === e.staffId || s.code === e.staffCode);
        const cat = getCbqlCategory(staffObj || { position: e.position });
        if (cat !== cbqlTierFilter) return false;
      }

      return true;
    });
  }, [
    baseEvaluations,
    activeTabFilter,
    deptFilter,
    rankingFilter,
    scoringProgressFilter,
    searchQuery,
    rankingVersion,
    targetType,
    cbqlTierFilter,
    staffList,
  ]);

  // Department options from canonical database/types with live active staff counts
  const departmentOptions = useMemo(() => {
    if (targetType === 'bgh') {
      const cbqlDepts = Array.from(
        new Set(staffList.filter((s) => isCbqlStaff(s)).map((s) => s.department))
      );
      return cbqlDepts.map((dName) => {
        const count = staffList.filter(
          (s) =>
            isCbqlStaff(s) &&
            (s.department === dName || getDepartmentId(s.department) === getDepartmentId(dName))
        ).length;
        return {
          id: getDepartmentId(dName),
          name: dName,
          staffCount: count,
        };
      });
    }

    return CANONICAL_DEPARTMENTS.map((dept) => {
      const count = staffList.filter((s) => {
        if (s.is_active === false) return false;
        const sDeptId = getDepartmentId(
          s.department_id || s.departmentId || s.department,
          s.type || s.employee_type
        );
        return sDeptId === dept.id;
      }).length;

      return {
        id: dept.id,
        name: dept.name,
        staffCount: count,
      };
    });
  }, [staffList, targetType]);

  // Export CBQL Staff List to Excel
  const handleExportCbqlExcel = () => {
    const exportData = filteredCbqlStaff.map((s, idx) => {
      const cat = getCbqlCategory(s);
      const catBadge = getCbqlCategoryBadge(cat);
      const staffEval = baseEvaluations.find((e) => e.staffId === s.id || e.staffCode === s.code);
      const scoresInfo = staffEval ? getEvaluationDisplayScores(staffEval) : null;
      const rankRes = staffEval ? getKpiRankingResult(staffEval) : null;

      return {
        STT: idx + 1,
        'Mã CB': s.code,
        'Họ và tên': s.name,
        'Phân loại CBQL': catBadge.label,
        'Tổ / Bộ phận': s.department,
        'Chức vụ': s.position,
        'Môn phụ trách': s.subject || '—',
        'Tình trạng phiếu': staffEval ? 'Đã lập phiếu KPI' : 'Chưa lập phiếu',
        'Điểm cá nhân': scoresInfo ? `${scoresInfo.selfTotal}/100` : '—',
        'TTCM đánh giá': scoresInfo ? scoresInfo.ttcmScoreLabel : '—',
        'BGH duyệt': scoresInfo ? scoresInfo.bghScoreLabel : '—',
        'Xếp loại': rankRes ? (rankRes.isRanked ? rankRes.code : 'Chưa xếp loại') : '—',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_CBQL');
    XLSX.writeFile(wb, `Danh_Sach_Can_Bo_Quan_Ly_THPT_Phuong_Xa.xlsx`);
    showToast(`Đã xuất file Excel ${filteredCbqlStaff.length} Cán bộ Quản lý!`, 'success');
  };

  // Print CBQL Staff List
  const handlePrintCbqlList = () => {
    openPrintModal(
      `DANH SÁCH CÁN BỘ QUẢN LÝ - TRƯỜNG THPT PHƯƠNG XÁ`,
      `Ban Giám hiệu, Tổ trưởng chuyên môn và Tổ phó chuyên môn • Năm học ${schoolYear} (Tổng số ${filteredCbqlStaff.length} cán bộ)`
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveTabFilter('all');
    setMonthFilter(globalMonth || 9);
    setYearFilter(2026);
    setDeptFilter('all');
    setRankingFilter('all');
    setScoringProgressFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    activeTabFilter !== 'all' ||
    deptFilter !== 'all' ||
    rankingFilter !== 'all' ||
    scoringProgressFilter !== 'all' ||
    searchQuery.trim() !== '';

  // Render KẾT QUẢ XẾP LOẠI Badge (Requirements 2, 6, 7)
  const renderRankingBadge = (rankRes: KpiRankingResult) => {
    if (!rankRes.isRanked) {
      return (
        <span
          className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-300 whitespace-nowrap"
          title="Phiếu chưa hoàn tất BGH đánh giá/duyệt"
        >
          Chưa xếp loại
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-xs whitespace-nowrap cursor-default ${rankRes.badgeClass}`}
        title={`${rankRes.name} (Điểm BGH: ${rankRes.score}đ)`}
      >
        <span className="font-mono font-black tracking-tight">{rankRes.code}</span>
        <span className="text-[11px] font-bold opacity-90 hidden xl:inline">
          •{' '}
          {rankRes.code === 'HTSXNV'
            ? 'Xuất sắc'
            : rankRes.code === 'HTTNV'
            ? 'Tốt'
            : rankRes.code === 'HTNV'
            ? 'Hoàn thành'
            : 'Chưa HT'}
        </span>
      </span>
    );
  };

  // Export created evaluations to Excel (Requirement 13)
  const handleExportExcel = () => {
    const exportData = createdEvaluations.map((e, idx) => {
      const scoresInfo = getEvaluationDisplayScores(e);
      const rankRes = getKpiRankingResult(e);

      return {
        STT: idx + 1,
        'Mã cán bộ': e.staffCode,
        'Họ và tên': e.staffName,
        'Tổ/Bộ phận': e.department,
        'Chức vụ': e.position,
        'Kỳ đánh giá': getEvaluationPeriodLabel(e),
        'Điểm cá nhân': `${scoresInfo.selfTotal}/100`,
        'TTCM Đánh giá': scoresInfo.ttcmScoreLabel,
        'BGH Đánh giá/Duyệt': scoresInfo.bghScoreLabel,
        'KẾT QUẢ XẾP LOẠI': rankRes.isRanked ? rankRes.code : 'Chưa xếp loại',
        'Chi tiết xếp loại': rankRes.name,
        'Ngày cập nhật': e.updatedAt ? new Date(e.updatedAt).toLocaleDateString('vi-VN') : '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 28 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Phieu_KPI');
    XLSX.writeFile(wb, `Danh_Sach_Phieu_KPI_${targetType}_T${globalMonth}_2026.xlsx`);
    showToast(`Đã xuất file Excel ${createdEvaluations.length} phiếu KPI!`, 'success');
  };

  // Export single evaluation sheet to Microsoft Word (.doc) (Requirement 13)
  const handleExportSingleWord = (evalItem: TeacherKpiEvaluation) => {
    const criteriaList =
      evalItem.targetType === 'nhanvien' ? STAFF_KPI_CRITERIA : TEACHER_KPI_CRITERIA;
    const rankRes = getKpiRankingResult(evalItem);

    exportKpiEvaluationToWord({
      schoolName: schoolConfig.fullName || 'TRƯỜNG THPT PHƯƠNG XÁ',
      teacherName: evalItem.staffName,
      staffCode: evalItem.staffCode,
      position: evalItem.position,
      department: evalItem.department,
      subject: evalItem.subject,
      schoolYear: evalItem.schoolYear || schoolYear,
      evaluationPeriod: evalItem.evaluationPeriod,
      periodName: evalItem.periodName,
      month: evalItem.month || globalMonth,
      year: evalItem.year || 2026,
      evaluatorName: evalItem.evaluatorName || 'Ban Giám hiệu',
      ttcmEvaluatorName: evalItem.ttcmEvaluatorName,
      bghEvaluatorName: evalItem.bghEvaluatorName,
      targetType: evalItem.targetType,
      criteria: criteriaList.map((c) => ({
        id: c.id,
        section: c.section,
        order: c.order,
        content: c.content,
        maxPoints: c.maxPoints,
        groupTitle: c.groupTitle,
      })),
      scores: evalItem.scores || {},
      selfTotal: evalItem.selfTotalScore || 0,
      deptTotal: evalItem.deptTotalScore || 0,
      bghTotal: evalItem.bghTotalScore || evalItem.selfTotalScore || 0,
      selfRank: rankRes.name as any,
      deptRank: rankRes.name as any,
      bghRank: rankRes.name as any,
    });
    showToast(`Đã xuất file Word phiếu KPI của ${evalItem.staffName}!`, 'success');
  };

  // Print evaluation list
  const handlePrintList = () => {
    openPrintModal(
      `DANH SÁCH PHIẾU ĐÁNH GIÁ KPI - ${moduleInfo.title}`,
      `Trường THPT Phương Xá • Năm học ${schoolYear} (Tổng số ${createdEvaluations.length} phiếu KPI)`
    );
  };

  // Open 3-Tier sequential evaluation modal (Requirements 2, 3, 13)
  const handleOpenEvaluation = (evaluation: TeacherKpiEvaluation, tier?: 'tier1' | 'tier2' | 'tier3' | 'comparison') => {
    setSelectedEvalFor3Tier(evaluation);
    const isSelfDone =
      evaluation.personal_status === 'completed' ||
      evaluation.status === 'self_submitted' ||
      evaluation.status === 'dept_reviewed' ||
      evaluation.status === 'bgh_approved' ||
      evaluation.status === 'completed';
    const isDeptDone =
      evaluation.ttcm_status === 'completed' ||
      evaluation.status === 'dept_reviewed' ||
      evaluation.status === 'bgh_approved' ||
      evaluation.status === 'completed';

    if (tier) {
      if (tier === 'tier2' && !isSelfDone) {
        setSelectedTierFor3Tier('tier1');
      } else if (tier === 'tier3' && (!isSelfDone || !isDeptDone)) {
        setSelectedTierFor3Tier(isSelfDone ? 'tier2' : 'tier1');
      } else {
        setSelectedTierFor3Tier(tier);
      }
    } else {
      // Auto pick sequential tier according to progress
      if (!isSelfDone) {
        setSelectedTierFor3Tier('tier1');
      } else if (!isDeptDone) {
        setSelectedTierFor3Tier('tier2');
      } else {
        setSelectedTierFor3Tier('tier3');
      }
    }
    setIsThreeTierModalOpen(true);
  };

  // Dynamic evaluation button based on 3-tier status and permissions (Requirement 18)
  const renderEvaluationButton = (evalItem: TeacherKpiEvaluation) => {
    const scoresInfo = getEvaluationDisplayScores(evalItem);
    const isApproved =
      evalItem.status === 'bgh_approved' ||
      evalItem.status === 'completed' ||
      evalItem.bgh_status === 'completed' ||
      scoresInfo.hasBghEvaluated;
    const isDeptDone =
      evalItem.status === 'dept_reviewed' ||
      evalItem.ttcm_status === 'completed' ||
      scoresInfo.hasTtcmEvaluated;
    const isSelfDone =
      evalItem.status === 'self_submitted' ||
      evalItem.personal_status === 'completed' ||
      scoresInfo.selfTotal > 0;

    // Check user permission on this specific record
    const isOwnRecord = currentUser?.personId === evalItem.staffId;
    const isCurrentBgh = currentUser?.role === 'bgh';
    const currentStaffObj = staffList.find((s) => s.id === currentUser?.personId);
    const isCurrentTtcmOfDept =
      currentStaffObj &&
      isTtcmOrTpcm(currentStaffObj) &&
      (currentStaffObj.department === evalItem.department || getDepartmentId(currentStaffObj.department) === getDepartmentId(evalItem.department));
    const isCurrentOfficeLead =
      currentStaffObj &&
      (evalItem.department === 'Tổ Văn phòng' || evalItem.targetType === 'nhanvien') &&
      (currentStaffObj.position.includes('Kế toán') || currentStaffObj.position.includes('Tổ trưởng') || currentStaffObj.position.includes('Phụ trách'));

    const hasAnyEditPermission = isCurrentBgh || isOwnRecord || isCurrentTtcmOfDept || isCurrentOfficeLead;

    // If no permission to edit any tier on this evaluation, show [👁 Xem] button
    if (!hasAnyEditPermission) {
      return (
        <button
          onClick={() => handleOpenEvaluation(evalItem)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer shrink-0"
          title="Xem chi tiết phiếu đánh giá 3 cấp"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>👁 Xem</span>
        </button>
      );
    }

    if (isApproved) {
      return (
        <button
          onClick={() => handleOpenEvaluation(evalItem)}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
          title="Phiếu đã được Ban Giám hiệu phê duyệt & chốt xếp loại"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã hoàn tất</span>
        </button>
      );
    }

    if (isDeptDone) {
      return (
        <button
          onClick={() => handleOpenEvaluation(evalItem)}
          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
          title="TTCM đã đánh giá xong, đang chờ Ban Giám hiệu phê duyệt"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
          <span>Đang chờ BGH</span>
        </button>
      );
    }

    if (isSelfDone) {
      return (
        <button
          onClick={() => handleOpenEvaluation(evalItem)}
          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
          title="Cá nhân đã tự chấm xong, đang chờ TTCM/Người phụ trách đánh giá"
        >
          <Clock className="w-3.5 h-3.5 text-amber-200" />
          <span>Đang chờ TTCM</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleOpenEvaluation(evalItem)}
        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
        title="Mở quy trình đánh giá 3 cấp"
      >
        <FileCheck2 className="w-3.5 h-3.5" />
        <span>Đánh giá</span>
      </button>
    );
  };

  // If in evaluation editing view mode
  if (isEvaluating && activeEvaluation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => {
              setIsEvaluating(false);
              setActiveEvaluation(null);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
          >
            ← Quay lại Danh sách Phiếu KPI ({moduleInfo.title})
          </button>
          <div className="text-xs text-slate-500 font-bold">
            Đang chấm điểm phiếu KPI cho:{' '}
            <strong className="text-blue-800">{activeEvaluation.staffName}</strong> (
            {activeEvaluation.staffCode})
          </div>
        </div>

        {targetType === 'nhanvien' ? (
          <StaffKpiModuleView evaluationRecord={activeEvaluation} />
        ) : (
          <KpiEvaluationSheet
            evaluationRecord={activeEvaluation}
            initialStaffId={activeEvaluation.staffId}
            onClose={() => {
              setIsEvaluating(false);
              setActiveEvaluation(null);
            }}
          />
        )}
      </div>
    );
  }

  if (targetType === 'nhanvien') {
    return <StaffKpiModuleView evaluationRecord={activeEvaluation || undefined} />;
  }

  return (
    <div className="space-y-5">
      {/* 1. TOP HERO HEADER */}
      <div
        className={`bg-gradient-to-r ${moduleInfo.bgGradient} rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/20 text-xs font-extrabold">
              <Icon className="w-4 h-4 text-amber-300" />
              <span>{moduleInfo.title}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {targetType === 'bgh' && bghSubTab === 'staff_list'
                ? 'Danh Sách Cán Bộ Quản Lý'
                : 'Danh Sách Phiếu Đánh Giá KPI'}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {targetType === 'bgh' && bghSubTab === 'staff_list'
                ? `Danh sách ${cbqlStaffList.length} Cán bộ Quản lý: Ban Giám hiệu (${bghTierCounts.bgh}), Tổ trưởng chuyên môn (${bghTierCounts.totruong}) và Tổ phó chuyên môn (${bghTierCounts.topho}) trường THPT Phương Xá.`
                : `${moduleInfo.subtitle}. Kết quả xếp loại chính thức được xác định tự động từ Tổng điểm BGH duyệt theo 4 mức: HTSXNV, HTTNV, HTNV, KHTNV.`}
            </p>
          </div>

          {/* Action Buttons: "+ TẠO PHIẾU KPI", Cấu hình xếp loại, Excel, Print */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Nút Cấu hình Danh mục Xếp loại (Requirement 5) */}
            <button
              onClick={() => setIsRankingConfigModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Cấu hình ngưỡng điểm danh mục xếp loại KPI"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Cấu hình xếp loại</span>
            </button>

            <button
              onClick={targetType === 'bgh' && bghSubTab === 'staff_list' ? handleExportCbqlExcel : handleExportExcel}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title={targetType === 'bgh' && bghSubTab === 'staff_list' ? 'Xuất Excel danh sách CBQL' : 'Xuất file Excel danh sách phiếu KPI'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            <button
              onClick={targetType === 'bgh' && bghSubTab === 'staff_list' ? handlePrintCbqlList : handlePrintList}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title={targetType === 'bgh' && bghSubTab === 'staff_list' ? 'In danh sách CBQL' : 'In danh sách phiếu KPI'}
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span className="hidden sm:inline">In danh sách</span>
            </button>

            <button
              onClick={() => openCriteriaEditor(targetType)}
              id={`btn-edit-criteria-${targetType}`}
              className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 border border-indigo-300/40 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Xem và chỉnh sửa tiêu chí cho bộ KPI này"
            >
              <Edit className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Tiêu chí KPI</span>
            </button>

            {isBgh && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                id="btn-clear-all-evaluations"
                className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Xóa toàn bộ phiếu đánh giá KPI"
              >
                <Trash2 className="w-4 h-4 text-rose-300" />
                <span className="hidden md:inline">Xóa toàn bộ</span>
              </button>
            )}

            <button
              onClick={() => {
                setPreselectedStaffId(undefined);
                setIsCreateModalOpen(true);
              }}
              id={`btn-create-kpi-${targetType}`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ TẠO PHIẾU KPI</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-NAV TABS FOR CBQL MODULE */}
      {targetType === 'bgh' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBghSubTab('staff_list')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                bghSubTab === 'staff_list'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>DANH SÁCH CÁN BỘ QUẢN LÝ ({bghTierCounts.total})</span>
            </button>
            <button
              onClick={() => setBghSubTab('evaluations')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                bghSubTab === 'evaluations'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>DANH SÁCH PHIẾU ĐÁNH GIÁ KPI ({createdEvaluations.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium px-2 flex items-center gap-2 flex-wrap">
            <span>Bao gồm:</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              👑 BGH ({bghTierCounts.bgh})
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              🔷 Tổ trưởng ({bghTierCounts.totruong})
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              🔶 Tổ phó ({bghTierCounts.topho})
            </span>
          </div>
        </div>
      )}

      {/* 2. CBQL STAFF DIRECTORY OR KPI EVALUATIONS LIST */}
      {targetType === 'bgh' && bghSubTab === 'staff_list' ? (
        <div className="space-y-4">
          {/* 4 CBQL Tier Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: All CBQL */}
            <div
              onClick={() => setCbqlTierFilter('all')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                cbqlTierFilter === 'all'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-amber-900 uppercase">Tất cả Cán bộ Quản lý</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-950">{bghTierCounts.total}</div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                BGH + Tổ trưởng + Tổ phó CM
              </div>
            </div>

            {/* Card 2: BGH */}
            <div
              onClick={() => setCbqlTierFilter('bgh')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                cbqlTierFilter === 'bgh'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-amber-900 uppercase">Ban Giám hiệu</span>
                <span className="text-base">👑</span>
              </div>
              <div className="text-2xl font-black text-amber-950">{bghTierCounts.bgh}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Hiệu trưởng & Phó HT</div>
            </div>

            {/* Card 3: Tổ trưởng Chuyên môn */}
            <div
              onClick={() => setCbqlTierFilter('totruong')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                cbqlTierFilter === 'totruong'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-blue-900 uppercase">Tổ trưởng Chuyên môn</span>
                <span className="text-base">🔷</span>
              </div>
              <div className="text-2xl font-black text-blue-950">{bghTierCounts.totruong}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">4 tổ chuyên môn</div>
            </div>

            {/* Card 4: Tổ phó Chuyên môn */}
            <div
              onClick={() => setCbqlTierFilter('topho')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                cbqlTierFilter === 'topho'
                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-indigo-900 uppercase">Tổ phó Chuyên môn</span>
                <span className="text-base">🔶</span>
              </div>
              <div className="text-2xl font-black text-indigo-950">{bghTierCounts.topho}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">4 tổ chuyên môn</div>
            </div>
          </div>

          {/* Filter Bar for CBQL */}
          <div className="bg-gradient-to-b from-slate-50/90 to-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Filter className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span>Bộ Lọc Danh Sách Cán Bộ Quản Lý</span>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Đang hiển thị: <strong className="text-amber-900">{filteredCbqlStaff.length}</strong> / {cbqlStaffList.length} Cán bộ Quản lý
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div>
                <label className="block text-[11px] font-bold text-blue-600 mb-1 flex items-center gap-1">
                  <span>🔎 Tìm họ tên / mã:</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập tên, mã CBQL, chức vụ..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50/30 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              {/* Phân loại CBQL */}
              <div>
                <label className="block text-[11px] font-bold text-amber-600 mb-1 flex items-center gap-1">
                  <span>👑 Phân loại CBQL:</span>
                </label>
                <select
                  value={cbqlTierFilter}
                  onChange={(e) => setCbqlTierFilter(e.target.value as any)}
                  className="w-full p-1.5 rounded-xl border border-amber-300 bg-amber-50/40 font-bold text-amber-950 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer text-xs transition"
                >
                  <option value="all">Tất cả Cán bộ Quản lý ({cbqlStaffList.length})</option>
                  <option value="bgh">Ban Giám hiệu ({bghTierCounts.bgh})</option>
                  <option value="totruong">Tổ trưởng Chuyên môn ({bghTierCounts.totruong})</option>
                  <option value="topho">Tổ phó Chuyên môn ({bghTierCounts.topho})</option>
                </select>
              </div>

              {/* Tổ / Bộ phận */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-600 mb-1 flex items-center gap-1">
                  <span>🏢 Tổ / Bộ phận:</span>
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full p-1.5 rounded-xl border border-emerald-300 bg-emerald-50/40 font-semibold text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 cursor-pointer text-xs transition"
                >
                  <option value="all">Tất cả tổ / bộ phận</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} ({dept.staffCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tình trạng phiếu KPI */}
              <div>
                <label className="block text-[11px] font-bold text-teal-600 mb-1 flex items-center gap-1">
                  <span>⏱️ Phiếu tháng {globalMonth}:</span>
                </label>
                <div className="flex gap-1">
                  <select
                    value={cbqlStatusFilter}
                    onChange={(e) => setCbqlStatusFilter(e.target.value as any)}
                    className="flex-1 p-1.5 rounded-xl border border-teal-300 bg-teal-50/40 font-semibold text-teal-950 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20 cursor-pointer text-xs transition"
                  >
                    <option value="all">Tất cả tình trạng</option>
                    <option value="has_eval">Đã có phiếu KPI kỳ này</option>
                    <option value="no_eval">Chưa có phiếu KPI kỳ này</option>
                  </select>
                  {(cbqlTierFilter !== 'all' || deptFilter !== 'all' || cbqlStatusFilter !== 'all' || searchQuery.trim()) && (
                    <button
                      onClick={() => {
                        setCbqlTierFilter('all');
                        setDeptFilter('all');
                        setCbqlStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-300 text-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition shadow-2xs"
                      title="Xóa tất cả bộ lọc về mặc định"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CBQL Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredCbqlStaff.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Không tìm thấy Cán bộ Quản lý phù hợp</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Không có nhân sự CBQL nào khớp với điều kiện lọc hiện tại. Vui lòng chọn điều kiện lọc khác.
                </p>
                <button
                  onClick={() => {
                    setCbqlTierFilter('all');
                    setDeptFilter('all');
                    setCbqlStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto max-h-[72vh] relative">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-extrabold border-b border-slate-800 uppercase tracking-wider text-[12px] sticky top-0 z-20 shadow-xs">
                        <th className="py-3 px-3 text-center w-12 border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
                          STT
                        </th>
                        <th className="py-3 px-3 border-r border-slate-800 w-24">MÃ CB</th>
                        <th className="py-3 px-3 border-r border-slate-800 w-64">HỌ VÀ TÊN CBQL</th>
                        <th className="py-3 px-3 border-r border-slate-800 w-48">PHÂN LOẠI CBQL</th>
                        <th className="py-3 px-3 border-r border-slate-800 w-52">TỔ / BỘ PHẬN</th>
                        <th className="py-3 px-3 border-r border-slate-800 w-44">CHỨC VỤ</th>
                        <th className="py-3 px-2 border-r border-slate-800 text-center w-32">PHIẾU KPI</th>
                        <th className="py-3 px-2 border-r border-slate-800 text-center w-28 bg-slate-900/90 text-emerald-200">ĐIỂM BGH</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-center w-36">KẾT QUẢ XẾP LOẠI</th>
                        <th className="py-3 px-3 text-center w-48 sticky right-0 z-30 bg-slate-900 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                          THAO TÁC
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {filteredCbqlStaff.map((member, idx) => {
                        const cat = getCbqlCategory(member);
                        const catBadge = getCbqlCategoryBadge(cat);
                        const staffEval = baseEvaluations.find((e) => e.staffId === member.id || e.staffCode === member.code);
                        const scoresInfo = staffEval ? getEvaluationDisplayScores(staffEval) : null;
                        const rankRes = staffEval ? getKpiRankingResult(staffEval) : null;

                        return (
                          <tr key={member.id} className="hover:bg-amber-50/30 transition-colors group h-[58px]">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-amber-50/60">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700 border-r border-slate-200">
                              {member.code}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200">
                              <div className="font-extrabold text-slate-900 text-sm leading-snug">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {member.subject ? `Môn: ${member.subject}` : member.email || '—'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${catBadge.badgeClass}`}>
                                <span className={`w-2 h-2 rounded-full ${catBadge.dotColor}`} />
                                <span>{catBadge.label}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-semibold border-r border-slate-200">
                              {member.department}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 text-xs">
                              {member.position}
                            </td>
                            <td className="py-2.5 px-2 text-center border-r border-slate-200">
                              {staffEval ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã có ({getEvaluationPeriodLabel(staffEval)})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>Chưa tạo</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center border-r border-slate-200 bg-emerald-50/20 font-black text-sm text-emerald-900">
                              {scoresInfo ? (scoresInfo.hasBghEvaluated ? `${scoresInfo.finalScore}đ` : scoresInfo.bghScoreLabel) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200">
                              {rankRes ? renderRankingBadge(rankRes) : (
                                <span className="text-[11px] text-slate-400 italic">Chưa đánh giá</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center sticky right-0 z-10 bg-white group-hover:bg-amber-50/60 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                              <div className="flex items-center justify-center gap-1.5">
                                {staffEval ? (
                                  <>
                                    {renderEvaluationButton(staffEval)}
                                    <button
                                      onClick={() => setPreviewEvaluation(staffEval)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                                      title="Xem chi tiết phiếu"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleExportSingleWord(staffEval)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                                      title="Xuất file Word phiếu KPI"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setPreselectedStaffId(member.id);
                                      setIsCreateModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                                    title="Tạo phiếu KPI cho cán bộ này"
                                  >
                                    <PlusCircle className="w-4 h-4 text-slate-950" />
                                    <span>+ Tạo phiếu</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-200">
                  {filteredCbqlStaff.map((member) => {
                    const cat = getCbqlCategory(member);
                    const catBadge = getCbqlCategoryBadge(cat);
                    const staffEval = baseEvaluations.find((e) => e.staffId === member.id || e.staffCode === member.code);
                    const scoresInfo = staffEval ? getEvaluationDisplayScores(staffEval) : null;
                    const rankRes = staffEval ? getKpiRankingResult(staffEval) : null;

                    return (
                      <div key={member.id} className="p-4 space-y-3 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {member.code}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.badgeClass}`}>
                                <span>{catBadge.shortLabel}</span>
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-1">{member.name}</h4>
                            <div className="text-xs text-slate-500">{member.department} • {member.position}</div>
                          </div>
                          {rankRes && renderRankingBadge(rankRes)}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-500">
                            {staffEval ? `Điểm BGH: ${scoresInfo?.finalScore}đ` : 'Chưa có phiếu KPI'}
                          </span>
                          {staffEval ? (
                            <button
                              onClick={() => handleOpenEvaluation(staffEval)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Chấm điểm</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setPreselectedStaffId(member.id);
                                setIsCreateModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ Tạo phiếu</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Summary */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    Tổng số Cán bộ Quản lý: <strong className="text-amber-900">{filteredCbqlStaff.length}</strong> / {cbqlStaffList.length} (BGH: {bghTierCounts.bgh}, Tổ trưởng: {bghTierCounts.totruong}, Tổ phó: {bghTierCounts.topho})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Danh sách Cán bộ Quản lý trường THPT Phương Xá • Chuẩn hóa thi đua nội bộ
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. STATS CARDS: THỐNG KÊ KẾT QUẢ XẾP LOẠI (Requirement 12) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: HTSXNV */}
        <div
          onClick={() => {
            setActiveTabFilter('all');
            setRankingFilter('HTSXNV');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            rankingFilter === 'HTSXNV'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">
              HTSXNV
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            {rankingStats.htsxnv} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
            Xuất sắc nhiệm vụ
          </div>
        </div>

        {/* Card 2: HTTNV */}
        <div
          onClick={() => {
            setActiveTabFilter('all');
            setRankingFilter('HTTNV');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            rankingFilter === 'HTTNV'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span className="font-mono bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded">
              HTTNV
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
            {rankingStats.httnv} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
            Tốt nhiệm vụ
          </div>
        </div>

        {/* Card 3: HTNV */}
        <div
          onClick={() => {
            setActiveTabFilter('all');
            setRankingFilter('HTNV');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            rankingFilter === 'HTNV'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
              HTNV
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
            {rankingStats.htnv} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
            Hoàn thành nhiệm vụ
          </div>
        </div>

        {/* Card 4: KHTNV */}
        <div
          onClick={() => {
            setActiveTabFilter('all');
            setRankingFilter('KHTNV');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            rankingFilter === 'KHTNV'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-800">
            <span className="font-mono bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded">
              KHTNV
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950 mt-1">
            {rankingStats.khtnv} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
            Không hoàn thành
          </div>
        </div>

        {/* Card 5: Chưa xếp loại */}
        <div
          onClick={() => {
            setActiveTabFilter('all');
            setRankingFilter('CHUA_XEP_LOAI');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            rankingFilter === 'CHUA_XEP_LOAI'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Chưa xếp loại</span>
            <Clock className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
            {rankingStats.chuaXepLoai}{' '}
            <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            Chờ BGH đánh giá
          </div>
        </div>

        {/* Card 6: Tổng cộng */}
        <div
          onClick={() => {
            setActiveTabFilter('all');
            setRankingFilter('all');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            rankingFilter === 'all' && activeTabFilter === 'all'
              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700">
            <span>Tổng cộng</span>
            <span className="font-bold text-slate-400">100%</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">
            {rankingStats.total}{' '}
            <span className="text-xs font-normal text-slate-500">phiếu</span>
          </div>
          <div className="text-[11px] text-indigo-800 font-semibold truncate mt-0.5">
            Đã xếp loại: {rankingStats.ranked}/{rankingStats.total}
          </div>
        </div>
      </div>

      {/* 3. FILTERS BAR (Requirement 11) + VIEW MODE TOGGLE */}
      <div className="bg-gradient-to-b from-slate-50/90 to-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span>Bộ Lọc Phiếu KPI & Kết Quả Xếp Loại</span>
          </div>

          {/* VIEW MODE TOGGLE BUTTONS */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'compact'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chế độ xem gọn: 9 cột chính chuẩn mực"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>☰ XEM GỌN</span>
            </button>

            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'detailed'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chế độ xem chi tiết: Mã, chức vụ, tổng điểm, người đánh giá"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>☷ XEM CHI TIẾT</span>
            </button>
          </div>
        </div>

        {/* QUICK PERIOD FILTER BAR (Kì I, Kì II, Cả năm, Theo tháng) */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Kỳ đánh giá:</span>
          </span>
          <div className="inline-flex rounded-xl border border-amber-200/80 p-0.5 bg-amber-50/50 shadow-2xs flex-wrap">
            <button
              onClick={() => {
                setPeriodFilter('all');
                setMonthFilter('all');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              Tất cả kỳ ({evaluationsList.filter((e) => targetType === 'bgh' ? (isCbqlEvaluation(e, staffList) || e.targetType === 'bgh') : e.targetType === targetType).length})
            </button>
            <button
              onClick={() => {
                setPeriodFilter('ki1');
                setMonthFilter('all');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                periodFilter === 'ki1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Kì I (Học kì I)</span>
            </button>
            <button
              onClick={() => {
                setPeriodFilter('ki2');
                setMonthFilter('all');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                periodFilter === 'ki2'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Kì II (Học kì II)</span>
            </button>
            <button
              onClick={() => {
                setPeriodFilter('canam');
                setMonthFilter('all');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                periodFilter === 'canam'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Cả năm (Cả năm học)</span>
            </button>
            <button
              onClick={() => setPeriodFilter('thang')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                periodFilter === 'thang'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-amber-700 hover:bg-amber-100/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Theo tháng</span>
            </button>
          </div>

          {periodFilter === 'thang' && (
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="py-1 px-2.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
            >
              <option value="all">Tất cả các tháng (1-12)</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>
              ))}
            </select>
          )}

          <div className="ml-auto text-xs text-slate-500 font-semibold hidden sm:block">
            Năm học <strong className="text-slate-800">{schoolYear}</strong>
          </div>
        </div>

        {/* 5 MAIN FILTER CONTROLS COLOR-CODED */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${targetType === 'bgh' ? 'lg:grid-cols-7' : 'lg:grid-cols-6'} gap-3 text-xs`}>
          {/* 1. Search Input: XANH DƯƠNG (#2563EB / #93C5FD / #EFF6FF) */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-blue-600 mb-1 flex items-center gap-1">
              <span>🔎 Tìm họ tên / mã:</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={targetType === 'bgh' ? 'Nhập tên CBQL, mã cán bộ...' : 'Nhập tên giáo viên, mã cán bộ...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50/30 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          {/* CBQL Tier Filter (Only for targetType === 'bgh') */}
          {targetType === 'bgh' && (
            <div>
              <label className="block text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                <span>👑 Phân loại CBQL:</span>
              </label>
              <select
                value={cbqlTierFilter}
                onChange={(e) => setCbqlTierFilter(e.target.value as any)}
                className="w-full p-1.5 rounded-xl border border-amber-300 bg-amber-50/40 font-bold text-amber-950 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 cursor-pointer text-xs transition"
              >
                <option value="all">Tất cả CBQL ({bghTierCounts.total})</option>
                <option value="bgh">Ban Giám hiệu ({bghTierCounts.bgh})</option>
                <option value="totruong">Tổ trưởng CM ({bghTierCounts.totruong})</option>
                <option value="topho">Tổ phó CM ({bghTierCounts.topho})</option>
              </select>
            </div>
          )}

          {/* 2. Department Filter: XANH LÁ (#059669 / #86EFAC / #F0FDF4) */}
          <div>
            <label className="block text-[11px] font-bold text-emerald-600 mb-1 flex items-center gap-1">
              <span>🏢 Tổ / Bộ phận:</span>
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-emerald-300 bg-emerald-50/40 font-semibold text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 cursor-pointer text-xs transition"
            >
              <option value="all">Tất cả tổ / bộ phận</option>
              {departmentOptions.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name} ({dept.staffCount})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Period Filter: CAM / VÀNG (#D97706 / #FBBF24 / #FFFBEB) */}
          <div>
            <label className="block text-[11px] font-bold text-amber-600 mb-1 flex items-center gap-1">
              <span>📅 Kỳ đánh giá:</span>
            </label>
            <select
              value={periodFilter}
              onChange={(e) => {
                const val = e.target.value as any;
                setPeriodFilter(val);
                if (val !== 'thang') setMonthFilter('all');
              }}
              className="w-full p-1.5 rounded-xl border border-amber-300 bg-amber-50/40 font-semibold text-amber-950 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer text-xs transition"
            >
              <option value="all">Tất cả các kỳ</option>
              <option value="ki1">📘 Kì I (Học kì I)</option>
              <option value="ki2">📙 Kì II (Học kì II)</option>
              <option value="canam">🏆 Cả năm (Cả năm học)</option>
              <option value="thang">📅 Theo tháng (Định kỳ)</option>
            </select>
          </div>

          {/* 4. Ranking Filter: TÍM (#7C3AED / #C4B5FD / #FAF5FF) */}
          <div>
            <label className="block text-[11px] font-bold text-purple-600 mb-1 flex items-center gap-1">
              <span>📊 Kết quả xếp loại:</span>
            </label>
            <select
              value={rankingFilter}
              onChange={(e) => setRankingFilter(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-purple-300 bg-purple-50/40 font-bold text-purple-950 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 cursor-pointer text-xs transition"
            >
              <option value="all">Tất cả kết quả</option>
              <option value="HTSXNV">HTSXNV - Xuất sắc</option>
              <option value="HTTNV">HTTNV - Tốt</option>
              <option value="HTNV">HTNV - Hoàn thành</option>
              <option value="KHTNV">KHTNV - Chưa hoàn thành</option>
              <option value="CHUA_XEP_LOAI">Chưa xếp loại (Chờ BGH)</option>
            </select>
          </div>

          {/* 5. Scoring Progress Filter: CYAN / TEAL (#0D9488 / #99F6E4 / #F0FDFA) & Reset */}
          <div>
            <label className="block text-[11px] font-bold text-teal-600 mb-1 flex items-center gap-1">
              <span>⏱️ Tiến độ chấm điểm:</span>
            </label>
            <div className="flex gap-1">
              <select
                value={scoringProgressFilter}
                onChange={(e) => setScoringProgressFilter(e.target.value)}
                className="flex-1 p-1.5 rounded-xl border border-teal-300 bg-teal-50/40 font-semibold text-teal-950 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20 cursor-pointer text-xs transition"
              >
                <option value="all">Tất cả tiến độ</option>
                <option value="self_zero">Cá nhân chưa chấm (0đ)</option>
                <option value="ttcm_pending">TTCM chưa chấm</option>
                <option value="bgh_pending">BGH chưa duyệt</option>
                <option value="all_scored">Đã chấm đủ cả 3 cấp</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-300 text-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition shadow-2xs"
                  title="Xóa tất cả bộ lọc về mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABLE & MOBILE CARDS OF KPI EVALUATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {createdEvaluations.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-10 sm:p-14 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 border-2 border-blue-200 flex items-center justify-center mx-auto shadow-sm">
              <FileCheck2 className="w-8 h-8 stroke-[1.8]" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                {hasActiveFilters ? 'KHÔNG TÌM THẤY PHIẾU PHÙ HỢP' : 'CHƯA CÓ PHIẾU KPI'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {hasActiveFilters
                  ? 'Không có phiếu KPI nào khớp với điều kiện lọc hiện tại. Vui lòng thử lại với bộ lọc khác hoặc nhấn Xóa bộ lọc.'
                  : `Hiện chưa có phiếu KPI nào được tạo cho kỳ đánh giá này (${moduleInfo.title}). Hãy nhấn nút bên dưới để tạo phiếu đánh giá đầu tiên.`}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>+ TẠO PHIẾU KPI</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================
                A. DESKTOP / LAPTOP TABLE VIEW (Requirements 1, 2, 3, 6, 7, 8, 10)
                - Column header: "KẾT QUẢ XẾP LOẠI" (Never use "Trạng thái")
                - Sticky left: STT, GIÁO VIÊN
                - Sticky right: KẾT QUẢ XẾP LOẠI, THAO TÁC (ALWAYS VISIBLE!)
               ======================================================== */}
            <div className="hidden md:block overflow-x-auto max-h-[72vh] relative">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold border-b border-slate-800 uppercase tracking-wider text-[12px] sticky top-0 z-20 shadow-xs">
                    {/* STT - Sticky left */}
                    <th className="py-3 px-3 text-center w-12 border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
                      STT
                    </th>

                    {/* MÃ (Only in detailed mode) */}
                    {viewMode === 'detailed' && (
                      <th className="py-3 px-3 border-r border-slate-800 w-[72px] sticky left-12 z-30 bg-slate-900">
                        MÃ
                      </th>
                    )}

                    {/* GIÁO VIÊN - Sticky left */}
                    <th
                      className={`py-3 px-3 border-r border-slate-800 ${
                        viewMode === 'detailed'
                          ? 'w-[180px] sticky left-[120px]'
                          : 'w-[200px] sticky left-12'
                      } z-30 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]`}
                    >
                      {moduleInfo.personLabel.toUpperCase()}
                    </th>

                    {/* TỔ / BỘ PHẬN */}
                    <th className="py-3 px-3 border-r border-slate-800 w-[150px]">
                      TỔ / BỘ PHẬN
                    </th>

                    {/* CHỨC VỤ (Detailed mode only) */}
                    {viewMode === 'detailed' && (
                      <th className="py-3 px-3 border-r border-slate-800 w-[120px]">
                        CHỨC VỤ
                      </th>
                    )}

                    {/* KỲ ĐÁNH GIÁ */}
                    <th className="py-3 px-2 border-r border-slate-800 text-center w-[110px]">
                      KỲ ĐÁNH GIÁ
                    </th>

                    {/* ĐIỂM CÁ NHÂN */}
                    <th className="py-3 px-2 border-r border-slate-800 text-center w-[100px] bg-slate-900/90 text-amber-200">
                      ĐIỂM CÁ NHÂN
                    </th>

                    {targetType === 'bgh' ? (
                      <>
                        {/* NGƯỜI / HỘI ĐỒNG ĐÁNH GIÁ */}
                        <th className="py-3 px-3 border-r border-slate-800 text-center min-w-[180px] bg-slate-900/90 text-cyan-200">
                          NGƯỜI / HỘI ĐỒNG ĐÁNH GIÁ
                        </th>

                        {/* TỔNG ĐIỂM */}
                        <th className="py-3 px-2 border-r border-slate-800 text-center w-[100px] bg-slate-900/90 text-emerald-200">
                          TỔNG ĐIỂM
                        </th>
                      </>
                    ) : (
                      <>
                        {/* TTCM ĐÁNH GIÁ */}
                        <th className="py-3 px-2 border-r border-slate-800 text-center w-[105px] bg-slate-900/90 text-blue-200">
                          TTCM ĐÁNH GIÁ
                        </th>

                        {/* BGH ĐÁNH GIÁ/DUYỆT */}
                        <th className="py-3 px-2 border-r border-slate-800 text-center w-[105px] bg-slate-900/90 text-emerald-200">
                          BGH DUYỆT
                        </th>

                        {/* TỔNG ĐIỂM (Detailed mode only) */}
                        {viewMode === 'detailed' && (
                          <>
                            <th className="py-3 px-2 border-r border-slate-800 text-center w-20">
                              TỔNG ĐIỂM
                            </th>
                            <th className="py-3 px-3 border-r border-slate-800 w-36">
                              NGƯỜI ĐÁNH GIÁ
                            </th>
                          </>
                        )}
                      </>
                    )}

                    {/* KẾT QUẢ XẾP LOẠI - Sticky right (Requirement 1 & 10) */}
                    <th className="py-3 px-3 border-r border-slate-800 text-center w-[145px] sticky right-[160px] z-30 bg-slate-900 border-l border-slate-800">
                      KẾT QUẢ XẾP LOẠI
                    </th>

                    {/* THAO TÁC - Sticky right (ALWAYS VISIBLE!) */}
                    <th className="py-3 px-3 text-center w-[160px] sticky right-0 z-30 bg-slate-900 border-l border-slate-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {createdEvaluations.map((evalItem, idx) => {
                    const displayMonth = evalItem.month || globalMonth;
                    const displayYear = evalItem.year || 2026;
                    const scoresInfo = getEvaluationDisplayScores(evalItem);
                    const rankRes = getKpiRankingResult(evalItem);
                    const isNearBottom = idx >= createdEvaluations.length - 2;

                    return (
                      <tr
                        key={evalItem.id}
                        className="hover:bg-blue-50/40 transition-colors group h-[58px]"
                      >
                        {/* 1. STT - Sticky left */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-blue-50/70">
                          {idx + 1}
                        </td>

                        {/* 2. MÃ (Detailed mode only) */}
                        {viewMode === 'detailed' && (
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 border-r border-slate-200 sticky left-12 z-10 bg-white group-hover:bg-blue-50/70">
                            {evalItem.staffCode}
                          </td>
                        )}

                        {/* 3. GIÁO VIÊN - Sticky left */}
                        <td
                          className={`py-2.5 px-3 border-r border-slate-200 ${
                            viewMode === 'detailed'
                              ? 'sticky left-[120px]'
                              : 'sticky left-12'
                          } z-10 bg-white group-hover:bg-blue-50/70 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                        >
                          <div className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-1 flex items-center gap-1.5 flex-wrap">
                            <span>{evalItem.staffName}</span>
                            {targetType === 'bgh' && (() => {
                              const staffObj = staffList.find((s) => s.id === evalItem.staffId || s.code === evalItem.staffCode);
                              const cat = getCbqlCategory(staffObj || { position: evalItem.position });
                              const catBadge = getCbqlCategoryBadge(cat);
                              return (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${catBadge.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${catBadge.dotColor}`} />
                                  <span>{catBadge.shortLabel}</span>
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                            {viewMode === 'compact' && (
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1 rounded text-[10px]">
                                {evalItem.staffCode}
                              </span>
                            )}
                            <span className="truncate max-w-[140px]">
                              {evalItem.subject
                                ? `Môn ${evalItem.subject}`
                                : evalItem.position}
                            </span>
                          </div>
                        </td>

                        {/* 4. TỔ / BỘ PHẬN */}
                        <td className="py-2.5 px-3 text-slate-700 font-semibold border-r border-slate-200">
                          <div className="line-clamp-2 leading-tight">
                            {evalItem.department}
                          </div>
                        </td>

                        {/* 5. CHỨC VỤ (Detailed mode only) */}
                        {viewMode === 'detailed' && (
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 text-xs">
                            {evalItem.position}
                          </td>
                        )}

                        {/* 6. KỲ ĐÁNH GIÁ */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          {(() => {
                            const pBadge = getEvaluationPeriodBadge(evalItem);
                            return (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-xs ${pBadge.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${pBadge.dotColor}`} />
                                  <span>{pBadge.label}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                  {evalItem.schoolYear || displayYear}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 7. ĐIỂM CÁ NHÂN */}
                        <td
                          onClick={() => handleOpenEvaluation(evalItem, 'tier1')}
                          className="py-2.5 px-2 text-center border-r border-slate-200 bg-amber-50/30 cursor-pointer hover:bg-amber-100/60 transition"
                          title="Bấm để mở form Cá nhân tự đánh giá"
                        >
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap hover:scale-105 transition-transform">
                            {scoresInfo.selfTotal}/100
                          </span>
                        </td>

                        {targetType === 'bgh' ? (
                          <>
                            {/* NGƯỜI / HỘI ĐỒNG ĐÁNH GIÁ */}
                            <td
                              onClick={() => handleOpenEvaluation(evalItem, 'tier3')}
                              className="py-2.5 px-3 text-center border-r border-slate-200 bg-cyan-50/20 cursor-pointer hover:bg-cyan-100/60 transition"
                              title="Bấm để mở form BGH/Hội đồng đánh giá"
                            >
                              {(() => {
                                const evalDisplay = getCbqlEvaluatorDisplay(evalItem, staffList);
                                if (evalDisplay.type === 'COUNCIL') {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                                      <span>🏛️</span>
                                      <span>Hội đồng Thi đua – Khen thưởng</span>
                                    </span>
                                  );
                                }
                                return (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs"
                                    title={evalDisplay.fullDisplay}
                                  >
                                    <span>👑</span>
                                    <span className="font-extrabold">{evalDisplay.name}</span>
                                    {evalDisplay.role && !evalDisplay.name.includes(evalDisplay.role) && (
                                      <span className="text-[10px] text-emerald-700 font-medium">({evalDisplay.role})</span>
                                    )}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* TỔNG ĐIỂM */}
                            <td
                              onClick={() => handleOpenEvaluation(evalItem, 'tier3')}
                              className="py-2.5 px-2 text-center border-r border-slate-200 bg-emerald-50/30 cursor-pointer hover:bg-emerald-100/60 transition"
                              title="Bấm để mở form BGH đánh giá & duyệt"
                            >
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 whitespace-nowrap hover:scale-105 transition-transform">
                                {scoresInfo.finalScore}/100
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* 8. TTCM ĐÁNH GIÁ */}
                            <td
                              onClick={() => handleOpenEvaluation(evalItem, 'tier2')}
                              className="py-2.5 px-2 text-center border-r border-slate-200 bg-blue-50/30 cursor-pointer hover:bg-blue-100/60 transition"
                              title="Bấm để mở form TTCM đánh giá"
                            >
                              {scoresInfo.hasTtcmEvaluated ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 whitespace-nowrap hover:scale-105 transition-transform">
                                  {scoresInfo.ttcmScoreLabel}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-xs hover:text-blue-700 hover:underline">
                                  Chưa chấm
                                </span>
                              )}
                            </td>

                            {/* 9. BGH ĐÁNH GIÁ/DUYỆT */}
                            <td
                              onClick={() => handleOpenEvaluation(evalItem, 'tier3')}
                              className="py-2.5 px-2 text-center border-r border-slate-200 bg-emerald-50/30 cursor-pointer hover:bg-emerald-100/60 transition"
                              title="Bấm để mở form BGH đánh giá & duyệt"
                            >
                              {scoresInfo.hasBghEvaluated ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 whitespace-nowrap hover:scale-105 transition-transform">
                                  {scoresInfo.bghScoreLabel}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-xs hover:text-emerald-700 hover:underline">
                                  Chưa chấm
                                </span>
                              )}
                            </td>

                            {/* TỔNG ĐIỂM (Detailed mode only) */}
                            {viewMode === 'detailed' && (
                              <>
                                <td className="py-2.5 px-2 text-center font-black text-sm border-r border-slate-200 text-blue-900">
                                  {scoresInfo.finalScore}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 text-xs truncate max-w-[140px]">
                                  {evalItem.evaluatorName || '—'}
                                </td>
                              </>
                            )}
                          </>
                        )}

                        {/* 10. KẾT QUẢ XẾP LOẠI - Sticky right (Requirement 1, 2, 7) */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 sticky right-[160px] z-10 bg-white group-hover:bg-blue-50/70 border-l border-slate-200">
                          {renderRankingBadge(rankRes)}
                        </td>

                        {/* 11. THAO TÁC - Sticky right (ALWAYS VISIBLE!) */}
                        <td className="py-2.5 px-3 text-center sticky right-0 z-10 bg-white group-hover:bg-blue-50/70 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                          <div className="flex items-center justify-center gap-1.5 relative">
                            {/* Dynamic 3-Tier Action Button */}
                            {renderEvaluationButton(evalItem)}

                            {/* Preview button */}
                            <button
                              onClick={() => setPreviewEvaluation(evalItem)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
                              title="Xem chi tiết phiếu"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Dropdown More button [...] */}
                            <div className="relative">
                              <button
                                type="button"
                                ref={(el) => (actionButtonRefs.current[evalItem.id] = el)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeActionMenuId === evalItem.id) {
                                    setActiveActionMenuId(null);
                                  } else {
                                    const btnEl = actionButtonRefs.current[evalItem.id];
                                    if (btnEl) {
                                      const rect = btnEl.getBoundingClientRect();
                                      const menuWidth = 208;
                                      const menuHeight = isBgh ? 210 : 160;

                                      const spaceRight = window.innerWidth - rect.right;
                                      const spaceBottom = window.innerHeight - rect.bottom;

                                      let left = rect.right - menuWidth;
                                      if (spaceRight < menuWidth && rect.left >= menuWidth) {
                                        left = rect.left - menuWidth + rect.width;
                                      }
                                      if (left < 10) left = 10;
                                      if (left + menuWidth > window.innerWidth - 10) {
                                        left = window.innerWidth - menuWidth - 10;
                                      }

                                      let top = rect.bottom + 6;
                                      if (spaceBottom < menuHeight && rect.top >= menuHeight) {
                                        top = rect.top - menuHeight - 6;
                                      }

                                      setDropdownPos({ top, left });
                                    }
                                    setActiveActionMenuId(evalItem.id);
                                  }
                                }}
                                className="teacher-kpi-action-btn p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer font-bold shrink-0"
                                title="Thao tác khác"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {activeActionMenuId === evalItem.id &&
                                ReactDOM.createPortal(
                                  <div
                                    className="teacher-kpi-action-portal-menu fixed w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[999999] text-left animate-in fade-in zoom-in-95"
                                    style={{
                                      top: `${dropdownPos.top}px`,
                                      left: `${dropdownPos.left}px`,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        handleOpenEvaluation(evalItem);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-medium transition cursor-pointer"
                                    >
                                      <Edit className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span>Chỉnh sửa / Chấm điểm</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        openPrintModal(
                                          `PHIẾU ĐÁNH GIÁ KPI - ${evalItem.staffName.toUpperCase()}`,
                                          `Kỳ đánh giá: Tháng ${String(evalItem.month || globalMonth).padStart(2, '0')}/${evalItem.year || 2026}`
                                        );
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium transition cursor-pointer"
                                    >
                                      <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                                      <span>In phiếu A4 / PDF</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        handleExportSingleWord(evalItem);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2 font-medium transition cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span>Tải file Word (.doc)</span>
                                    </button>

                                    {isBgh && (
                                      <>
                                        <div className="my-1.5 border-t border-slate-100" />
                                        <button
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            setDeletingEvalId(evalItem.id);
                                          }}
                                          className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                                          <span>Xóa phiếu</span>
                                        </button>
                                      </>
                                    )}
                                  </div>,
                                  document.body
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ========================================================
                B. MOBILE / TABLET CARD VIEW
               ======================================================== */}
            <div className="block md:hidden divide-y divide-slate-200">
              {createdEvaluations.map((evalItem, idx) => {
                const displayMonth = evalItem.month || globalMonth;
                const displayYear = evalItem.year || 2026;
                const scoresInfo = getEvaluationDisplayScores(evalItem);
                const rankRes = getKpiRankingResult(evalItem);

                return (
                  <div key={evalItem.id} className="p-4 space-y-3 hover:bg-slate-50/80 transition">
                    {/* Header: Teacher Name, Code, Dept */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {evalItem.staffCode}
                          </span>
                          {(() => {
                            const pBadge = getEvaluationPeriodBadge(evalItem);
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${pBadge.badgeClass}`}>
                                <span className={`w-1 h-1 rounded-full ${pBadge.dotColor}`} />
                                <span>{pBadge.label}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-1">
                          {evalItem.staffName}
                        </h4>
                        <div className="text-xs text-slate-600 font-medium">
                          {evalItem.department} •{' '}
                          {evalItem.subject ? `Môn ${evalItem.subject}` : evalItem.position}
                        </div>
                      </div>

                      <div>{renderRankingBadge(rankRes)}</div>
                    </div>

                    {/* 3 Scores Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Cá nhân</div>
                        <div className="text-xs font-black text-amber-900 mt-0.5">
                          {scoresInfo.selfTotal}/100
                        </div>
                      </div>
                      <div className="border-x border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">TTCM</div>
                        <div className="text-xs font-black text-blue-900 mt-0.5">
                          {scoresInfo.ttcmScoreLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">BGH duyệt</div>
                        <div className="text-xs font-black text-emerald-900 mt-0.5">
                          {scoresInfo.bghScoreLabel}
                        </div>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-xs">
                        <span className="text-slate-500">BGH duyệt: </span>
                        <strong className="text-blue-900 font-black">
                          {scoresInfo.hasBghEvaluated ? `${scoresInfo.bghScoreNum}đ` : 'Chưa chấm'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {renderEvaluationButton(evalItem)}

                        <button
                          onClick={() => setPreviewEvaluation(evalItem)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 bg-slate-100"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer Summary */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Hiển thị <strong className="text-slate-800">{createdEvaluations.length}</strong> /{' '}
            {baseEvaluations.length} phiếu KPI ({moduleInfo.title})
            {viewMode === 'compact' ? (
              <span className="ml-2 text-blue-700 font-semibold">• Chế độ xem gọn</span>
            ) : (
              <span className="ml-2 text-indigo-700 font-semibold">• Chế độ xem chi tiết</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Cột Kết quả xếp loại & Thao tác cố định bên phải • Chuẩn THPT Phương Xá
          </div>
        </div>
      </div>
    </>
  )}

      {/* CREATE KPI MODAL */}
      <CreateKpiModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPreselectedStaffId(undefined);
        }}
        targetType={targetType}
        initialSelectedStaffId={preselectedStaffId}
        initialPeriod={periodFilter !== 'all' ? periodFilter : 'ki1'}
      />

      {/* RANKING TIERS CONFIGURATION MODAL (Requirement 5) */}
      <KpiRankingConfigModal
        isOpen={isRankingConfigModalOpen}
        onClose={() => setIsRankingConfigModalOpen(false)}
        onUpdated={() => setRankingVersion((v) => v + 1)}
      />

      {/* DELETE EVALUATION CONFIRM MODAL */}
      {deletingEvalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-center">
            <h3 className="font-extrabold text-slate-900 text-base mb-2">
              Xác nhận xóa phiếu KPI
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa bản ghi phiếu KPI này khỏi hệ thống? Dữ liệu đánh giá của
              phiếu này sẽ bị hủy bỏ.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeletingEvalId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  deleteEvaluation(deletingEvalId);
                  setDeletingEvalId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW EVALUATION MODAL (Requirement 9) */}
      {previewEvaluation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-blue-200 uppercase">
                  CHI TIẾT PHIẾU ĐÁNH GIÁ KPI
                </div>
                <h3 className="font-extrabold text-sm">{previewEvaluation.staffName}</h3>
              </div>
              <button
                onClick={() => setPreviewEvaluation(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px]">Mã cán bộ:</span>
                  <div className="font-bold text-slate-800">{previewEvaluation.staffCode}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Tổ / Phòng ban:</span>
                  <div className="font-bold text-slate-800">{previewEvaluation.department}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Chức vụ:</span>
                  <div className="font-medium text-slate-800">{previewEvaluation.position}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Kỳ đánh giá:</span>
                  <div className="font-extrabold text-blue-900 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {(() => {
                      const pBadge = getEvaluationPeriodBadge(previewEvaluation);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${pBadge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pBadge.dotColor}`} />
                          <span>{pBadge.label}</span>
                        </span>
                      );
                    })()}
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({previewEvaluation.schoolYear || '2026 - 2027'})
                    </span>
                  </div>
                </div>
              </div>

              {(() => {
                const prevScores = getEvaluationDisplayScores(previewEvaluation);
                const prevRank = getKpiRankingResult(previewEvaluation);
                const isCbql = isCbqlEvaluation(previewEvaluation, staffList);
                const evalDisplay = getCbqlEvaluatorDisplay(previewEvaluation, staffList);

                return (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">TỔNG ĐIỂM CÁ NHÂN:</span>
                      <span className="font-bold text-slate-800">{prevScores.selfTotal}/100</span>
                    </div>
                    {isCbql ? (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-500">
                            {evalDisplay.type === 'COUNCIL' ? 'HỘI ĐỒNG ĐÁNH GIÁ:' : 'NGƯỜI ĐÁNH GIÁ (BGH):'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {evalDisplay.type === 'COUNCIL' ? '🏛️ Hội đồng Thi đua – Khen thưởng' : `👑 ${evalDisplay.fullDisplay}`}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">TỔNG ĐIỂM KPI:</span>
                          <span className="font-bold text-emerald-900">{prevScores.finalScore}/100</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">TỔNG ĐIỂM TTCM:</span>
                          <span className="font-bold text-blue-900">{prevScores.ttcmScoreLabel}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">TỔNG ĐIỂM BGH:</span>
                          <span className="font-bold text-emerald-900">{prevScores.bghScoreLabel}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 bg-blue-50/50 px-2.5 rounded-xl">
                      <span className="font-black text-slate-800 text-xs">
                        KẾT QUẢ XẾP LOẠI:
                      </span>
                      <div>{renderRankingBadge(prevRank)}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2">
                <button
                  onClick={() => handleExportSingleWord(previewEvaluation)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-200" />
                  <span>Tải file Word (.doc)</span>
                </button>
                <button
                  onClick={() => {
                    const targetEval = previewEvaluation;
                    setPreviewEvaluation(null);
                    handleOpenEvaluation(targetEval);
                  }}
                  className="w-full sm:flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs text-center shadow-xs transition cursor-pointer"
                >
                  Mở Phiếu Chấm Điểm Chi Tiết →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL EVALUATIONS MODAL */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-200" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Xóa Toàn Bộ Phiếu Đánh Giá KPI
                </h3>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed font-medium">
                ⚠️ <strong className="font-bold">Cảnh báo:</strong> Hành động này sẽ xóa vĩnh viễn
                các bản ghi phiếu đánh giá KPI khỏi cơ sở dữ liệu. Dữ liệu nhân sự (CBGVNV) vẫn được
                giữ nguyên.
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Lựa chọn phạm vi xóa:</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="clearScope"
                      checked={clearScope === 'module'}
                      onChange={() => setClearScope('module')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">
                        Chỉ xóa phiếu KPI thuộc module hiện tại ({moduleInfo.title})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Xóa tất cả {createdEvaluations.length} phiếu KPI của đối tượng{' '}
                        {moduleInfo.title}.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="radio"
                      name="clearScope"
                      checked={clearScope === 'all'}
                      onChange={() => setClearScope('all')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="font-bold text-rose-700">
                        Xóa TOÀN BỘ phiếu KPI trong toàn hệ thống
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Xóa tất cả {evaluationsList.length} phiếu KPI của CBQL, Giáo viên và Nhân
                        viên.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const scopeToClear = clearScope === 'module' ? targetType : 'all';
                    setIsClearAllModalOpen(false);
                    await clearAllEvaluations(scopeToClear);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  Đồng ý xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 3-Tier Professional Evaluation Modal */}
      <ThreeTierKpiEvaluationModal
        isOpen={isThreeTierModalOpen}
        onClose={() => {
          setIsThreeTierModalOpen(false);
          setSelectedEvalFor3Tier(null);
        }}
        evaluationRecord={selectedEvalFor3Tier}
        initialStaffId={preselectedStaffId}
        initialTier={selectedTierFor3Tier}
      />
    </div>
  );
};
