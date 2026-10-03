import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useKpi } from '../context/KpiContext';
import { StaffMember, TeacherKpiEvaluation, EvaluationPeriod, getDepartmentId, getDepartmentDisplayName } from '../types';
import { getEvaluationPeriod, getEvaluationPeriodLabel } from '../utils/periodUtils';
import {
  STAFF_GENERAL_KPI_CRITERIA,
  OFFICIAL_STAFF_POSITIONS,
  StaffPositionDefinition,
  detectStaffPositionKey,
  calculateKpiRank,
  KPI_OFFICE_PRINCIPLES,
  KpiCriterionItem,
  getOfficialStaffCriteria,
} from '../data/kpiEvaluationTemplates';
import {
  Briefcase,
  Award,
  Save,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Check,
  Building2,
  FileSpreadsheet,
  Users,
  Search,
  BookOpen,
  Info,
  Layers,
  ArrowRight,
  ArrowLeft,
  PlusCircle,
  X,
  Eye,
  Edit,
  Edit2,
  Trash2,
  FileText,
  Clock,
  ShieldCheck,
  UserPlus,
  HelpCircle,
  Settings,
  Target,
  Calendar,
} from 'lucide-react';
import { getRankBadgeClass, exportKpiEvaluationToWord, exportKpiEvaluationToExcel } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import {
  StaffRankingTier,
  DEFAULT_STAFF_RANKING_TIERS,
  fetchStaffRankingTiers,
  saveStaffRankingTiers,
  calculateStaffRank,
  getStaffRankBadgeClass,
  StaffCriteriaConfig,
  fetchStaffCriteriaConfig,
  saveStaffCriteriaConfig,
} from '../services/staffKpiService';
import { StaffRankingConfigModal } from './StaffRankingConfigModal';

import { StaffClearEvaluationsModal } from './StaffClearEvaluationsModal';
import { StaffPrintListModal } from './StaffPrintListModal';
import { StaffCriteriaManagementModal } from './StaffCriteriaManagementModal';
import { StaffAddCriterionModal } from './StaffAddCriterionModal';
import { StaffEditCriteriaModal } from './StaffEditCriteriaModal';
import { StaffExportKpiFormsModal } from './StaffExportKpiFormsModal';
import { dbBulkDeleteEvaluations } from '../services/dbService';

interface StaffKpiModuleViewProps {
  evaluationRecord?: TeacherKpiEvaluation;
}

export type EvaluatorCategory = 'BGH' | 'TOTRUONG';

export interface EvaluatorOption {
  id: string;
  name: string;
  position: string;
  code?: string;
  roleType: 'principal' | 'vice_principal' | 'team_leader';
  category: EvaluatorCategory;
  departmentId: string;
  departmentName: string;
}

export type BghEvaluatorOption = EvaluatorOption;

export const StaffKpiModuleView: React.FC<StaffKpiModuleViewProps> = ({ evaluationRecord }) => {
  const {
    staffList,
    addStaff,
    schoolYear,
    schoolConfig,
    currentUser,
    saveEvaluation,
    deleteEvaluation,
    evaluationsList,
    showToast,
    openPrintModal,
    setActiveTab,
  } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  // 1. All Office Staff (Tổ Văn phòng)
  const officeStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (s.is_active === false) return false;
      const deptId = getDepartmentId(s.departmentId || s.department_id || s.department, s.type);
      return (
        deptId === 'to-van-phong' ||
        s.type === 'nhanvien' ||
        s.employee_type === 'NHAN_VIEN' ||
        s.department === 'Tổ Văn phòng'
      );
    });
  }, [staffList]);

  // 2. Existing Office Staff KPI Evaluations
  const officeEvaluations = useMemo(() => {
    return evaluationsList.filter((e) => {
      if (e.targetType === 'nhanvien') return true;
      const deptId = getDepartmentId(e.department_id || e.department, e.targetType);
      return deptId === 'to-van-phong';
    });
  }, [evaluationsList]);

  // UI state
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'sheet'>(() => {
    return evaluationRecord ? 'sheet' : 'list';
  });

  // Filter & Search in List
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [searchStaffQuery, setSearchStaffQuery] = useState<string>('');

  // 1. Dynamic Ranking Tiers State (Requirement 1 - Configured dynamically)
  const [rankingTiers, setRankingTiers] = useState<StaffRankingTier[]>(() => DEFAULT_STAFF_RANKING_TIERS);
  const [isRankingConfigOpen, setIsRankingConfigOpen] = useState(false);

  // 2. Dynamic Staff Criteria Configuration State (Requirement 4)
  const [criteriaConfig, setCriteriaConfig] = useState<StaffCriteriaConfig>(() => ({
    generalCriteria: STAFF_GENERAL_KPI_CRITERIA,
    positionCriteriaMap: OFFICIAL_STAFF_POSITIONS.reduce((acc, pos) => {
      acc[pos.key] = JSON.parse(JSON.stringify(pos.criteria));
      return acc;
    }, {} as Record<string, KpiCriterionItem[]>),
    version: 1,
  }));


  // 3. Delete Single Evaluation Modal State & Handler
  const [deletingEvalRecord, setDeletingEvalRecord] = useState<TeacherKpiEvaluation | null>(null);
  const [isDeletingEval, setIsDeletingEval] = useState(false);

  // 4. Dirty tracking & Unsaved changes modal state
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);

  const handleBackToMainList = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      setActiveViewMode('list');
      setCurrentEvalRecord(null);
      setIsDirty(false);
    }
  };

  const handleConfirmDeleteEvaluation = async () => {
    if (!deletingEvalRecord) return;
    if (!isBgh && (currentUser as any)?.role !== 'admin') {
      showToast('Bạn không có quyền xóa phiếu KPI.', 'error');
      setDeletingEvalRecord(null);
      return;
    }

    setIsDeletingEval(true);
    try {
      await deleteEvaluation(deletingEvalRecord.id);
      showToast('✓ Đã xóa phiếu KPI thành công.', 'success');
      setDeletingEvalRecord(null);
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      showToast('❌ Không thể xóa phiếu KPI. Vui lòng thử lại.', 'error');
    } finally {
      setIsDeletingEval(false);
    }
  };
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // 4. Print List Modal State (Requirement 3)
  const [isPrintListOpen, setIsPrintListOpen] = useState(false);

  // 5. Criteria Management Modal State (Requirement 1)
  const [isCriteriaManagementOpen, setIsCriteriaManagementOpen] = useState(false);

  // Load Ranking Tiers & Criteria Config from Firestore on Mount
  useEffect(() => {
    fetchStaffRankingTiers().then((t) => {
      if (t && t.length > 0) setRankingTiers(t);
    });
    fetchStaffCriteriaConfig().then((c) => {
      if (c && c.generalCriteria) setCriteriaConfig(c);
    });
  }, []);

  // Danh sách Người đánh giá Ban Giám hiệu (Hiệu trưởng & Các Phó Hiệu trưởng)
  const bghEvaluators = useMemo<EvaluatorOption[]>(() => {
    const list: EvaluatorOption[] = [];

    staffList.forEach((s) => {
      if (s.is_active === false) return;
      const pos = (s.position || '').trim();
      const posLower = pos.toLowerCase();
      const concurrentLower = (s.concurrentPosition || '').toLowerCase();
      const deptLower = (s.department || '').toLowerCase();
      const deptIdLower = (s.departmentId || s.department_id || '').toLowerCase();

      const isBgh =
        (s.type === 'bgh' ||
         s.employee_type === 'BGH' ||
         deptLower.includes('ban giám hiệu') ||
         deptIdLower === 'ban-giam-hieu' ||
         posLower.includes('hiệu trưởng') ||
         posLower.includes('phó hiệu trưởng') ||
         concurrentLower.includes('hiệu trưởng') ||
         concurrentLower.includes('phó hiệu trưởng')) &&
        !posLower.includes('tổ trưởng') &&
        !concurrentLower.includes('tổ trưởng') &&
        !posLower.includes('tổ phó') &&
        !concurrentLower.includes('tổ phó');

      if (isBgh) {
        const isPrincipal =
          (posLower.includes('hiệu trưởng') && !posLower.includes('phó')) ||
          posLower === 'hiệu trưởng';
        list.push({
          id: s.id,
          name: s.name,
          position: s.position || (isPrincipal ? 'Hiệu trưởng' : 'Phó Hiệu trưởng'),
          code: s.code,
          roleType: isPrincipal ? 'principal' : 'vice_principal',
          category: 'BGH',
          departmentId: 'ban-giam-hieu',
          departmentName: 'Ban Giám hiệu',
        });
      }
    });

    // Sắp xếp: Hiệu trưởng đứng đầu, sau đó đến các Phó Hiệu trưởng
    list.sort((a, b) => {
      if (a.roleType === 'principal' && b.roleType !== 'principal') return -1;
      if (a.roleType !== 'principal' && b.roleType === 'principal') return 1;
      return a.name.localeCompare(b.name, 'vi');
    });

    // Dự phòng nếu cơ sở dữ liệu chưa có danh sách BGH
    if (list.length === 0) {
      return [
        {
          id: 'bgh-01',
          name: 'Thầy Lê Quốc Tuấn',
          position: 'Hiệu trưởng',
          code: 'BGH001',
          roleType: 'principal',
          category: 'BGH',
          departmentId: 'ban-giam-hieu',
          departmentName: 'Ban Giám hiệu',
        },
        {
          id: 'bgh-02',
          name: 'Cô Đặng Thu Hằng',
          position: 'Phó Hiệu trưởng (Chuyên môn)',
          code: 'BGH002',
          roleType: 'vice_principal',
          category: 'BGH',
          departmentId: 'ban-giam-hieu',
          departmentName: 'Ban Giám hiệu',
        },
        {
          id: 'bgh-03',
          name: 'Thầy Nguyễn Văn Long',
          position: 'Phó Hiệu trưởng (Cơ sở vật chất - Nề nếp)',
          code: 'BGH003',
          roleType: 'vice_principal',
          category: 'BGH',
          departmentId: 'ban-giam-hieu',
          departmentName: 'Ban Giám hiệu',
        },
      ];
    }

    return list;
  }, [staffList]);

  // Danh sách Tổ trưởng của toàn trường (trích xuất từ hồ sơ nhân sự)
  const allTeamLeaders = useMemo<EvaluatorOption[]>(() => {
    const list: EvaluatorOption[] = [];
    const seen = new Set<string>();

    staffList.forEach((s) => {
      if (s.is_active === false) return;
      const pos = (s.position || '').trim();
      const posLower = pos.toLowerCase();
      const concurrent = (s.concurrentPosition || '').trim();
      const concurrentLower = concurrent.toLowerCase();

      // Kiểm tra người này có vai trò Tổ trưởng hay không (không tính Ban Giám hiệu thuần túy)
      const isLeader =
        posLower.includes('tổ trưởng') ||
        concurrentLower.includes('tổ trưởng') ||
        posLower.includes('ttcm') ||
        concurrentLower.includes('ttcm');

      const isPrincipal = posLower.includes('hiệu trưởng') && !posLower.includes('tổ');

      if (isLeader && !isPrincipal) {
        const deptId = getDepartmentId(s.departmentId || s.department_id || s.department, s.type);
        const deptName = getDepartmentDisplayName(deptId);
        if (!seen.has(s.id)) {
          seen.add(s.id);
          list.push({
            id: s.id,
            name: s.name,
            position: pos || `Tổ trưởng ${deptName}`,
            code: s.code,
            roleType: 'team_leader',
            category: 'TOTRUONG',
            departmentId: deptId,
            departmentName: deptName,
          });
        }
      }
    });

    // Đảm bảo luôn có Tổ trưởng Tổ Văn phòng của THPT Phương Xá
    const hasOfficeLeader = list.some((l) => l.departmentId === 'to-van-phong');
    if (!hasOfficeLeader) {
      const officeStaffCandidate = staffList.find((s) => {
        const dId = getDepartmentId(s.departmentId || s.department_id || s.department, s.type);
        return dId === 'to-van-phong' && (s.name.includes('Hạnh') || s.name.includes('Hoàng Mỹ Hạnh') || (s.position || '').toLowerCase().includes('trưởng'));
      });

      if (officeStaffCandidate && !seen.has(officeStaffCandidate.id)) {
        list.push({
          id: officeStaffCandidate.id,
          name: officeStaffCandidate.name,
          position: officeStaffCandidate.position?.includes('Tổ trưởng') ? officeStaffCandidate.position : 'Tổ trưởng Tổ Văn phòng',
          code: officeStaffCandidate.code,
          roleType: 'team_leader',
          category: 'TOTRUONG',
          departmentId: 'to-van-phong',
          departmentName: 'Tổ Văn phòng',
        });
      } else {
        list.push({
          id: 'nv-ttvp-01',
          name: 'Hoàng Mỹ Hạnh',
          position: 'Tổ trưởng Tổ Văn phòng',
          code: 'TTVP01',
          roleType: 'team_leader',
          category: 'TOTRUONG',
          departmentId: 'to-van-phong',
          departmentName: 'Tổ Văn phòng',
        });
      }
    }

    list.sort((a, b) => a.departmentName.localeCompare(b.departmentName, 'vi') || a.name.localeCompare(b.name, 'vi'));
    return list;
  }, [staffList]);

  // Tổng hợp tất cả người đánh giá có thể có (BGH + Tổ trưởng)
  const allAvailableEvaluators = useMemo<EvaluatorOption[]>(() => {
    return [...bghEvaluators, ...allTeamLeaders];
  }, [bghEvaluators, allTeamLeaders]);

  // 4. Modal "+ TẠO PHIẾU ĐÁNH GIÁ KPI NHÂN VIÊN"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Modal Step 1: Vị trí việc làm (key: ketoan, thuquy, vanthu, yte, baove, phucvu, thuvien, thietbi)
  const [selectedPositionKey, setSelectedPositionKey] = useState<string>('ketoan');
  // Modal Step 2: Chọn nhân viên thuộc vị trí đó
  const [selectedStaffIdForCreate, setSelectedStaffIdForCreate] = useState<string>('');
  // Modal: Kỳ đánh giá
  const [modalEvalPeriod, setModalEvalPeriod] = useState<EvaluationPeriod>('thang');
  const [modalEvalMonth, setModalEvalMonth] = useState<number>(9);
  const [modalEvalYear, setModalEvalYear] = useState<number>(2026);
  // Modal: Người đánh giá độc lập (Tổ trưởng & BGH)
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState<string>('');
  const [selectedBghEvaluatorId, setSelectedBghEvaluatorId] = useState<string>('');
  const [sheetEvaluatorId, setSheetEvaluatorId] = useState<string>('');
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>('all');
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; openUpward: boolean }>({ top: 0, left: 0, openUpward: false });
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Sheet Criteria Set states
  const [sheetPositionKey, setSheetPositionKey] = useState<string>('ketoan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportFormsModalOpen, setIsExportFormsModalOpen] = useState(false);

  const isUserBgh = useMemo(() => {
    if (isBgh || (currentUser as any)?.role === 'admin') return true;
    const pos = (currentUser?.position || '').toLowerCase();
    return pos.includes('hiệu trưởng') || pos.includes('phó hiệu trưởng');
  }, [isBgh, currentUser]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeActionDropdownId) {
        setActiveActionDropdownId(null);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeActionDropdownId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeActionDropdownId) {
        // if clicked inside portal menu or button, do nothing
        const target = e.target as HTMLElement;
        if (target.closest('.staff-kpi-action-portal-menu') || target.closest('.staff-kpi-action-btn')) {
          return;
        }
        setActiveActionDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeActionDropdownId]);

  // Quick Add Staff Modal state for position
  const [isQuickAddStaffOpen, setIsQuickAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffCode, setNewStaffCode] = useState('');

  // 4. Currently Editing / Viewing Evaluation Record
  const [currentEvalRecord, setCurrentEvalRecord] = useState<TeacherKpiEvaluation | null>(
    evaluationRecord || null
  );

  // If passed an initial record from outside props
  useEffect(() => {
    if (evaluationRecord) {
      setCurrentEvalRecord(evaluationRecord);
      setActiveViewMode('sheet');
    }
  }, [evaluationRecord]);

  // Active Staff for Sheet view
  const activeStaff: StaffMember | undefined = useMemo(() => {
    if (currentEvalRecord) {
      return (
        staffList.find(
          (s) => s.id === currentEvalRecord.staffId || s.code === currentEvalRecord.staffCode
        ) || {
          id: currentEvalRecord.staffId,
          code: currentEvalRecord.staffCode,
          name: currentEvalRecord.staffName,
          department: currentEvalRecord.department,
          position: currentEvalRecord.position,
          type: 'nhanvien',
          is_active: true,
        }
      );
    }
    return officeStaff[0];
  }, [currentEvalRecord, staffList, officeStaff]);

  // Active Position Definition for Sheet view
  const activePositionDef: StaffPositionDefinition = useMemo(() => {
    return OFFICIAL_STAFF_POSITIONS.find((p) => p.key === sheetPositionKey) || OFFICIAL_STAFF_POSITIONS[0];
  }, [sheetPositionKey]);

  // Combined Criteria for the active sheet: 30đ Chung + 70đ Vị trí = 100đ
  // If current evaluation has a saved snapshot, use that snapshot (Requirement XIII)
  const sheetCriteriaList: KpiCriterionItem[] = useMemo(() => {
    if (sheetPositionKey) {
      const generalCrits =
        criteriaConfig.generalCriteria && criteriaConfig.generalCriteria.length > 0
          ? criteriaConfig.generalCriteria.filter((c: any) => c.isActive !== false)
          : STAFF_GENERAL_KPI_CRITERIA;

      const posCrits =
        criteriaConfig.positionCriteriaMap?.[sheetPositionKey] &&
        criteriaConfig.positionCriteriaMap[sheetPositionKey].length > 0
          ? criteriaConfig.positionCriteriaMap[sheetPositionKey].filter(
              (c: any) => c.isActive !== false
            )
          : activePositionDef.criteria;

      return [...generalCrits, ...posCrits];
    }
    if (currentEvalRecord?.criteria_snapshot && currentEvalRecord.criteria_snapshot.length > 0) {
      return currentEvalRecord.criteria_snapshot as KpiCriterionItem[];
    }
    const generalCrits =
      criteriaConfig.generalCriteria && criteriaConfig.generalCriteria.length > 0
        ? criteriaConfig.generalCriteria.filter((c: any) => c.isActive !== false)
        : STAFF_GENERAL_KPI_CRITERIA;

    const posCrits =
      criteriaConfig.positionCriteriaMap?.[activePositionDef.key] &&
      criteriaConfig.positionCriteriaMap[activePositionDef.key].length > 0
        ? criteriaConfig.positionCriteriaMap[activePositionDef.key].filter(
            (c: any) => c.isActive !== false
          )
        : activePositionDef.criteria;

    return [...generalCrits, ...posCrits];
  }, [currentEvalRecord, activePositionDef, criteriaConfig]);

  // Sheet Scores state
  const [scores, setScores] = useState<TeacherKpiEvaluation['scores']>({});
  const [status, setStatus] = useState<TeacherKpiEvaluation['status']>('draft');
  const [selfDate, setSelfDate] = useState<string>('2026-09-24');
  const [deptDate, setDeptDate] = useState<string>('');
  const [bghDate, setBghDate] = useState<string>('');
  const [selfNote, setSelfNote] = useState<string>('');
  const [deptNote, setDeptNote] = useState<string>('');
  const [bghNote, setBghNote] = useState<string>('');
  const [evalPeriodState, setEvalPeriodState] = useState<EvaluationPeriod>('thang');
  const [evalMonthState, setEvalMonthState] = useState<number>(9);
  const [evalYearState, setEvalYearState] = useState<number>(2026);

  // Sync scores when entering Sheet mode or changing active evaluation
  useEffect(() => {
    if (!currentEvalRecord) return;
    const pKey = detectStaffPositionKey(currentEvalRecord.position);
    setSheetPositionKey(pKey);
    setEvalPeriodState(getEvaluationPeriod(currentEvalRecord));
    if (currentEvalRecord.month) setEvalMonthState(currentEvalRecord.month);
    if (currentEvalRecord.year) setEvalYearState(currentEvalRecord.year);
    setStatus(currentEvalRecord.status || 'draft');
    setSelfDate(currentEvalRecord.selfDate || '2026-09-24');
    setDeptDate(currentEvalRecord.deptDate || '');
    setBghDate(currentEvalRecord.bghDate || '');
    setSelfNote(currentEvalRecord.selfRankNote || currentEvalRecord.personal_comment || '');
    setDeptNote(currentEvalRecord.department_comment || currentEvalRecord.ttcm_comment || '');
    setBghNote(currentEvalRecord.bgh_comment || '');

    // Bảo toàn đúng người đánh giá đã lưu lúc tạo phiếu
    const savedEvalId =
      (currentEvalRecord as any).evaluator_id ||
      currentEvalRecord.evaluatorId ||
      currentEvalRecord.ttcmEvaluatorId ||
      currentEvalRecord.bghEvaluatorId;

    const savedEvalName =
      (currentEvalRecord as any).evaluator_name ||
      currentEvalRecord.evaluatorName ||
      currentEvalRecord.ttcmEvaluatorName ||
      currentEvalRecord.bghEvaluatorName ||
      '';

    const matchingEval = allAvailableEvaluators.find(
      (b) =>
        (savedEvalId && b.id === savedEvalId) ||
        (savedEvalName && (b.name === savedEvalName || savedEvalName.includes(b.name) || b.name.includes(savedEvalName)))
    );
    setSheetEvaluatorId(matchingEval?.id || savedEvalId || bghEvaluators[0]?.id || '');

    if (currentEvalRecord.scores && Object.keys(currentEvalRecord.scores).length > 0) {
      setScores(currentEvalRecord.scores);
    } else {
      // Initialize with 0 for self and undefined for bgh
      const init: TeacherKpiEvaluation['scores'] = {};
      sheetCriteriaList.forEach((c) => {
        init[c.id] = {
          criterionId: c.id,
          selfScore: 0,
          bghScore: undefined,
          isNa: false,
          evidence: '',
        };
      });
      setScores(init);
    }
  }, [currentEvalRecord?.id]);

  // Người đánh giá đang được chọn trong chế độ xem/chấm phiếu
  const currentSheetEvaluator = useMemo<EvaluatorOption | undefined>(() => {
    if (!currentEvalRecord) {
      if (sheetEvaluatorId) {
        return allAvailableEvaluators.find((e) => e.id === sheetEvaluatorId) || bghEvaluators[0];
      }
      return bghEvaluators[0];
    }

    if (sheetEvaluatorId) {
      const match = allAvailableEvaluators.find((e) => e.id === sheetEvaluatorId);
      if (match) return match;
    }

    const recId =
      (currentEvalRecord as any).evaluator_id ||
      currentEvalRecord.evaluatorId ||
      currentEvalRecord.ttcmEvaluatorId ||
      currentEvalRecord.bghEvaluatorId;
    if (recId) {
      const match = allAvailableEvaluators.find((e) => e.id === recId);
      if (match) return match;
    }

    const recName =
      (currentEvalRecord as any).evaluator_name ||
      currentEvalRecord.evaluatorName ||
      currentEvalRecord.ttcmEvaluatorName ||
      currentEvalRecord.bghEvaluatorName ||
      '';
    if (recName) {
      const match = allAvailableEvaluators.find(
        (e) => recName.includes(e.name) || e.name.includes(recName)
      );
      if (match) return match;
    }

    // Bảo toàn chính xác người đánh giá đã lưu mà không tự động đổi sang Hiệu trưởng (Requirement 7)
    if (currentEvalRecord.evaluatorName || (currentEvalRecord as any).evaluator_name) {
      const isTt =
        (currentEvalRecord as any).evaluator_role === 'Tổ trưởng' ||
        currentEvalRecord.evaluatorRole === 'Tổ trưởng' ||
        currentEvalRecord.evaluatorType === 'TOTRUONG' ||
        (currentEvalRecord as any).evaluator_type === 'TOTRUONG' ||
        (currentEvalRecord as any).evaluator_role?.toLowerCase().includes('tổ') ||
        !!currentEvalRecord.ttcmEvaluatorName;

      const evalRole =
        (currentEvalRecord as any).evaluator_role ||
        currentEvalRecord.evaluatorRole ||
        (isTt ? 'Tổ trưởng' : 'Hiệu trưởng');
      const evalName =
        (currentEvalRecord as any).evaluator_name ||
        currentEvalRecord.evaluatorName?.split('–')[0]?.split('(')[0]?.trim() ||
        (isTt ? currentEvalRecord.ttcmEvaluatorName : currentEvalRecord.bghEvaluatorName) ||
        'Người đánh giá';
      const evalPos = isTt
        ? currentEvalRecord.ttcmEvaluatorRole || `Tổ trưởng ${currentEvalRecord.department || 'Tổ Văn phòng'}`
        : currentEvalRecord.bghEvaluatorRole || evalRole;

      return {
        id: recId || 'saved-evaluator',
        name: evalName,
        position: evalPos,
        code: '',
        roleType: isTt ? 'team_leader' : evalRole.toLowerCase().includes('phó') ? 'vice_principal' : 'principal',
        category: isTt ? 'TOTRUONG' : 'BGH',
        departmentId: (currentEvalRecord as any).evaluator_department_id || 'to-van-phong',
        departmentName: (currentEvalRecord as any).evaluator_department_name || currentEvalRecord.department || 'Tổ Văn phòng',
      };
    }

    return bghEvaluators[0];
  }, [allAvailableEvaluators, bghEvaluators, sheetEvaluatorId, currentEvalRecord]);

  // Candidates for Creation Modal Step 2: Filter strictly by selectedPositionKey!
  const eligibleStaffForSelectedPosition = useMemo(() => {
    return officeStaff.filter((staff) => {
      const posKey = detectStaffPositionKey(staff.position);
      return posKey === selectedPositionKey;
    });
  }, [officeStaff, selectedPositionKey]);

  // Auto pick first candidate when position changes in modal
  useEffect(() => {
    if (eligibleStaffForSelectedPosition.length > 0) {
      setSelectedStaffIdForCreate(eligibleStaffForSelectedPosition[0].id);
    } else {
      setSelectedStaffIdForCreate('');
    }
  }, [selectedPositionKey, eligibleStaffForSelectedPosition]);

  // Candidate member selected in Create Modal
  const candidateStaffMember = useMemo(() => {
    return officeStaff.find((s) => s.id === selectedStaffIdForCreate);
  }, [officeStaff, selectedStaffIdForCreate]);

  // Lấy chính xác Tổ / Bộ phận hiện tại của nhân viên được chọn (Requirement 5)
  const candidateStaffDeptId = useMemo(() => {
    if (!candidateStaffMember) return 'to-van-phong';
    return (
      getDepartmentId(
        candidateStaffMember.departmentId || candidateStaffMember.department_id || candidateStaffMember.department,
        candidateStaffMember.type
      ) || 'to-van-phong'
    );
  }, [candidateStaffMember]);

  const candidateStaffDeptName = useMemo(() => {
    if (!candidateStaffMember) return 'Tổ Văn phòng';
    return candidateStaffMember.department || getDepartmentDisplayName(candidateStaffDeptId) || 'Tổ Văn phòng';
  }, [candidateStaffMember, candidateStaffDeptId]);

  // Tự động lọc danh sách Tổ trưởng theo chính xác Tổ / Bộ phận của nhân viên (Requirement 3 & 5)
  const eligibleTeamLeadersForCandidate = useMemo(() => {
    return allTeamLeaders.filter((tl) => tl.departmentId === candidateStaffDeptId);
  }, [allTeamLeaders, candidateStaffDeptId]);

  // Tự động cập nhật Tổ trưởng và BGH khi đổi nhân viên hoặc mở modal
  useEffect(() => {
    if (eligibleTeamLeadersForCandidate.length > 0) {
      if (!selectedTeamLeaderId || !eligibleTeamLeadersForCandidate.some((t) => t.id === selectedTeamLeaderId)) {
        setSelectedTeamLeaderId(eligibleTeamLeadersForCandidate[0].id);
      }
    } else {
      setSelectedTeamLeaderId('');
    }
  }, [candidateStaffDeptId, eligibleTeamLeadersForCandidate]);

  useEffect(() => {
    if (bghEvaluators.length > 0) {
      if (!selectedBghEvaluatorId || !bghEvaluators.some((b) => b.id === selectedBghEvaluatorId)) {
        setSelectedBghEvaluatorId(bghEvaluators[0].id);
      }
    }
  }, [bghEvaluators]);

  const selectedTeamLeader = useMemo(() => {
    return eligibleTeamLeadersForCandidate.find((t) => t.id === selectedTeamLeaderId) || eligibleTeamLeadersForCandidate[0];
  }, [eligibleTeamLeadersForCandidate, selectedTeamLeaderId]);

  const selectedBghEvaluator = useMemo(() => {
    return bghEvaluators.find((b) => b.id === selectedBghEvaluatorId) || bghEvaluators[0];
  }, [bghEvaluators, selectedBghEvaluatorId]);

  // Selected Position Object in Create Modal
  const modalSelectedPositionDef = useMemo(() => {
    return (
      OFFICIAL_STAFF_POSITIONS.find((p) => p.key === selectedPositionKey) ||
      OFFICIAL_STAFF_POSITIONS[0]
    );
  }, [selectedPositionKey]);

  // Check if candidate staff member already has an evaluation in the selected period (Requirement 9)
  const isDuplicateStaffInSelectedPeriod = useMemo(() => {
    if (!candidateStaffMember) return false;
    return officeEvaluations.some((e) => {
      if (e.staffId !== candidateStaffMember.id && e.staffCode !== candidateStaffMember.code) return false;
      if (modalEvalPeriod === 'thang') {
        return e.month === modalEvalMonth && (e.year === modalEvalYear || !e.year);
      }
      return e.evaluationPeriod === modalEvalPeriod && (e.year === modalEvalYear || !e.year);
    });
  }, [candidateStaffMember, officeEvaluations, modalEvalPeriod, modalEvalMonth, modalEvalYear]);

  // Period label for modal
  const modalPeriodLabel = useMemo(() => {
    if (modalEvalPeriod === 'ki1') return 'Kì I (Học kì 1)';
    if (modalEvalPeriod === 'ki2') return 'Kì II (Học kì 2)';
    if (modalEvalPeriod === 'canam') return 'Cả năm học';
    return `Tháng ${String(modalEvalMonth).padStart(2, '0')}/${modalEvalYear}`;
  }, [modalEvalPeriod, modalEvalMonth, modalEvalYear]);

  // Partition sheetCriteriaList into Section A (30đ) and Section B (70đ)
  const sheetGeneralCriteria = useMemo(() => {
    return sheetCriteriaList.filter((c) => c.section === 'A');
  }, [sheetCriteriaList]);

  const sheetPositionCriteria = useMemo(() => {
    return sheetCriteriaList.filter((c) => c.section === 'B');
  }, [sheetCriteriaList]);

  // Calculate scores breakdown: Part A (30đ) + Part B (70đ) = Total (100đ)
  const scoreBreakdowns = useMemo(() => {
    let selfA = 0;
    let bghA = 0;
    let bghCompleteA = true;

    let selfB = 0;
    let bghB = 0;
    let bghCompleteB = true;

    sheetGeneralCriteria.forEach((crit) => {
      const sc = scores[crit.id];
      const selfVal = sc?.isNa ? 0 : (sc?.selfScore ?? 0);
      selfA += selfVal;
      const bghVal = sc?.bghScore;
      if (bghVal !== undefined && bghVal !== null && !isNaN(bghVal)) {
        bghA += bghVal;
      } else {
        bghCompleteA = false;
      }
    });

    sheetPositionCriteria.forEach((crit) => {
      const sc = scores[crit.id];
      const selfVal = sc?.isNa ? 0 : (sc?.selfScore ?? 0);
      selfB += selfVal;
      const bghVal = sc?.bghScore;
      if (bghVal !== undefined && bghVal !== null && !isNaN(bghVal)) {
        bghB += bghVal;
      } else {
        bghCompleteB = false;
      }
    });

    const totalSelf = Math.min(100, Math.round((selfA + selfB) * 10) / 10);
    const isBghFullyGraded = bghCompleteA && bghCompleteB;
    const totalBgh = isBghFullyGraded ? Math.min(100, Math.round((bghA + bghB) * 10) / 10) : null;

    return {
      partA: {
        max: 30,
        self: Math.round(selfA * 10) / 10,
        bgh: isBghFullyGraded || bghA > 0 ? Math.round(bghA * 10) / 10 : 0,
      },
      partB: {
        max: 70,
        self: Math.round(selfB * 10) / 10,
        bgh: isBghFullyGraded || bghB > 0 ? Math.round(bghB * 10) / 10 : 0,
      },
      total: {
        max: 100,
        self: totalSelf,
        bgh: totalBgh,
      },
      isBghFullyGraded,
    };
  }, [scores, sheetGeneralCriteria, sheetPositionCriteria]);

  const selfRank = calculateStaffRank(scoreBreakdowns.total.self, rankingTiers);
  const bghRank = scoreBreakdowns.total.bgh !== null ? calculateStaffRank(scoreBreakdowns.total.bgh, rankingTiers) : 'Chờ BGH';

  // Score Handlers
  const handleScoreChange = (
    criterionId: string,
    field: 'selfScore' | 'deptScore' | 'bghScore',
    val: number,
    maxPoints: number
  ) => {
    if (field === 'bghScore' && val > maxPoints) {
      showToast(`❌ Điểm BGH không được vượt quá ${maxPoints} điểm.`, 'error');
      return;
    }
    setIsDirty(true);
    const clamped = Math.max(0, Math.min(maxPoints, Math.round(val * 10) / 10));
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || { criterionId }),
        [field]: clamped,
      },
    }));
  };

  const handleToggleNa = (criterionId: string) => {
    setIsDirty(true);
    setScores((prev) => {
      const curr = prev[criterionId];
      const nextNa = !curr?.isNa;
      return {
        ...prev,
        [criterionId]: {
          ...(curr || { criterionId }),
          isNa: nextNa,
        },
      };
    });
  };

  const handleEvidenceChange = (criterionId: string, evidence: string) => {
    setIsDirty(true);
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || { criterionId }),
        evidence,
      },
    }));
  };

  const handleQuickFillMax = () => {
    setIsDirty(true);
    const updated: TeacherKpiEvaluation['scores'] = {};
    sheetCriteriaList.forEach((crit) => {
      const current = scores[crit.id];
      updated[crit.id] = {
        criterionId: crit.id,
        selfScore: crit.maxPoints,
        deptScore: crit.maxPoints,
        bghScore: crit.maxPoints,
        isNa: current?.isNa || false,
        evidence: current?.evidence || 'Đạt yêu cầu tối đa theo nhiệm vụ vị trí việc làm',
      };
    });
    setScores(updated);
    showToast('Đã điền điểm tối đa cho tất cả các tiêu chí!', 'success');
  };

  const handleQuickResetZero = () => {
    setIsDirty(true);
    const updated: TeacherKpiEvaluation['scores'] = {};
    sheetCriteriaList.forEach((crit) => {
      const current = scores[crit.id];
      updated[crit.id] = {
        criterionId: crit.id,
        selfScore: 0,
        deptScore: 0,
        bghScore: 0,
        isNa: current?.isNa || false,
        evidence: current?.evidence || '',
      };
    });
    setScores(updated);
    showToast('Đã đặt lại điểm về 0 để nhập mới', 'info');
  };

  // Submit Handler for Step 2: "TẠO PHIẾU ĐÁNH GIÁ KPI"
  const handleConfirmCreateEvaluation = () => {
    if (!candidateStaffMember) {
      showToast('Vui lòng chọn nhân viên để tạo phiếu đánh giá!', 'warning');
      return;
    }

    // Bắt buộc phải chọn Tổ trưởng và BGH
    if (eligibleTeamLeadersForCandidate.length === 0 || !selectedTeamLeader) {
      showToast(`Chưa cấu hình Tổ trưởng cho ${candidateStaffDeptName}. Vui lòng cấu hình Tổ trưởng trước khi tạo phiếu.`, 'warning');
      return;
    }
    if (!selectedBghEvaluator) {
      showToast('Vui lòng chọn Ban Giám hiệu phê duyệt (Hiệu trưởng hoặc Phó Hiệu trưởng).', 'warning');
      return;
    }

    // Phân quyền chọn người đánh giá (Requirement 8)
    const isUserTeamLeader =
      (currentUser as any)?.role === 'totruong' ||
      currentUser?.position?.toLowerCase().includes('tổ trưởng') ||
      currentUser?.position?.toLowerCase().includes('ttcm');

    if (isUserTeamLeader && currentUser?.role !== 'bgh') {
      const userDeptId = getDepartmentId(
        (currentUser as any).departmentId || (currentUser as any).department_id || (currentUser as any).department,
        'nhanvien'
      );
      if (userDeptId && userDeptId !== candidateStaffDeptId) {
        showToast('Bạn chỉ có quyền tạo và đánh giá nhân viên thuộc tổ mình phụ trách!', 'warning');
        return;
      }
    }

    // Check if an evaluation already exists for this staff in this period (Requirement 9)
    const isDuplicate = officeEvaluations.some((e) => {
      if (e.staffId !== candidateStaffMember.id && e.staffCode !== candidateStaffMember.code) return false;
      if (modalEvalPeriod === 'thang') {
        return e.month === modalEvalMonth && (e.year === modalEvalYear || !e.year);
      }
      return e.evaluationPeriod === modalEvalPeriod && (e.year === modalEvalYear || !e.year);
    });

    if (isDuplicate) {
      showToast('Nhân viên này đã có phiếu KPI trong tháng được chọn.', 'warning');
      return;
    }

    // Initialize full max points for the new evaluation using active criteria configuration (Requirement 4)
    const initialScores: TeacherKpiEvaluation['scores'] = {};
    const generalCrits =
      criteriaConfig.generalCriteria && criteriaConfig.generalCriteria.length > 0
        ? criteriaConfig.generalCriteria.filter((c: any) => c.isActive !== false)
        : STAFF_GENERAL_KPI_CRITERIA;

    const posCrits =
      criteriaConfig.positionCriteriaMap?.[modalSelectedPositionDef.key] &&
      criteriaConfig.positionCriteriaMap[modalSelectedPositionDef.key].length > 0
        ? criteriaConfig.positionCriteriaMap[modalSelectedPositionDef.key].filter(
            (c: any) => c.isActive !== false
          )
        : modalSelectedPositionDef.criteria;

    const criteriaToUse = [...generalCrits, ...posCrits];
    criteriaToUse.forEach((c) => {
      initialScores[c.id] = {
        criterionId: c.id,
        selfScore: c.maxPoints,
        deptScore: c.maxPoints,
        bghScore: c.maxPoints,
        isNa: false,
        evidence: 'Lưu trữ hồ sơ chứng từ đầy đủ tại Tổ Văn phòng',
      };
    });

    const newEvalId = `eval-${candidateStaffMember.id}-nhanvien-${modalEvalPeriod}-${modalEvalPeriod === 'thang' ? modalEvalMonth : 0}-${modalEvalYear}-${Date.now()}`;
    const posId = `pos-${modalSelectedPositionDef.key}`;
    const templateId = `kpi-template-${modalSelectedPositionDef.key}-2026-2027`;

    // Snapshot of the KPI criteria applied at creation time (Requirement XIII)
    const criteriaSnapshot = criteriaToUse.map((c) => ({
      id: c.id,
      section: c.section,
      sectionTitle: c.sectionTitle,
      order: c.order,
      content: c.content,
      maxPoints: c.maxPoints,
      groupTitle: c.groupTitle,
    }));

    const defaultRank = calculateStaffRank(100, rankingTiers);

    const chosenTeamLeader = selectedTeamLeader;
    const chosenBgh = selectedBghEvaluator;

    // Dữ liệu lưu phiếu chính xác
    const newEval: TeacherKpiEvaluation = {
      id: newEvalId,
      evaluation_id: newEvalId,

      // Employee Info (Requirement 6)
      employee_id: candidateStaffMember.id,
      employee_code: candidateStaffMember.code,
      employee_name: candidateStaffMember.name,
      staffId: candidateStaffMember.id,
      staffCode: candidateStaffMember.code,
      staffName: candidateStaffMember.name,
      full_name: candidateStaffMember.name,

      // Department Info (Requirement 6 & 5)
      department_id: candidateStaffDeptId,
      departmentId: candidateStaffDeptId,
      department_name: candidateStaffDeptName,
      department: candidateStaffDeptName,

      // Job Position Info
      position: modalSelectedPositionDef.name, // Exactly matches the position from Step 1
      job_position_id: posId,
      job_position_name: modalSelectedPositionDef.name,
      kpi_template_id: templateId,
      kpi_template_version: '2026-2027.v1',
      criteria_snapshot: criteriaSnapshot,
      targetType: 'nhanvien',
      schoolYear: schoolYear,
      semester: modalEvalPeriod === 'ki2' ? 2 : 1,

      // Evaluation Period (Requirement 6)
      evaluation_period: modalEvalPeriod,
      evaluationPeriod: modalEvalPeriod,
      evaluation_month: modalEvalPeriod === 'thang' ? modalEvalMonth : undefined,
      month: modalEvalPeriod === 'thang' ? modalEvalMonth : undefined,
      evaluation_year: modalEvalYear,
      year: modalEvalYear,
      periodName: modalPeriodLabel,

      // Evaluator Info (Tổ trưởng & BGH)
      evaluator_id: chosenBgh.id,
      evaluatorId: chosenBgh.id,
      evaluator_name: `${chosenTeamLeader.name} & ${chosenBgh.name}`,
      evaluatorName: `${chosenTeamLeader.name} (Tổ trưởng) & ${chosenBgh.name} (${chosenBgh.position})`,
      evaluator_role: 'Tổ trưởng & BGH',
      evaluatorRole: 'Tổ trưởng & BGH',
      evaluatorType: 'TEAM_LEADER_AND_BGH',
      evaluator_type: 'TEAM_LEADER_AND_BGH',

      // Specific role linking
      reviewer_team_leader_id: chosenTeamLeader.id,
      reviewer_team_leader_name: chosenTeamLeader.name,
      reviewer_team_leader_role: chosenTeamLeader.position,
      ttcmEvaluatorId: chosenTeamLeader.id,
      ttcmEvaluatorName: chosenTeamLeader.name,
      ttcmEvaluatorRole: chosenTeamLeader.position,
      ttcmEvaluatorDepartment: chosenTeamLeader.departmentName,
      ttcm_evaluator_id: chosenTeamLeader.id,
      ttcm_evaluator_name: chosenTeamLeader.name,
      ttcm_evaluator_role: chosenTeamLeader.position,
      ttcm_evaluator_department: chosenTeamLeader.departmentName,

      reviewer_management_id: chosenBgh.id,
      reviewer_management_name: chosenBgh.name,
      reviewer_management_role: chosenBgh.position,
      bghEvaluatorId: chosenBgh.id,
      bghEvaluatorName: chosenBgh.name,
      bghEvaluatorRole: chosenBgh.position,
      bgh_evaluator_id: chosenBgh.id,
      bgh_evaluator_name: chosenBgh.name,
      bgh_evaluator_role: chosenBgh.position,

      scores: initialScores,
      selfTotalScore: 100,
      deptTotalScore: 100,
      bghTotalScore: 100,
      personal_score: 100,
      ttcm_score: 100,
      bgh_score: 100,
      selfRank: defaultRank,
      deptRank: defaultRank,
      bghRank: defaultRank,
      status: 'draft',
      selfDate: '2026-09-24',
      deptDate: '',
      bghDate: '',
      updatedAt: new Date().toISOString(),
    } as any;

    saveEvaluation(newEval);
    setCurrentEvalRecord(newEval);
    setSheetEvaluatorId(selectedBghEvaluator.id);
    setIsCreateModalOpen(false);
    setActiveViewMode('sheet');
    showToast(`Đã tạo thành công phiếu đánh giá KPI cho ${candidateStaffMember.name} (${modalSelectedPositionDef.name})!`, 'success');
  };

  // Handle Clear Evaluations from Database (Requirement 5)
  const handleEvaluationsCleared = async (deletedIds: string[]) => {
    try {
      await dbBulkDeleteEvaluations(deletedIds);
      for (const id of deletedIds) {
        await deleteEvaluation(id);
      }
      showToast(`Đã xóa thành công ${deletedIds.length} phiếu đánh giá KPI nhân viên khỏi cơ sở dữ liệu!`, 'success');
    } catch (err) {
      console.error('Error clearing evaluations:', err);
      showToast('Lỗi khi xóa kết quả KPI nhân viên', 'error');
    }
  };

  // Quick Add Staff Member to the Selected Position if none exist
  const handleQuickAddStaffToPosition = async () => {
    if (!newStaffName.trim()) {
      showToast('Vui lòng nhập họ và tên nhân viên!', 'warning');
      return;
    }

    const genCode = newStaffCode.trim() || `NV${String(officeStaff.length + 1).padStart(3, '0')}`;
    const newStaff: StaffMember = {
      id: `nv-${Date.now()}`,
      code: genCode,
      name: newStaffName.trim(),
      type: 'nhanvien',
      employee_type: 'NHAN_VIEN',
      department: 'Tổ Văn phòng',
      departmentId: 'to-van-phong',
      department_id: 'to-van-phong',
      position: modalSelectedPositionDef.name,
      phone: '0934.888.999',
      email: `${genCode.toLowerCase()}@thptphuongxa.edu.vn`,
      status: 'Đang công tác',
      is_active: true,
      baseScore: 100,
    };

    await addStaff(newStaff);
    setSelectedStaffIdForCreate(newStaff.id);
    setIsQuickAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffCode('');
    showToast(`Đã thêm nhân viên ${newStaff.name} vào vị trí ${modalSelectedPositionDef.name}!`, 'success');
  };

  // Save changes to current evaluation record (BGH & Staff evaluation saving)
  const handleSaveEvaluation = async (newStatus?: TeacherKpiEvaluation['status']) => {
    if (!currentEvalRecord || !activeStaff) {
      showToast('❌ Không tìm thấy thông tin phiếu hoặc nhân viên đang đánh giá!', 'error');
      return;
    }

    const finalStatus = newStatus || status || 'draft';
    const employeeId = activeStaff.id || currentEvalRecord.staffId;
    const evaluationId =
      currentEvalRecord.id ||
      `eval-staff-${employeeId}-${evalPeriodState}-${evalPeriodState === 'thang' ? evalMonthState : ''}-${evalYearState}`;

    // 1. Calculate scores independently for Section A (30đ) and Section B (70đ)
    let bghKpiChungScore = 0;
    let bghKpiViTriScore = 0;
    let selfKpiChungScore = 0;
    let selfKpiViTriScore = 0;

    sheetGeneralCriteria.forEach((crit) => {
      const sc = scores[crit.id];
      const isNa = Boolean(sc?.isNa);
      const sVal = isNa ? 0 : Number(sc?.selfScore ?? 0);
      selfKpiChungScore += sVal;
      if (sc?.bghScore !== undefined && sc?.bghScore !== null && !isNaN(Number(sc.bghScore))) {
        bghKpiChungScore += Number(sc.bghScore);
      }
    });

    sheetPositionCriteria.forEach((crit) => {
      const sc = scores[crit.id];
      const isNa = Boolean(sc?.isNa);
      const sVal = isNa ? 0 : Number(sc?.selfScore ?? 0);
      selfKpiViTriScore += sVal;
      if (sc?.bghScore !== undefined && sc?.bghScore !== null && !isNaN(Number(sc.bghScore))) {
        bghKpiViTriScore += Number(sc.bghScore);
      }
    });

    bghKpiChungScore = Math.min(30, Math.round(bghKpiChungScore * 10) / 10);
    bghKpiViTriScore = Math.min(70, Math.round(bghKpiViTriScore * 10) / 10);
    selfKpiChungScore = Math.min(30, Math.round(selfKpiChungScore * 10) / 10);
    selfKpiViTriScore = Math.min(70, Math.round(selfKpiViTriScore * 10) / 10);

    // Total score calculation (Requirement 5: bghTotalScore = bghKpiChungScore + bghKpiViTriScore)
    const bghTotalScore = Math.min(100, Math.round((bghKpiChungScore + bghKpiViTriScore) * 10) / 10);
    const selfTotalScore = Math.min(100, Math.round((selfKpiChungScore + selfKpiViTriScore) * 10) / 10);

    // Ranking calculation (Requirement 6: 90-100: xuất sắc, 80-<90: tốt, 65-<80: hoàn thành, <65: không hoàn thành)
    const finalSelfRank = calculateStaffRank(selfTotalScore, rankingTiers);
    const finalBghRank = calculateStaffRank(bghTotalScore, rankingTiers);

    const finalBghDate = bghDate || new Date().toISOString().split('T')[0];
    const finalEvaluatedAt = new Date().toISOString();

    const savedRole =
      currentSheetEvaluator?.category === 'TOTRUONG'
        ? 'Tổ trưởng'
        : currentSheetEvaluator?.roleType === 'principal'
        ? 'Hiệu trưởng'
        : 'Phó Hiệu trưởng';

    const isTt = currentSheetEvaluator?.category === 'TOTRUONG';

    // 2. Sanitize scores per criterion with details (Requirement 4)
    const cleanScores: Record<string, any> = {};
    sheetCriteriaList.forEach((c) => {
      const sc = scores[c.id];
      const isNa = Boolean(sc?.isNa);
      const sVal = isNa ? 0 : Number(sc?.selfScore ?? 0);
      const bVal =
        sc?.bghScore !== undefined && sc?.bghScore !== null && !isNaN(Number(sc.bghScore))
          ? Number(sc.bghScore)
          : null;

      cleanScores[c.id] = {
        criterionId: c.id,
        selfScore: sVal,
        bghScore: bVal,
        bghComment: sc?.evidence || sc?.bghComment || '',
        evaluatorId: currentSheetEvaluator?.id || 'bgh-01',
        isNa,
        evidence: sc?.evidence || '',
      };
    });

    // 3. Assemble complete updated evaluation record (Requirement 2 & 3 & 4)
    const updatedRecord: TeacherKpiEvaluation = {
      ...currentEvalRecord,
      id: evaluationId,
      evaluationId,
      formId: evaluationId,
      kpiFormId: evaluationId,
      staffId: employeeId,
      employeeId,
      employee_id: employeeId,
      staffCode: activeStaff.code,
      staffName: activeStaff.name,
      full_name: activeStaff.name,
      position: activePositionDef.name || activeStaff.position,
      job_position_name: activePositionDef.name || activeStaff.position,
      department: activeStaff.department || 'Tổ Văn phòng',
      department_id: 'to-van-phong',
      departmentName: activeStaff.department || 'Tổ Văn phòng',
      targetType: 'nhanvien',
      schoolYear: currentEvalRecord.schoolYear || schoolYear,
      evaluationPeriod: evalPeriodState,
      periodName:
        currentEvalRecord.periodName ||
        (evalPeriodState === 'thang'
          ? `Tháng ${String(evalMonthState).padStart(2, '0')}/${evalYearState}`
          : evalPeriodState === 'ki1'
          ? 'Kì I'
          : evalPeriodState === 'ki2'
          ? 'Kì II'
          : 'Cả năm'),
      month: evalPeriodState === 'thang' ? evalMonthState : undefined,
      year: evalYearState,

      scores: cleanScores,

      // Evaluator Information
      evaluatorId: currentSheetEvaluator?.id || currentEvalRecord.evaluatorId || 'bgh-1',
      evaluator_id: currentSheetEvaluator?.id || currentEvalRecord.evaluator_id || 'bgh-1',
      evaluatorName: currentSheetEvaluator
        ? `${currentSheetEvaluator.name} – ${currentSheetEvaluator.position}`
        : currentEvalRecord.evaluatorName,
      evaluator_name: currentSheetEvaluator?.name || currentEvalRecord.evaluator_name,
      evaluatorRole: savedRole,
      evaluator_role: savedRole,
      evaluator_department_id: currentSheetEvaluator?.departmentId || currentEvalRecord.evaluator_department_id,
      evaluator_department_name: currentSheetEvaluator?.departmentName || currentEvalRecord.evaluator_department_name,
      evaluatorType: currentSheetEvaluator?.category || currentEvalRecord.evaluatorType,
      evaluator_type: currentSheetEvaluator?.category || currentEvalRecord.evaluator_type,
      ...(isTt
        ? {
            ttcmEvaluatorId: currentSheetEvaluator?.id || currentEvalRecord.ttcmEvaluatorId,
            ttcmEvaluatorName: currentSheetEvaluator?.name || currentEvalRecord.ttcmEvaluatorName,
            ttcmEvaluatorRole: currentSheetEvaluator?.position || currentEvalRecord.ttcmEvaluatorRole,
            ttcmEvaluatorDepartment: currentSheetEvaluator?.departmentName || currentEvalRecord.ttcmEvaluatorDepartment,
            ttcm_evaluator_id: currentSheetEvaluator?.id || currentEvalRecord.ttcm_evaluator_id,
            ttcm_evaluator_name: currentSheetEvaluator?.name || currentEvalRecord.ttcm_evaluator_name,
            ttcm_evaluator_role: currentSheetEvaluator?.position || currentEvalRecord.ttcm_evaluator_role,
            ttcm_evaluator_department: currentSheetEvaluator?.departmentName || currentEvalRecord.ttcm_evaluator_department,
          }
        : {
            bghEvaluatorId: currentSheetEvaluator?.id || currentEvalRecord.bghEvaluatorId,
            bghEvaluatorName: currentSheetEvaluator?.name || currentEvalRecord.bghEvaluatorName,
            bghEvaluatorRole: currentSheetEvaluator?.position || currentEvalRecord.bghEvaluatorRole,
            bgh_evaluator_id: currentSheetEvaluator?.id || currentEvalRecord.bgh_evaluator_id,
            bgh_evaluator_name: currentSheetEvaluator?.name || currentEvalRecord.bgh_evaluator_name,
            bgh_evaluator_role: currentSheetEvaluator?.position || currentEvalRecord.bgh_evaluator_role,
          }),

      // Independent self score & rating (Requirement 3: không ghi đè self_score bằng bgh_score)
      selfTotalScore,
      self_score: selfTotalScore,
      personal_score: selfTotalScore,
      self_rating: finalSelfRank,
      selfRank: finalSelfRank,
      selfRankNote: selfNote,
      personal_comment: selfNote,
      selfDate,
      deptDate: deptDate || (finalStatus !== 'draft' ? new Date().toISOString().split('T')[0] : ''),
      department_comment: deptNote,
      ttcm_comment: deptNote,

      // Independent BGH score & rating (Requirement 3 & 4: tách riêng, lưu chi tiết điểm)
      bghTotalScore,
      bgh_score: bghTotalScore,
      bgh_total_score: bghTotalScore,
      bgh_kpi_chung_score: bghKpiChungScore,
      bgh_kpi_vi_tri_score: bghKpiViTriScore,
      partA_bgh_score: bghKpiChungScore,
      partB_bgh_score: bghKpiViTriScore,
      bgh_rating: finalBghRank,
      bghRank: finalBghRank,
      bgh_comment: bghNote,
      bghComment: bghNote,
      bghDate: finalBghDate,
      bgh_evaluated_at: finalEvaluatedAt,
      bghEvaluatedAt: finalEvaluatedAt,

      status: finalStatus,
      updatedAt: finalEvaluatedAt,
    };

    try {
      await saveEvaluation(updatedRecord);
      setCurrentEvalRecord(updatedRecord);
      setStatus(finalStatus);
      setIsDirty(false);

      if (newStatus === 'completed') {
        showToast('✓ Đã hoàn tất đánh giá và lưu kết quả BGH thành công.', 'success');
      } else if (newStatus === 'bgh_approved') {
        showToast('💾 Đã lưu kết quả đánh giá BGH thành công.', 'success');
      } else {
        showToast(`Đã lưu phiếu đánh giá KPI của ${activeStaff.name} thành công!`, 'success');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu kết quả BGH:', err);
      showToast(`Không thể lưu kết quả BGH: ${err?.message || err}`, 'error');
    }
  };

  // Export single evaluation sheet directly to Microsoft Word (.doc) without state delay
  const exportEvaluationItemToWord = (item: TeacherKpiEvaluation) => {
    const pKey = detectStaffPositionKey(item.position);
    const official = getOfficialStaffCriteria(item.position || pKey);
    const criteriaToUse =
      item.criteria_snapshot && item.criteria_snapshot.length > 0
        ? (item.criteria_snapshot as KpiCriterionItem[])
        : official.allCriteria;

    exportKpiEvaluationToWord({
      schoolName: schoolConfig.fullName || 'TRƯỜNG THPT PHƯƠNG XÁ',
      teacherName: item.staffName,
      staffCode: item.staffCode,
      position: item.position || official.positionDef.name,
      department: 'Tổ Văn phòng',
      schoolYear: item.schoolYear || schoolYear,
      evaluationPeriod: item.evaluationPeriod,
      periodName: item.periodName || 'Tháng 09/2026',
      month: item.month || 9,
      year: item.year || 2026,
      evaluatorName: item.evaluatorName || item.evaluator_name || 'Ban Giám hiệu',
      targetType: 'nhanvien',
      criteria: criteriaToUse.map((c) => ({
        id: c.id,
        section: c.section || (c.id.startsWith('NV-A') ? 'A' : 'B'),
        order: c.order || 1,
        content: c.content,
        maxPoints: c.maxPoints,
        groupTitle: (c as any).groupTitle || official.positionDef.name,
      })),
      scores: item.scores || {},
      selfTotal: item.selfTotalScore ?? (item as any).self_score ?? 100,
      bghTotal: item.bghTotalScore ?? (item as any).bgh_score ?? 100,
      selfRank: item.selfRank || (item as any).self_rating || 'Hoàn thành xuất sắc',
      bghRank: item.bghRank || (item as any).bgh_rating || 'Hoàn thành xuất sắc',
    });
    showToast(`Đã xuất file Word phiếu KPI của ${item.staffName} (${item.position})!`, 'success');
  };

  // Export single evaluation sheet directly to Microsoft Excel (.xlsx)
  const exportEvaluationItemToExcel = (item: TeacherKpiEvaluation) => {
    const pKey = detectStaffPositionKey(item.position);
    const official = getOfficialStaffCriteria(item.position || pKey);
    const criteriaToUse =
      item.criteria_snapshot && item.criteria_snapshot.length > 0
        ? (item.criteria_snapshot as KpiCriterionItem[])
        : official.allCriteria;

    exportKpiEvaluationToExcel({
      schoolName: schoolConfig.fullName || 'TRƯỜNG THPT PHƯƠNG XÁ',
      departmentName: 'Tổ Văn phòng',
      teacherName: item.staffName,
      position: item.position || official.positionDef.name,
      department: 'Tổ Văn phòng',
      schoolYear: item.schoolYear || schoolYear,
      evaluationPeriod: item.evaluationPeriod,
      periodName: item.periodName || 'Tháng 09/2026',
      month: item.month || 9,
      year: item.year || 2026,
      targetType: 'nhanvien',
      criteria: criteriaToUse.map((c) => ({
        id: c.id,
        section: c.section || (c.id.startsWith('NV-A') ? 'A' : 'B'),
        sectionTitle: (c as any).sectionTitle || (c as any).groupTitle || official.positionDef.name,
        order: c.order || 1,
        content: c.content,
        maxPoints: c.maxPoints,
      })),
      scores: item.scores || {},
      selfTotal: item.selfTotalScore ?? (item as any).self_score ?? 100,
      bghTotal: item.bghTotalScore ?? (item as any).bgh_score ?? 100,
      selfRank: item.selfRank || (item as any).self_rating || 'Hoàn thành xuất sắc',
      bghRank: item.bghRank || (item as any).bgh_rating || 'Hoàn thành xuất sắc',
    });
    showToast(`Đã xuất file Excel phiếu KPI của ${item.staffName} (${item.position})!`, 'success');
  };

  // Export to Excel for Current Staff in Sheet Mode
  const handleExportExcel = () => {
    if (!activeStaff) return;
    const wb = XLSX.utils.book_new();

    const data: (string | number)[][] = [
      ['SỞ GD&ĐT PHÚ THỌ', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', ''],
      ['TRƯỜNG THPT PHƯƠNG XÁ', '', '', '', 'Độc lập – Tự do – Hạnh phúc', ''],
      ['', '', '', '', '', ''],
      ['PHIẾU ĐÁNH GIÁ, CHẤM ĐIỂM KPI NHÂN VIÊN', '', '', '', '', ''],
      ['Năm học 2026–2027 – Dự thảo vận hành', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Họ và tên:', activeStaff.name, '', 'Mã nhân viên:', activeStaff.code, ''],
      ['Chức danh/vị trí việc làm:', activePositionDef.name, '', 'Bộ phận/Tổ:', 'Tổ Văn phòng', ''],
      ['Người đánh giá:', currentEvalRecord?.evaluatorName || 'Ban Giám hiệu', '', 'Kỳ đánh giá:', currentEvalRecord?.periodName || 'Tháng 09/2026', ''],
      ['Cấu trúc điểm: 30 điểm KPI chung + 70 điểm KPI theo đúng vị trí việc làm.', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['STT', 'Mã KPI', 'Nội dung đánh giá / nhiệm vụ', 'Điểm tối đa', 'Cá nhân tự chấm', 'Minh chứng / ghi chú'],
      ['A', 'KPI CHUNG', 'A. KPI CHUNG – 30 ĐIỂM', 30, scoreBreakdowns.partA.self, 'Áp dụng cho tất cả nhân viên Tổ Văn phòng'],
    ];

    STAFF_GENERAL_KPI_CRITERIA.forEach((crit, idx) => {
      const sc = scores[crit.id];
      data.push([
        idx + 1,
        crit.id,
        crit.content,
        crit.maxPoints,
        sc?.selfScore ?? crit.maxPoints,
        sc?.evidence || '',
      ]);
    });

    data.push([
      'B',
      activePositionDef.codePrefix,
      `B. KPI VỊ TRÍ VIỆC LÀM: ${activePositionDef.name.toUpperCase()} – 70 ĐIỂM`,
      70,
      scoreBreakdowns.partB.self,
      activePositionDef.description,
    ]);

    activePositionDef.criteria.forEach((crit, idx) => {
      const sc = scores[crit.id];
      data.push([
        idx + 1,
        crit.id,
        crit.content,
        crit.maxPoints,
        sc?.selfScore ?? crit.maxPoints,
        sc?.evidence || '',
      ]);
    });

    data.push(
      ['', '', '', '', '', ''],
      ['D', '', 'D. TỔNG HỢP ĐIỂM', 'Điểm tối đa', 'Điểm đạt', ''],
      ['1', '', 'KPI chung', 30, scoreBreakdowns.partA.self, ''],
      ['2', '', `KPI vị trí việc làm: ${activePositionDef.name}`, 70, scoreBreakdowns.partB.self, ''],
      ['3', '', 'Tổng điểm KPI', 100, scoreBreakdowns.total.self, ''],
      ['4', '', 'Tự xếp loại', '', selfRank, '']
    );

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 65 },
      { wch: 14 },
      { wch: 18 },
      { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Phieu_KPI_NhanVien');
    XLSX.writeFile(wb, `Phieu_KPI_${activePositionDef.codePrefix}_${activeStaff.code}_${schoolYear}.xlsx`);
    showToast(`Đã xuất file Excel phiếu KPI cho ${activeStaff.name}!`, 'success');
  };

  // Export to Microsoft Word (.doc) for Current Staff
  const handleExportWord = () => {
    if (!activeStaff || !currentEvalRecord) return;
    exportKpiEvaluationToWord({
      schoolName: schoolConfig.fullName || 'TRƯỜNG THPT PHƯƠNG XÁ',
      teacherName: activeStaff.name,
      staffCode: activeStaff.code,
      position: activePositionDef.name,
      department: 'Tổ Văn phòng',
      schoolYear: currentEvalRecord.schoolYear || schoolYear,
      evaluationPeriod: currentEvalRecord.evaluationPeriod,
      periodName: currentEvalRecord.periodName || 'Tháng 09/2026',
      month: currentEvalRecord.month || 9,
      year: currentEvalRecord.year || 2026,
      evaluatorName: currentEvalRecord.evaluatorName || 'Ban Giám hiệu',
      targetType: 'nhanvien',
      criteria: sheetCriteriaList.map((c) => ({
        id: c.id,
        section: c.section,
        order: c.order,
        content: c.content,
        maxPoints: c.maxPoints,
      })),
      scores: scores || {},
      selfTotal: scoreBreakdowns.total.self,
      bghTotal: scoreBreakdowns.total.bgh,
      selfRank,
      bghRank,
    });
    showToast(`Đã xuất file Word phiếu KPI của ${activeStaff.name}!`, 'success');
  };

  // Print Preview
  const handlePrint = () => {
    openPrintModal(
      `PHIẾU ĐÁNH GIÁ, CHẤM ĐIỂM KPI NHÂN VIÊN - ${activeStaff?.name.toUpperCase()}`,
      `Vị trí: ${activePositionDef.name} • Cấu trúc: 30đ KPI chung + 70đ KPI vị trí = 100đ`
    );
  };

  // Filtered evaluations list for List view (filtering by position, month, evaluator, and search query)
  const filteredOfficeEvaluations = useMemo(() => {
    return officeEvaluations.filter((ev) => {
      if (positionFilter !== 'all') {
        const pKey = detectStaffPositionKey(ev.position);
        if (pKey !== positionFilter) return false;
      }
      if (monthFilter !== 'all') {
        const evMonth = ev.month || (ev.periodName?.includes('Tháng ') ? parseInt(ev.periodName.replace(/.*Tháng\s*(\d+).*/, '$1'), 10) : undefined);
        if (evMonth !== monthFilter) {
          if (!ev.periodName?.includes(`Tháng ${String(monthFilter).padStart(2, '0')}`)) {
            return false;
          }
        }
      }
      if (evaluatorFilter !== 'all') {
        const evEvalId = ev.bghEvaluatorId || ev.evaluatorId || ev.evaluator_id;
        const evEvalName = (ev.evaluatorName || ev.bghEvaluatorName || ev.evaluator_name || '').toLowerCase();
        if (evEvalId !== evaluatorFilter) {
          const targetBgh = bghEvaluators.find((b) => b.id === evaluatorFilter);
          if (!targetBgh || !evEvalName.includes(targetBgh.name.toLowerCase())) {
            return false;
          }
        }
      }
      if (searchStaffQuery.trim()) {
        const q = searchStaffQuery.toLowerCase().trim();
        const matchName = ev.staffName.toLowerCase().includes(q);
        const matchCode = ev.staffCode.toLowerCase().includes(q);
        const matchPos = ev.position.toLowerCase().includes(q);
        const matchEvaluator = (ev.evaluatorName || ev.bghEvaluatorName || ev.evaluator_name || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPos && !matchEvaluator) return false;
      }
      return true;
    });
  }, [officeEvaluations, positionFilter, monthFilter, evaluatorFilter, searchStaffQuery, bghEvaluators]);

  // Export List to Excel with Master Summary Sheet + Individual Staff Sheets
  const handleExportListExcel = () => {
    if (filteredOfficeEvaluations.length === 0) {
      showToast('Không có dữ liệu phiếu KPI nào để xuất Excel!', 'warning');
      return;
    }

    const wb = XLSX.utils.book_new();
    const monthLabel =
      monthFilter === 'all'
        ? 'Tất cả các tháng'
        : `Tháng ${String(monthFilter).padStart(2, '0')}/${modalEvalYear || 2026}`;

    // 1. Overview Sheet
    const data: (string | number)[][] = [
      ['SỞ GD&ĐT PHÚ THỌ', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', '', '', '', ''],
      ['TRƯỜNG THPT PHƯƠNG XÁ', '', '', '', 'Độc lập – Tự do – Hạnh phúc', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['BẢNG TỔNG HỢP ĐÁNH GIÁ KPI TOÀN BỘ NHÂN VIÊN', '', '', '', '', '', '', '', ''],
      ['TRƯỜNG THPT PHƯƠNG XÁ', '', '', '', '', '', '', '', ''],
      [`Kỳ đánh giá: ${monthLabel} • Năm học: ${schoolYear}`, '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['STT', 'Mã NV', 'Họ và tên', 'Vị trí việc làm', 'Tổ / Bộ phận', 'Kỳ đánh giá', 'Điểm tự chấm', 'Điểm BGH', 'Xếp loại BGH', 'Người đánh giá', 'Trạng thái'],
    ];

    filteredOfficeEvaluations.forEach((item, idx) => {
      const selfScore = item.selfTotalScore ?? item.self_score ?? 100;
      const bghScore = item.bghTotalScore ?? item.bgh_score ?? selfScore;
      const rankLabel = item.bghRank || item.selfRank || calculateStaffRank(bghScore, rankingTiers);
      const mText = item.month ? `Tháng ${String(item.month).padStart(2, '0')}` : (item.periodName || 'Tháng 09/2026');

      data.push([
        idx + 1,
        item.staffCode,
        item.staffName,
        item.position,
        'Tổ Văn phòng',
        mText,
        `${Math.round(selfScore * 10) / 10}/100`,
        `${Math.round(bghScore * 10) / 10}/100`,
        rankLabel,
        item.evaluatorName || 'Ban Giám hiệu & Tổ trưởng',
        item.status === 'completed' || item.status === 'bgh_approved' ? 'Đã duyệt' : 'Đang soạn',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 25 },
      { wch: 25 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 32 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'TONG_HOP_NV');

    // 2. Individual Sheets for Each Staff Member
    filteredOfficeEvaluations.forEach((item) => {
      const pKey = detectStaffPositionKey(item.position);
      const official = getOfficialStaffCriteria(item.position || pKey);
      const criteriaToUse =
        item.criteria_snapshot && item.criteria_snapshot.length > 0
          ? (item.criteria_snapshot as KpiCriterionItem[])
          : official.allCriteria;

      const partACriteria = criteriaToUse.filter(
        (c) => c.section === 'A' || c.id.startsWith('NV-A')
      );
      const partBCriteria = criteriaToUse.filter(
        (c) => c.section === 'B' || !c.section || c.id.startsWith('NV-B')
      );

      const rows: any[] = [];
      rows.push({
        STT: '',
        'Nội dung đánh giá / nhiệm vụ chi tiết': 'SỞ GD&ĐT PHÚ THỌ - TRƯỜNG THPT PHƯƠNG XÁ',
        'Điểm tối đa': '',
        'Cá nhân tự chấm': '',
        'BGH chấm': '',
        'Minh chứng / ghi chú': '',
      });
      rows.push({
        STT: '',
        'Nội dung đánh giá / nhiệm vụ chi tiết': `PHIẾU ĐÁNH GIÁ KPI NHÂN VIÊN - ${item.staffName.toUpperCase()} (${item.position.toUpperCase()})`,
        'Điểm tối đa': '',
        'Cá nhân tự chấm': '',
        'BGH chấm': '',
        'Minh chứng / ghi chú': '',
      });
      rows.push({
        STT: '',
        'Nội dung đánh giá / nhiệm vụ chi tiết': `Mã NV: ${item.staffCode} | Tổ: Tổ Văn phòng | Người đánh giá: ${item.evaluatorName || 'Ban Giám hiệu'} | Năm học: ${schoolYear}`,
        'Điểm tối đa': '',
        'Cá nhân tự chấm': '',
        'BGH chấm': '',
        'Minh chứng / ghi chú': '',
      });
      rows.push({});

      // Part A
      let selfA = 0;
      let bghA = 0;
      partACriteria.forEach((c) => {
        const sc = item.scores?.[c.id];
        if (!sc?.isNa) {
          selfA += sc?.selfScore ?? c.maxPoints;
          bghA += sc?.bghScore ?? sc?.deptScore ?? c.maxPoints;
        }
      });

      rows.push({
        STT: 'A',
        'Nội dung đánh giá / nhiệm vụ chi tiết': 'A. KPI CHUNG – 30 ĐIỂM (Áp dụng toàn thể nhân viên Tổ Văn phòng)',
        'Điểm tối đa': 30,
        'Cá nhân tự chấm': Math.round(selfA * 10) / 10,
        'BGH chấm': Math.round(bghA * 10) / 10,
        'Minh chứng / ghi chú': 'Tối đa 30 điểm',
      });

      partACriteria.forEach((c) => {
        const sc = item.scores?.[c.id];
        rows.push({
          STT: c.order,
          'Nội dung đánh giá / nhiệm vụ chi tiết': c.content,
          'Điểm tối đa': c.maxPoints,
          'Cá nhân tự chấm': sc?.isNa ? 'N/A' : (sc?.selfScore ?? c.maxPoints),
          'BGH chấm': sc?.isNa ? 'N/A' : (sc?.bghScore ?? sc?.deptScore ?? c.maxPoints),
          'Minh chứng / ghi chú': sc?.evidence || '',
        });
      });

      // Part B
      let selfB = 0;
      let bghB = 0;
      partBCriteria.forEach((c) => {
        const sc = item.scores?.[c.id];
        if (!sc?.isNa) {
          selfB += sc?.selfScore ?? c.maxPoints;
          bghB += sc?.bghScore ?? sc?.deptScore ?? c.maxPoints;
        }
      });

      rows.push({
        STT: 'B',
        'Nội dung đánh giá / nhiệm vụ chi tiết': `B. KPI VỊ TRÍ VIỆC LÀM: ${item.position.toUpperCase()} – 70 ĐIỂM`,
        'Điểm tối đa': 70,
        'Cá nhân tự chấm': Math.round(selfB * 10) / 10,
        'BGH chấm': Math.round(bghB * 10) / 10,
        'Minh chứng / ghi chú': official.positionDef.description,
      });

      partBCriteria.forEach((c) => {
        const sc = item.scores?.[c.id];
        rows.push({
          STT: c.order,
          'Nội dung đánh giá / nhiệm vụ chi tiết': c.content,
          'Điểm tối đa': c.maxPoints,
          'Cá nhân tự chấm': sc?.isNa ? 'N/A' : (sc?.selfScore ?? c.maxPoints),
          'BGH chấm': sc?.isNa ? 'N/A' : (sc?.bghScore ?? sc?.deptScore ?? c.maxPoints),
          'Minh chứng / ghi chú': sc?.evidence || '',
        });
      });

      // Total
      const selfTotal = item.selfTotalScore ?? Math.round((selfA + selfB) * 10) / 10;
      const bghTotal = item.bghTotalScore ?? item.bgh_score ?? Math.round((bghA + bghB) * 10) / 10;
      const rank = item.bghRank || calculateStaffRank(bghTotal, rankingTiers);

      rows.push({});
      rows.push({
        STT: 'TỔNG',
        'Nội dung đánh giá / nhiệm vụ chi tiết': 'TỔNG ĐIỂM KPI (THANG ĐIỂM 100)',
        'Điểm tối đa': 100,
        'Cá nhân tự chấm': selfTotal,
        'BGH chấm': bghTotal,
        'Minh chứng / ghi chú': `Xếp loại: ${rank}`,
      });

      const staffWs = XLSX.utils.json_to_sheet(rows);
      staffWs['!cols'] = [
        { wch: 8 },
        { wch: 65 },
        { wch: 12 },
        { wch: 16 },
        { wch: 16 },
        { wch: 38 },
      ];

      const cleanName = item.staffName.split(' ').slice(-2).join('_');
      const sheetName = `${cleanName}_${item.staffCode}`.substring(0, 30);
      XLSX.utils.book_append_sheet(wb, staffWs, sheetName);
    });

    XLSX.writeFile(wb, `So_Bo_KPI_Tat_Ca_Nhan_Vien_THPT_Phuong_Xa_${schoolYear}.xlsx`);
    showToast(`Đã xuất thành công sổ bộ Excel gồm ${filteredOfficeEvaluations.length} phiếu KPI nhân viên!`, 'success');
  };

  // Save & Print in Sheet view (Requirement 6)
  const handleSaveAndPrint = async () => {
    await handleSaveEvaluation('self_submitted');
    handlePrint();
  };

  const handleCancelSheet = () => {
    setActiveViewMode('list');
    setCurrentEvalRecord(null);
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* 1. TOP HEADER: Single compact line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
              Danh sách phiếu đánh giá KPI nhân viên – Tổ Văn phòng
            </h1>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              (Năm học {schoolYear} • THPT Phương Xá)
            </span>
          </div>
        </div>

        {activeViewMode === 'sheet' && (
          <button
            onClick={handleCancelSheet}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Danh sách phiếu ({officeEvaluations.length})</span>
          </button>
        )}
      </div>

      {/* 2. TOP FUNCTIONAL CONTROL TOOLBAR */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Function Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Button 1: Cấu hình xếp loại */}
          <button
            type="button"
            onClick={() => setIsRankingConfigOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            title="Cấu hình thang điểm và mức xếp loại KPI nhân viên"
          >
            <Settings className="w-4 h-4 text-purple-700 shrink-0" />
            <span>⚙ Cấu hình xếp loại</span>
          </button>

          {/* Button 2: Xuất Excel */}
          <button
            type="button"
            onClick={handleExportListExcel}
            className="h-10 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            title="Xuất danh sách KPI nhân viên sau lọc ra file Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>📊 Xuất Excel</span>
          </button>

          {/* Button 3: In danh sách */}
          <button
            type="button"
            onClick={() => setIsPrintListOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-300 shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            title="In danh sách KPI nhân viên khổ A4 theo chuẩn hành chính"
          >
            <Printer className="w-4 h-4 text-sky-600 shrink-0" />
            <span>🖨 In danh sách</span>
          </button>

          {/* Button 4: Xuất phiếu KPI nhân viên */}
          <button
            type="button"
            onClick={() => setIsExportFormsModalOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs border border-purple-300 shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            title="Xuất phiếu đánh giá KPI chi tiết cho tất cả nhân viên"
          >
            <FileText className="w-4 h-4 text-purple-700 shrink-0" />
            <span>📑 Xuất phiếu KPI nhân viên</span>
          </button>

          {/* Button 5: Xóa toàn bộ */}
          <button
            type="button"
            onClick={() => {
              if (!isBgh && (currentUser as any)?.role !== 'admin') {
                showToast('Chức năng "Xóa toàn bộ" chỉ dành cho Quản trị viên / Ban Giám hiệu!', 'warning');
                return;
              }
              setIsClearModalOpen(true);
            }}
            className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-300 shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            title="Xóa kết quả KPI nhân viên theo phạm vi đã xác nhận"
          >
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>🗑 Xóa toàn bộ</span>
          </button>
        </div>

        {/* Right Action Button: [ ➕ TẠO PHIẾU KPI ] */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            id="btn-create-office-kpi"
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-400/25 transition transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer border border-amber-300 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>＋ TẠO PHIẾU KPI</span>
          </button>
        </div>
      </div>

      {/* 3. VIEW MODE: LIST OF CREATED EVALUATIONS (Requirement X, XI) */}
      {activeViewMode === 'list' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Position Filter Dropdown (Requirement XI) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Vị trí:</span>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Tất cả các vị trí (8 vị trí)</option>
                  {OFFICIAL_STAFF_POSITIONS.map((pos) => (
                    <option key={pos.key} value={pos.key}>
                      {pos.name} (70đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter Dropdown (Requirement 2 & 3) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Tháng đánh giá:</span>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Tất cả các tháng (Cả năm)</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Evaluator Filter Dropdown (Ban Giám hiệu & Tổ trưởng) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Người đánh giá:</span>
                <select
                  value={evaluatorFilter}
                  onChange={(e) => setEvaluatorFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Tất cả người đánh giá (BGH & Tổ trưởng)</option>
                  <optgroup label="👑 Ban Giám hiệu">
                    {bghEvaluators.map((bgh) => (
                      <option key={bgh.id} value={bgh.id}>
                        {bgh.roleType === 'principal' ? '👑 ' : '⭐ '}
                        {bgh.name} ({bgh.roleType === 'principal' ? 'Hiệu trưởng' : 'Phó HT'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="👤 Tổ trưởng">
                    {allTeamLeaders.map((tl) => (
                      <option key={tl.id} value={tl.id}>
                        👤 {tl.name} ({tl.position})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Search input (Requirement XI) */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mã NV, vị trí, người đánh giá..."
                  value={searchStaffQuery}
                  onChange={(e) => setSearchStaffQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                {filteredOfficeEvaluations.length} phiếu đánh giá
              </span>
            </div>
          </div>

          {/* Table of Created Evaluations (Requirement X) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-visible">
            {filteredOfficeEvaluations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Chưa có phiếu đánh giá KPI nào</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hệ thống không tự động tạo phiếu cho tất cả nhân viên. Vui lòng bấm nút{' '}
                  <strong className="text-purple-700 font-bold">[+ TẠO PHIẾU ĐÁNH GIÁ KPI]</strong> để bắt đầu tạo phiếu theo vị trí việc làm!
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tạo phiếu đánh giá ngay</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-visible pb-24">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 text-center w-12">STT</th>
                      <th className="py-3.5 px-4">Họ và tên</th>
                      <th className="py-3.5 px-4">Vị trí</th>
                      <th className="py-3.5 px-4">Bộ phận</th>
                      <th className="py-3.5 px-4 text-center">Kỳ đánh giá</th>
                      <th className="py-3.5 px-4">Người đánh giá</th>
                      <th className="py-3.5 px-4 text-center">KPI Chung (30đ)</th>
                      <th className="py-3.5 px-4 text-center">KPI Vị trí (70đ)</th>
                      <th className="py-3.5 px-4 text-center">Tổng điểm</th>
                      <th className="py-3.5 px-4 text-center">Xếp loại</th>
                      <th className="py-3.5 px-4 text-right min-w-[220px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOfficeEvaluations.map((item, idx) => {
                      const totalScore = item.bghTotalScore ?? item.selfTotalScore ?? 100;
                      const rankLabel = item.bghRank || item.selfRank || calculateStaffRank(totalScore, rankingTiers);

                      // Calculate breakdown scores from saved scores
                      let scoreA = 0;
                      let scoreB = 0;
                      STAFF_GENERAL_KPI_CRITERIA.forEach((crit) => {
                        const sc = item.scores?.[crit.id];
                        scoreA += sc?.isNa ? 0 : (sc?.bghScore ?? sc?.selfScore ?? crit.maxPoints);
                      });
                      const posKey = detectStaffPositionKey(item.position);
                      const pDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === posKey) || OFFICIAL_STAFF_POSITIONS[0];
                      pDef.criteria.forEach((crit) => {
                        const sc = item.scores?.[crit.id];
                        scoreB += sc?.isNa ? 0 : (sc?.bghScore ?? sc?.selfScore ?? crit.maxPoints);
                      });

                      return (
                        <tr key={item.id} className="hover:bg-purple-50/40 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{item.staffName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.staffCode}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                              {item.position}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">Tổ Văn phòng</td>
                          <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                            {item.periodName || 'Tháng 09/2026'}
                          </td>
                          <td className="py-3.5 px-4">
                            {(() => {
                              const isTt =
                                item.evaluator_role === 'Tổ trưởng' ||
                                item.evaluatorRole === 'Tổ trưởng' ||
                                item.evaluatorType === 'TOTRUONG' ||
                                item.evaluator_type === 'TOTRUONG' ||
                                !!item.ttcmEvaluatorName;
                              const evalName =
                                item.evaluator_name ||
                                (isTt ? item.ttcmEvaluatorName : item.bghEvaluatorName) ||
                                item.evaluatorName?.split('–')[0]?.split('(')[0]?.trim() ||
                                (isTt ? 'Tổ trưởng' : 'Ban Giám hiệu');
                              const evalRole =
                                item.evaluator_role ||
                                item.evaluatorRole ||
                                (isTt
                                  ? item.ttcmEvaluatorRole || `Tổ trưởng ${item.department_name || item.department || 'Tổ Văn phòng'}`
                                  : item.bghEvaluatorRole || 'Hiệu trưởng');
                              return (
                                <div>
                                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                    <span>{isTt ? '👤' : '👑'}</span>
                                    <span>{evalName}</span>
                                  </div>
                                  <div className={`text-[10px] font-semibold pl-5 ${isTt ? 'text-emerald-700' : 'text-purple-700'}`}>
                                    {evalRole}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-blue-700">
                            {Math.round(scoreA * 10) / 10} / 30
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                            {Math.round(scoreB * 10) / 10} / 70
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-sm font-black text-purple-950">
                              {Math.round(totalScore * 10) / 10}
                            </span>
                            <span className="text-[10px] text-slate-400"> / 100</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStaffRankBadgeClass(rankLabel, rankingTiers)}`}>
                              {rankLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[220px] relative">
                            <div className="inline-flex items-center gap-1.5 flex-nowrap justify-end relative">
                              {/* 1. Xem/Sửa */}
                              <button
                                onClick={() => {
                                  setCurrentEvalRecord(item);
                                  setActiveViewMode('sheet');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-blue-200 shrink-0"
                                title="Xem và chấm điểm chi tiết"
                                style={{ minHeight: '36px' }}
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Xem/Sửa</span>
                              </button>

                              {/* 2. Trạng thái / Đã hoàn tất */}
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold shrink-0 border ${
                                item.status === 'completed' || item.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`} style={{ minHeight: '28px', display: 'inline-flex', alignItems: 'center' }}>
                                {item.status === 'completed' || item.status === 'approved' ? 'Đã hoàn tất' : 'Đang soạn'}
                              </span>

                              {/* 3. Quick View [ 👁 ] */}
                              <button
                                onClick={() => {
                                  setCurrentEvalRecord(item);
                                  setActiveViewMode('sheet');
                                }}
                                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer border border-slate-300 shrink-0 shadow-2xs"
                                title="Xem nhanh phiếu KPI"
                                style={{ minWidth: '36px', minHeight: '36px' }}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 4. More Menu [ ⋯ ] */}
                              <div className="relative inline-block text-left shrink-0">
                                <button
                                  type="button"
                                  ref={(el) => (actionButtonRefs.current[item.id] = el)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeActionDropdownId === item.id) {
                                      setActiveActionDropdownId(null);
                                    } else {
                                      const btnEl = actionButtonRefs.current[item.id];
                                      if (btnEl) {
                                        const rect = btnEl.getBoundingClientRect();
                                        const menuWidth = 192;
                                        const menuHeight = isBgh ? 180 : 130;
                                        
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

                                        setDropdownPos({ top, left, openUpward: false });
                                      }
                                      setActiveActionDropdownId(item.id);
                                    }
                                  }}
                                  className="staff-kpi-action-btn w-9 h-9 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm transition cursor-pointer border border-purple-200 shrink-0 shadow-2xs"
                                  title="Thêm tùy chọn khác"
                                  style={{ minWidth: '36px', minHeight: '36px' }}
                                >
                                  ⋯
                                </button>

                                {activeActionDropdownId === item.id &&
                                  ReactDOM.createPortal(
                                    <div
                                      className="staff-kpi-action-portal-menu fixed w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[99999] text-left animate-in fade-in zoom-in-95"
                                      style={{
                                        top: `${dropdownPos.top}px`,
                                        left: `${dropdownPos.left}px`,
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionDropdownId(null);
                                          exportEvaluationItemToWord(item);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                                      >
                                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span>Xuất file Word</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionDropdownId(null);
                                          exportEvaluationItemToExcel(item);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                                      >
                                        <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Xuất file Excel</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionDropdownId(null);
                                          setCurrentEvalRecord(item);
                                          setActiveViewMode('sheet');
                                          setTimeout(() => handlePrint(), 150);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                                      >
                                        <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                                        <span>In phiếu A4</span>
                                      </button>
                                      {isBgh && (
                                        <div className="border-t border-slate-100 my-1.5"></div>
                                      )}
                                      {isBgh && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionDropdownId(null);
                                            if (!isBgh && (currentUser as any)?.role !== 'admin') {
                                              showToast('Bạn không có quyền xóa phiếu KPI.', 'error');
                                              return;
                                            }
                                            setDeletingEvalRecord(item);
                                          }}
                                          className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                                          <span>Xóa phiếu</span>
                                        </button>
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
            )}
          </div>
        </div>
      )}

      {/* 3. VIEW MODE: EVALUATION SHEET VIEW (Matching PDF Format) */}
      {activeViewMode === 'sheet' && activeStaff && (
        <div className="space-y-4">
          {/* Top Return to Main Window Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToMainList}
              id="btn-back-to-main-window"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-300 shadow-2xs group"
              title="Quay lại cửa sổ làm việc chính (Danh sách phiếu KPI CBGVNV)"
            >
              <ArrowLeft className="w-4 h-4 text-purple-700 group-hover:-translate-x-0.5 transition-transform" />
              <span>← QUAY LẠI</span>
            </button>
          </div>

          {/* BỘ TIÊU CHÍ KPI NHÂN VIÊN SELECTOR */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                BỘ TIÊU CHÍ KPI NHÂN VIÊN
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Đang áp dụng:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black">
                  {activePositionDef.name === 'Kế toán' ? '📊 Tiêu chí nhân viên Kế toán' :
                   activePositionDef.name === 'Thư viện' ? '📚 Tiêu chí nhân viên Thư viện' :
                   activePositionDef.name === 'Văn thư' ? '📁 Tiêu chí nhân viên Văn thư' :
                   activePositionDef.name === 'Nhân viên Y tế' ? '🏥 Tiêu chí nhân viên Y tế' :
                   `Tiêu chí nhân viên ${activePositionDef.name}`}
                </span>
                <span className="text-xs text-emerald-300 font-bold ml-2">Tổng bộ tiêu chí: 70/70 điểm</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <select
                value={sheetPositionKey}
                onChange={(e) => {
                  const newKey = e.target.value;
                  setSheetPositionKey(newKey);
                  const newPosDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === newKey) || OFFICIAL_STAFF_POSITIONS[0];
                  const generalCrits = criteriaConfig.generalCriteria || STAFF_GENERAL_KPI_CRITERIA;
                  const posCrits = criteriaConfig.positionCriteriaMap?.[newKey] || newPosDef.criteria;
                  const combined = [...generalCrits, ...posCrits];
                  const newSnapshot = combined.map((c: any) => ({
                    id: c.id,
                    section: c.section,
                    sectionTitle: c.sectionTitle,
                    order: c.order,
                    content: c.content,
                    maxPoints: c.maxPoints,
                    groupTitle: c.groupTitle,
                  }));
                  if (currentEvalRecord) {
                    setCurrentEvalRecord({
                      ...currentEvalRecord,
                      position: newPosDef.name,
                      job_position_name: newPosDef.name,
                      criteria_snapshot: newSnapshot,
                    });
                  }
                  showToast(`✓ Đã chuyển sang bộ tiêu chí ${newPosDef.name}`, 'success');
                }}
                className="px-3.5 py-2 rounded-xl border border-purple-400/50 bg-white/15 text-white font-black text-xs focus:bg-white focus:text-slate-900 cursor-pointer shadow-2xs"
              >
                <option value="ketoan" className="text-slate-900 font-bold">📊 Tiêu chí nhân viên Kế toán</option>
                <option value="thuvien" className="text-slate-900 font-bold">📚 Tiêu chí nhân viên Thư viện</option>
                <option value="vanthu" className="text-slate-900 font-bold">📁 Tiêu chí nhân viên Văn thư</option>
                <option value="yte" className="text-slate-900 font-bold">🏥 Tiêu chí nhân viên Y tế</option>
              </select>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-1.5 shrink-0 border border-purple-400/50"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>➕ Thêm tiêu chí</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-1.5 shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>✏️ Sửa tiêu chí</span>
              </button>
            </div>
          </div>

          {/* Action Bar & Staff Info Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Nhân viên được đánh giá • Tổ Văn phòng
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>{activeStaff.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-bold">
                      {activePositionDef.name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({activeStaff.code})</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleQuickFillMax}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Điền nhanh điểm tối đa (100đ)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Điền tối đa (100đ)</span>
                </button>

                <button
                  onClick={handleQuickResetZero}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="Đặt lại điểm về 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại 0đ</span>
                </button>

                <button
                  onClick={handleExportWord}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Xuất file Word (.doc) theo đúng chuẩn hành chính"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xuất Word</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Xuất file Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="In phiếu A4"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-300" />
                  <span>In phiếu A4</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackToMainList}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>← QUAY LẠI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveEvaluation('self_submitted')}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>💾 LƯU THAY ĐỔI</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndPrint}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  title="Lưu phiếu và mở hộp thoại in / PDF ngay"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-200" />
                  <span>Lưu và in</span>
                </button>
              </div>
            </div>

            {/* Score summary 3-cards (Requirement XII) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  A. KPI Chung (7 tiêu chí)
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-blue-900">{scoreBreakdowns.partA.self}</span>
                  <span className="text-xs text-blue-700 font-semibold">/ 30 điểm</span>
                </div>
                <div className="text-[11px] text-blue-600 mt-1">
                  Chấp hành pháp luật, kỷ luật, văn hóa công sở, công nghệ
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  B. KPI Vị trí: {activePositionDef.name} (7 tiêu chí)
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-900">{scoreBreakdowns.partB.self}</span>
                  <span className="text-xs text-emerald-700 font-semibold">/ 70 điểm</span>
                </div>
                <div className="text-[11px] text-emerald-600 mt-1">
                  Nhiệm vụ chuyên môn đặc thù của {activePositionDef.name}
                </div>
              </div>

              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                    TỔNG ĐIỂM KPI (CÁ NHÂN & BGH)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStaffRankBadgeClass(scoreBreakdowns.total.bgh !== null ? bghRank : selfRank, rankingTiers)}`}>
                    {scoreBreakdowns.total.bgh !== null ? bghRank : `Tự chấm: ${selfRank} (Chờ BGH)`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <div className="text-[10px] text-slate-600 font-bold">Cá nhân tự chấm:</div>
                    <div className="text-xl font-black text-blue-900">{scoreBreakdowns.total.self}/100đ</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 font-bold">BGH chấm chính thức:</div>
                    <div className="text-xl font-black text-purple-950">
                      {scoreBreakdowns.total.bgh !== null ? `${scoreBreakdowns.total.bgh}/100đ` : '--/100 (Chưa đánh giá)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* THÔNG TIN TỔNG QUAN PHIẾU ĐÁNH GIÁ (Requirement 10) */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50/50 rounded-2xl p-4 sm:p-5 border-2 border-purple-200 shadow-xs max-w-5xl mx-auto space-y-2">
            <div className="text-[11px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>THÔNG TIN TỔNG QUAN PHIẾU ĐÁNH GIÁ (KẾT QUẢ THỰC HIỆN)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
              <div className="p-3 bg-white/90 rounded-xl border border-purple-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  NGƯỜI ĐƯỢC ĐÁNH GIÁ:
                </div>
                <div className="text-sm font-black text-slate-900">
                  {activeStaff.name} – {activePositionDef.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Mã: {activeStaff.code}
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-purple-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  TỔ/BỘ PHẬN:
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentEvalRecord?.department_name || currentEvalRecord?.department || 'Tổ Văn phòng'}
                </div>
                <div className="text-[11px] text-purple-700 font-medium">
                  Trường THPT Phương Xá
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-purple-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  NGƯỜI ĐÁNH GIÁ:
                </div>
                <div className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                  <span>{currentSheetEvaluator?.category === 'BGH' ? '👑' : '👤'}</span>
                  <span>
                    {currentSheetEvaluator?.name} – {currentSheetEvaluator?.position}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentSheetEvaluator?.category === 'TOTRUONG'
                    ? `Tổ trưởng ${currentEvalRecord?.department_name || currentEvalRecord?.department || 'Tổ Văn phòng'}`
                    : 'Lãnh đạo Ban Giám hiệu'}
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-purple-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  KỲ ĐÁNH GIÁ:
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentEvalRecord?.periodName || (currentEvalRecord?.month ? `Tháng ${String(currentEvalRecord.month).padStart(2, '0')}/${currentEvalRecord.year || 2026}` : 'Tháng 09/2026')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Năm học 2026–2027
                </div>
              </div>
            </div>
          </div>

          {/* OFFICIAL ADMINISTRATIVE KPI SHEET (According to PDF File) */}
          <div className="bg-white rounded-3xl border border-slate-300 shadow-md p-6 sm:p-10 max-w-5xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
            {/* National Header & School Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b-2 border-slate-800 text-center sm:text-left">
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-tight">SỞ GD&ĐT PHÚ THỌ</div>
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">TRƯỜNG THPT PHƯƠNG XÁ</div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xs font-bold text-slate-900 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="text-xs font-semibold text-slate-800 underline underline-offset-4">Độc lập – Tự do – Hạnh phúc</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 py-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                PHIẾU ĐÁNH GIÁ, CHẤM ĐIỂM KPI NHÂN VIÊN
              </h2>
              <div className="text-xs font-semibold text-slate-600 italic">
                Năm học 2026–2027 – Dự thảo vận hành
              </div>
            </div>

            {/* Employee Official Meta Box (Requirement IV & VI & 10) */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 min-w-[170px]">Họ và tên:</span>
                <span className="font-extrabold text-slate-900">{activeStaff.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 min-w-[170px]">Chức danh/vị trí việc làm:</span>
                <span className="font-extrabold text-purple-800">{activePositionDef.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 min-w-[170px]">Tổ/Bộ phận:</span>
                <span className="font-extrabold text-slate-900">
                  {currentEvalRecord?.department_name || currentEvalRecord?.department || 'Tổ Văn phòng'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 min-w-[170px]">Người đánh giá:</span>
                <select
                  value={sheetEvaluatorId || currentSheetEvaluator?.id}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSheetEvaluatorId(newId);
                    const found = allAvailableEvaluators.find((b) => b.id === newId);
                    if (found && currentEvalRecord) {
                      const roleNorm =
                        found.category === 'TOTRUONG'
                          ? 'Tổ trưởng'
                          : found.roleType === 'principal'
                          ? 'Hiệu trưởng'
                          : 'Phó Hiệu trưởng';
                      setCurrentEvalRecord({
                        ...currentEvalRecord,
                        evaluatorId: found.id,
                        evaluator_id: found.id,
                        evaluatorName: `${found.name} – ${found.position}`,
                        evaluator_name: found.name,
                        evaluatorRole: roleNorm,
                        evaluator_role: roleNorm,
                        evaluator_department_id: found.departmentId,
                        evaluator_department_name: found.departmentName,
                        evaluatorType: found.category,
                        evaluator_type: found.category,
                        ...(found.category === 'BGH'
                          ? {
                              bghEvaluatorId: found.id,
                              bghEvaluatorName: found.name,
                              bghEvaluatorRole: found.position,
                              bgh_evaluator_id: found.id,
                              bgh_evaluator_name: found.name,
                              bgh_evaluator_role: found.position,
                            }
                          : {
                              ttcmEvaluatorId: found.id,
                              ttcmEvaluatorName: found.name,
                              ttcmEvaluatorRole: found.position,
                              ttcmEvaluatorDepartment: found.departmentName,
                              ttcm_evaluator_id: found.id,
                              ttcm_evaluator_name: found.name,
                              ttcm_evaluator_role: found.position,
                              ttcm_evaluator_department: found.departmentName,
                            }),
                      });
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl border border-purple-300 bg-white font-black text-purple-950 text-xs focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs max-w-[280px]"
                >
                  <optgroup label="👑 Ban Giám hiệu">
                    {bghEvaluators.map((bgh) => (
                      <option key={bgh.id} value={bgh.id}>
                        {bgh.roleType === 'principal' ? '👑 ' : '⭐ '}
                        {bgh.name} — {bgh.position}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="👤 Tổ trưởng">
                    {allTeamLeaders
                      .filter((tl) => tl.departmentId === (currentEvalRecord?.department_id || candidateStaffDeptId || 'to-van-phong'))
                      .map((tl) => (
                        <option key={tl.id} value={tl.id}>
                          👤 {tl.name} — {tl.position}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Legal Note & Citation */}
            <div className="text-[11px] text-slate-600 space-y-1 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/70">
              <p>
                <strong>Cấu trúc điểm:</strong> 30 điểm KPI chung + 70 điểm KPI theo đúng vị trí việc làm. Chỉ kích hoạt một bộ KPI vị trí cho mỗi nhân viên.
              </p>
              <p>
                <strong>Căn cứ nguồn:</strong> Bộ KPI chi tiết và bảng cấu trúc dữ liệu KPI THPT Sơn Lương 2026–2027. Các điểm vị trí dưới đây được giữ theo bộ dữ liệu; phần diễn giải nhiệm vụ được cụ thể hóa để thuận tiện chấm điểm.
              </p>
            </div>

            {/* SECTION A: KPI CHUNG – 30 ĐIỂM (Requirement VII) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-900 text-white px-4 py-2.5 rounded-xl font-black text-sm">
                <span>A. KPI CHUNG – 30 ĐIỂM</span>
                <span className="text-xs font-semibold text-blue-200">
                  Cá nhân: {scoreBreakdowns.partA.self}đ • BGH: {scoreBreakdowns.isBghFullyGraded ? `${scoreBreakdowns.partA.bgh}đ` : 'Chưa chấm'}
                </span>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-12">STT</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-20">MÃ KPI</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">NỘI DUNG ĐÁNH GIÁ / NHIỆM VỤ</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-20">ĐIỂM TỐI ĐA</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-28">CÁ NHÂN TỰ CHẤM</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-28">BGH CHẤM</th>
                      <th className="py-2.5 px-3 w-48">MINH CHỨNG / GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sheetGeneralCriteria.map((crit, idx) => {
                      const sc = scores[crit.id];
                      const selfVal = sc?.isNa ? 0 : (sc?.selfScore ?? 0);
                      const bghVal = sc?.bghScore !== undefined && sc?.bghScore !== null ? sc.bghScore : '';

                      return (
                        <tr key={crit.id} className="hover:bg-blue-50/20">
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-blue-800">
                            {crit.id}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 font-medium leading-relaxed">
                            {crit.content}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-extrabold text-slate-900">
                            {crit.maxPoints}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={crit.maxPoints}
                              value={selfVal}
                              onChange={(e) =>
                                handleScoreChange(
                                  crit.id,
                                  'selfScore',
                                  parseFloat(e.target.value) || 0,
                                  crit.maxPoints
                                )
                              }
                              className="w-20 text-center py-1 rounded-lg border border-slate-300 font-black text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={crit.maxPoints}
                              placeholder="-- đ"
                              value={bghVal}
                              disabled={!isUserBgh}
                              onChange={(e) =>
                                handleScoreChange(
                                  crit.id,
                                  'bghScore',
                                  parseFloat(e.target.value) || 0,
                                  crit.maxPoints
                                )
                              }
                              className="w-20 text-center py-1 rounded-lg border border-slate-300 font-black text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="Nhập minh chứng..."
                              value={sc?.evidence || ''}
                              onChange={(e) => handleEvidenceChange(crit.id, e.target.value)}
                              className="w-full py-1 px-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                            />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50/50 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2.5 px-4 uppercase text-right border-r border-slate-300">
                        TỔNG KPI CHUNG
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sm">30</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sm text-blue-900">
                        {scoreBreakdowns.partA.self}đ
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sm text-purple-900">
                        {scoreBreakdowns.isBghFullyGraded ? `${scoreBreakdowns.partA.bgh}đ` : '-- đ'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 italic">Đạt chuẩn 30 điểm chung</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION B: KPI VỊ TRÍ VIỆC LÀM – 70 ĐIỂM (Requirement VIII) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-purple-900 text-white px-4 py-2.5 rounded-xl font-black text-sm">
                <span>B. KPI VỊ TRÍ VIỆC LÀM: {activePositionDef.name.toUpperCase()} – 70 ĐIỂM</span>
                <span className="text-xs font-semibold text-purple-200">
                  Cá nhân: {scoreBreakdowns.partB.self}đ • BGH: {scoreBreakdowns.isBghFullyGraded ? `${scoreBreakdowns.partB.bgh}đ` : 'Chưa chấm'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 italic px-1">
                Chỉ áp dụng khi nhân viên được phân công đúng vị trí này. Điểm tối đa của bộ vị trí = 70 điểm.
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-12">STT</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-20">MÃ KPI</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">NỘI DUNG ĐÁNH GIÁ / NHIỆM VỤ</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-20">ĐIỂM TỐI ĐA</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-28">CÁ NHÂN TỰ CHẤM</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-28">BGH CHẤM</th>
                      <th className="py-2.5 px-3 w-48">MINH CHỨNG / GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sheetPositionCriteria.map((crit, idx) => {
                      const sc = scores[crit.id];
                      const selfVal = sc?.isNa ? 0 : (sc?.selfScore ?? 0);
                      const bghVal = sc?.bghScore !== undefined && sc?.bghScore !== null ? sc.bghScore : '';

                      return (
                        <tr key={crit.id} className="hover:bg-purple-50/20">
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-purple-800">
                            {crit.id}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 font-medium leading-relaxed">
                            {crit.content}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-extrabold text-slate-900">
                            {crit.maxPoints}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={crit.maxPoints}
                              value={selfVal}
                              onChange={(e) =>
                                handleScoreChange(
                                  crit.id,
                                  'selfScore',
                                  parseFloat(e.target.value) || 0,
                                  crit.maxPoints
                                )
                              }
                              className="w-20 text-center py-1 rounded-lg border border-slate-300 font-black text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={crit.maxPoints}
                              placeholder="-- đ"
                              value={bghVal}
                              disabled={!isUserBgh}
                              onChange={(e) =>
                                handleScoreChange(
                                  crit.id,
                                  'bghScore',
                                  parseFloat(e.target.value) || 0,
                                  crit.maxPoints
                                )
                              }
                              className="w-20 text-center py-1 rounded-lg border border-slate-300 font-black text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="Nhập minh chứng..."
                              value={sc?.evidence || ''}
                              onChange={(e) => handleEvidenceChange(crit.id, e.target.value)}
                              className="w-full py-1 px-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700"
                            />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-purple-50/50 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2.5 px-4 uppercase text-right border-r border-slate-300">
                        TỔNG KPI VỊ TRÍ
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sm">70</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sm text-purple-900">
                        {scoreBreakdowns.partB.self}đ
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 text-sm text-purple-900">
                        {scoreBreakdowns.isBghFullyGraded ? `${scoreBreakdowns.partB.bgh}đ` : '-- đ'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 italic">Đạt chuẩn 70 điểm vị trí</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Suggestions & Scoring Guidelines from PDF */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p>
                  <strong>Minh chứng gợi ý:</strong> hồ sơ/sổ sách vị trí việc làm; báo cáo; phần mềm; biên bản kiểm tra; phiếu giao việc; xác nhận của bộ phận phụ trách. Người theo dõi: TTVP/bộ phận phụ trách; BGH kiểm tra, phê duyệt/tổng hợp.
                </p>
                <p>
                  <strong>Cách chấm đề xuất:</strong> chấm trong phạm vi điểm tối đa của từng nhiệm vụ theo mức hoàn thành thực tế, căn cứ tiến độ, chất lượng, hiệu quả và minh chứng; không chấm chỉ bằng số lượng.
                </p>
              </div>
            </div>

            {/* SECTION C: NGUYÊN TẮC CHẤM VÀ TỔNG HỢP (Requirement VI, Page 10 of PDF) */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                C. NGUYÊN TẮC CHẤM VÀ TỔNG HỢP
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                {KPI_OFFICE_PRINCIPLES.map((rule, idx) => (
                  <p key={idx}>{rule}</p>
                ))}
              </div>
            </div>

            {/* SECTION D: TỔNG HỢP ĐIỂM (CÁ NHÂN & BGH) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                D. TỔNG HỢP ĐIỂM (CÁ NHÂN TỰ CHẤM & BGH CHẤM)
              </h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden max-w-3xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-4 border-r border-slate-300">Nội dung</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-24">Tối đa</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-32">Cá nhân tự chấm</th>
                      <th className="py-2.5 px-3 text-center w-36">BGH chấm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold">
                    <tr>
                      <td className="py-2.5 px-4 border-r border-slate-200">KPI chung</td>
                      <td className="py-2.5 px-4 text-center border-r border-slate-200 font-bold">30</td>
                      <td className="py-2.5 px-4 text-center font-bold text-blue-900">{scoreBreakdowns.partA.self}đ</td>
                      <td className="py-2.5 px-4 text-center font-bold text-purple-900">
                        {scoreBreakdowns.isBghFullyGraded ? `${scoreBreakdowns.partA.bgh}đ` : '-- (Chưa chấm)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 border-r border-slate-200">KPI vị trí việc làm</td>
                      <td className="py-2.5 px-4 text-center border-r border-slate-200 font-bold">70</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-900">{scoreBreakdowns.partB.self}đ</td>
                      <td className="py-2.5 px-4 text-center font-bold text-purple-900">
                        {scoreBreakdowns.isBghFullyGraded ? `${scoreBreakdowns.partB.bgh}đ` : '-- (Chưa chấm)'}
                      </td>
                    </tr>
                    <tr className="bg-purple-50 font-black text-slate-900">
                      <td className="py-2.5 px-4 border-r border-slate-200 uppercase">Tổng điểm KPI</td>
                      <td className="py-2.5 px-4 text-center border-r border-slate-200">100</td>
                      <td className="py-2.5 px-4 text-center text-blue-950 text-sm">{scoreBreakdowns.total.self}/100</td>
                      <td className="py-2.5 px-4 text-center text-purple-950 text-sm">
                        {scoreBreakdowns.total.bgh !== null ? `${scoreBreakdowns.total.bgh}/100` : '--/100 (Chưa đánh giá)'}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="py-2.5 px-4 border-r border-slate-200">Xếp loại chính thức</td>
                      <td className="py-2.5 px-4 text-center border-r border-slate-200 text-slate-400">—</td>
                      <td className="py-2.5 px-4 text-center text-blue-700">{selfRank} (Tự chấm)</td>
                      <td className="py-2.5 px-4 text-center text-purple-700 font-black">
                        {scoreBreakdowns.total.bgh !== null ? bghRank : '🟡 Chờ BGH đánh giá'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* NHẬN XÉT CỦA BGH */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <label className="block font-black text-slate-900 text-xs uppercase">
                NHẬN XÉT CỦA BGH:
              </label>
              <textarea
                rows={3}
                value={bghNote}
                onChange={(e) => setBghNote(e.target.value)}
                placeholder="Nhận xét, đánh giá của Ban Giám hiệu đối với viên chức..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
              />
              <div className="grid grid-cols-2 gap-4 pt-1 text-[11px] text-slate-600 font-bold">
                <div>Người đánh giá (BGH): <span className="text-purple-900 font-black">{currentSheetEvaluator?.name} – {currentSheetEvaluator?.position}</span></div>
                <div className="text-right">Thời gian đánh giá: <span className="font-mono">{currentEvalRecord?.bghDate || new Date().toLocaleDateString('vi-VN')}</span></div>
              </div>
            </div>

            {/* ACTION BUTTONS FOR BGH & STAFF */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-300">
              <button
                type="button"
                onClick={() => handleSaveEvaluation('draft')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                💾 Lưu phiếu
              </button>
              <button
                type="button"
                onClick={() => handleSaveEvaluation('bgh_approved')}
                className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                💾 LƯU KẾT QUẢ BGH
              </button>
              <button
                type="button"
                onClick={async () => {
                  const missing: string[] = [];
                  sheetGeneralCriteria.concat(sheetPositionCriteria).forEach((c) => {
                    const sc = scores[c.id];
                    if (sc?.bghScore === undefined || sc?.bghScore === null || isNaN(sc.bghScore)) {
                      missing.push(`${c.id} (${c.content.substring(0, 25)}...)`);
                    }
                  });
                  if (missing.length > 0) {
                    showToast(`❌ Chưa thể hoàn tất. Còn thiếu BGH chấm các tiêu chí: ${missing.join(', ')}`, 'error');
                    return;
                  }
                  await handleSaveEvaluation('completed');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                ✓ HOÀN TẤT ĐÁNH GIÁ
              </button>
              <button
                type="button"
                onClick={() => handleExportWord()}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                title="Xuất file Word (.docx) chuẩn hành chính"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xuất Word</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportExcel()}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                title="Xuất file Excel (.xlsx) chuẩn biểu mẫu"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu A4</span>
              </button>
            </div>

            {/* Signatures Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 uppercase">NGƯỜI TỰ ĐÁNH GIÁ</div>
                <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16 flex items-end justify-center font-extrabold text-slate-800">
                  {activeStaff.name}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 uppercase">
                  {currentSheetEvaluator?.category === 'TOTRUONG'
                    ? (currentSheetEvaluator.position?.toUpperCase() || 'TỔ TRƯỞNG VĂN PHÒNG')
                    : 'TỔ TRƯỞNG VĂN PHÒNG'}
                </div>
                <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16 flex items-end justify-center font-semibold text-slate-700">
                  {currentSheetEvaluator?.category === 'TOTRUONG'
                    ? currentSheetEvaluator.name
                    : (currentEvalRecord?.ttcmEvaluatorName || 'Hoàng Mỹ Hạnh')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 uppercase">
                  {currentSheetEvaluator?.category === 'TOTRUONG'
                    ? 'HIỆU TRƯỞNG PHÊ DUYỆT'
                    : currentSheetEvaluator?.position
                    ? `${currentSheetEvaluator.position.toUpperCase()} PHÊ DUYỆT`
                    : 'HIỆU TRƯỞNG PHÊ DUYỆT'}
                </div>
                <div className="text-[11px] text-slate-500 italic">(Ký tên và đóng dấu)</div>
                <div className="h-16 flex items-end justify-center font-extrabold text-blue-900">
                  {currentSheetEvaluator?.category === 'TOTRUONG'
                    ? ((schoolConfig as any).principalName || 'Thầy Lê Quốc Tuấn')
                    : (currentSheetEvaluator?.name || (schoolConfig as any).principalName || 'Thầy Lê Quốc Tuấn')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: "TẠO PHIẾU ĐÁNH GIÁ KPI NHÂN VIÊN" (Requirements I, II, III, IV, V) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 font-black">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                    TỔ VĂN PHÒNG • TRƯỜNG THPT PHƯƠNG XÁ
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    TẠO PHIẾU ĐÁNH GIÁ KPI NHÂN VIÊN
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[80vh]">
              {/* BƯỚC 1: CHỌN VỊ TRÍ VIỆC LÀM * (Requirement II) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>VỊ TRÍ VIỆC LÀM *</span>
                </label>
                <select
                  value={selectedPositionKey}
                  onChange={(e) => setSelectedPositionKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-300 bg-purple-50/40 text-sm font-black text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-xs"
                >
                  {OFFICIAL_STAFF_POSITIONS.map((pos, idx) => (
                    <option key={pos.key} value={pos.key}>
                      {idx + 1}. {pos.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 italic">
                  Không dùng “Tổ Văn phòng” làm vị trí KPI. “Tổ Văn phòng” là bộ phận; vị trí KPI phải đúng 1 trong 8 vị trí trên.
                </p>
              </div>

              {/* BƯỚC 2: CHỌN NHÂN VIÊN * (Requirement III) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>CHỌN NHÂN VIÊN *</span>
                  </label>
                  <span className="text-[11px] font-bold text-purple-700">
                    {eligibleStaffForSelectedPosition.length} nhân viên phù hợp vị trí {modalSelectedPositionDef.name}
                  </span>
                </div>

                {eligibleStaffForSelectedPosition.length > 0 ? (
                  <select
                    value={selectedStaffIdForCreate}
                    onChange={(e) => setSelectedStaffIdForCreate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
                  >
                    {eligibleStaffForSelectedPosition.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.position} ({staff.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Chưa có nhân viên nào trong hồ sơ thuộc vị trí “{modalSelectedPositionDef.name}”.</span>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Bạn có thể thêm nhanh một nhân viên mới cho vị trí này để tạo phiếu ngay lập tức:
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsQuickAddStaffOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Thêm nhanh nhân viên {modalSelectedPositionDef.name}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* BƯỚC 3: CHỌN KỲ ĐÁNH GIÁ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">KỲ ĐÁNH GIÁ *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEvalPeriod('thang')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      modalEvalPeriod === 'thang'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Theo tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEvalPeriod('ki1')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      modalEvalPeriod === 'ki1'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Học kì I
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEvalPeriod('ki2')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      modalEvalPeriod === 'ki2'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Học kì II
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEvalPeriod('canam')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      modalEvalPeriod === 'canam'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Cả năm học
                  </button>
                </div>
                {modalEvalPeriod === 'thang' && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Chọn tháng:</span>
                    <select
                      value={modalEvalMonth}
                      onChange={(e) => setModalEvalMonth(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-xs font-bold text-purple-950 cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {String(m).padStart(2, '0')} / {modalEvalYear}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* BƯỚC 4: TỔ / BỘ PHẬN & NGƯỜI ĐÁNH GIÁ (Requirement 1, 2, 3, 4, 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* TỔ / BỘ PHẬN * */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">TỔ / BỘ PHẬN *</label>
                    <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Tự động theo nhân viên
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={candidateStaffDeptName}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-bold text-slate-800 shadow-2xs cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-500 italic">
                    Tổ/Bộ phận công tác của nhân viên ({candidateStaffDeptName}). Giữ nguyên dữ liệu hệ thống.
                  </p>
                </div>

                {/* NGƯỜI ĐÁNH GIÁ (2 CHỨC NĂNG ĐỘC LẬP: TỔ TRƯỞNG & BGH) */}
                <div className="space-y-4 sm:col-span-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-200">
                  <div className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5 pb-1 border-b border-purple-200">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Cấu hình người đánh giá (Tổ trưởng đánh giá trước, BGH đánh giá sau)</span>
                  </div>

                  {/* 1. 👤 TỔ TRƯỞNG ĐÁNH GIÁ * */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>👤 TỔ TRƯỞNG ĐÁNH GIÁ *</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Bước 1: Chấm sơ bộ
                      </span>
                    </div>

                    {eligibleTeamLeadersForCandidate.length > 0 ? (
                      <select
                        value={selectedTeamLeaderId}
                        onChange={(e) => setSelectedTeamLeaderId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/30 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs cursor-pointer"
                      >
                        {eligibleTeamLeadersForCandidate.map((evaluator) => (
                          <option key={evaluator.id} value={evaluator.id}>
                            👤 {evaluator.name} — {evaluator.position} ({evaluator.departmentName})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold space-y-1">
                        <div>⚠️ Chưa cấu hình Tổ trưởng cho {candidateStaffDeptName}.</div>
                        <div className="text-[11px] font-normal text-amber-800">
                          Vui lòng cấu hình Tổ trưởng cho bộ phận này trong danh sách CBGVNV trước khi tạo phiếu.
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 italic">
                      Tự động lọc Tổ trưởng trực thuộc đúng {candidateStaffDeptName} của nhân viên.
                    </p>
                  </div>

                  {/* 2. 👑 BAN GIÁM HIỆU ĐÁNH GIÁ * */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>👑 BAN GIÁM HIỆU ĐÁNH GIÁ *</span>
                      </label>
                      <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Bước 2: Phê duyệt / Tổng hợp
                      </span>
                    </div>

                    <select
                      value={selectedBghEvaluatorId}
                      onChange={(e) => setSelectedBghEvaluatorId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-purple-300 bg-white text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs cursor-pointer"
                    >
                      {bghEvaluators.map((evaluator) => (
                        <option key={evaluator.id} value={evaluator.id}>
                          {evaluator.roleType === 'principal' ? '👑 [Hiệu trưởng] ' : '⭐ [Phó HT] '}
                          {evaluator.name} — {evaluator.position}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 italic">
                      Chỉ hiển thị Hiệu trưởng và các Phó Hiệu trưởng (Không bao gồm Tổ trưởng).
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết Người đánh giá */}
              {selectedTeamLeader && selectedBghEvaluator && (
                <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 border-b border-purple-200 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span>Người đánh giá (Bước 1 & Bước 2):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">1. Tổ trưởng đánh giá:</div>
                      <div className="font-black text-slate-900">{selectedTeamLeader.name} – {selectedTeamLeader.position}</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200">
                      <div className="text-[10px] font-bold text-purple-700 uppercase">2. BGH phê duyệt:</div>
                      <div className="font-black text-slate-900">{selectedBghEvaluator.name} – {selectedBghEvaluator.position}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* CẢNH BÁO TRÙNG LẶP PHIẾU ĐÁNH GIÁ (Requirement 9) */}
              {isDuplicateStaffInSelectedPeriod && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 flex items-center gap-2.5 font-bold text-xs animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Nhân viên này đã có phiếu KPI trong tháng được chọn.</span>
                </div>
              )}

              {/* TỰ ĐỘNG NHẬN DIỆN NHÂN VIÊN (Requirement IV) */}
              {candidateStaffMember && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    HỒ SƠ TỰ ĐỘNG NHẬN DIỆN (KHÔNG NHẬP LẠI THỦ CÔNG)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold">Họ và tên:</span>{' '}
                      <strong className="text-slate-900">{candidateStaffMember.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Mã nhân viên:</span>{' '}
                      <strong className="text-slate-900 font-mono">{candidateStaffMember.code}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Vị trí việc làm:</span>{' '}
                      <strong className="text-purple-700">{modalSelectedPositionDef.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Bộ phận/Tổ:</span>{' '}
                      <strong className="text-slate-900">{candidateStaffDeptName}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-semibold">Người đánh giá:</span>{' '}
                      <strong className="text-slate-800">
                        {selectedTeamLeader?.name} (Tổ trưởng) & {selectedBghEvaluator?.name} (BGH)
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* HIỂN THỊ XÁC NHẬN TRƯỚC KHI TẠO PHIẾU (Requirement V) */}
              {candidateStaffMember && (
                <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>THÔNG TIN PHIẾU SẮP TẠO</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-1">
                      <span className="text-slate-600 font-semibold">Họ và tên:</span>
                      <strong className="text-slate-900 text-sm">{candidateStaffMember.name}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-purple-200/60 py-1">
                      <span className="text-slate-600 font-semibold">Vị trí:</span>
                      <strong className="text-purple-800">{modalSelectedPositionDef.name}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-purple-200/60 py-1">
                      <span className="text-slate-600 font-semibold">Bộ phận:</span>
                      <strong className="text-slate-900">{candidateStaffDeptName}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-purple-200/60 py-1">
                      <span className="text-slate-600 font-semibold">Kỳ đánh giá:</span>
                      <strong className="text-slate-900">{modalPeriodLabel}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-600 font-semibold">Người đánh giá:</span>
                      <strong className="text-purple-900 font-bold">
                        {selectedTeamLeader?.name} & {selectedBghEvaluator?.name}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-purple-200">
                    <div className="text-[11px] font-bold text-purple-900 uppercase mb-1">Bộ KPI sẽ áp dụng:</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/80 p-2 rounded-xl border border-purple-200">
                        <div className="text-[10px] text-slate-500 font-bold">KPI chung</div>
                        <div className="text-sm font-black text-blue-900">30 điểm</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-purple-200">
                        <div className="text-[10px] text-slate-500 font-bold">KPI {modalSelectedPositionDef.name}</div>
                        <div className="text-sm font-black text-emerald-900">70 điểm</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-purple-200">
                        <div className="text-[10px] text-slate-500 font-bold">Tổng toàn bộ</div>
                        <div className="text-sm font-black text-purple-950">100 điểm</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Requirement V: [HỦY] [TẠO PHIẾU]) */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                HỦY
              </button>

              <button
                type="button"
                onClick={handleConfirmCreateEvaluation}
                disabled={!candidateStaffMember || isDuplicateStaffInSelectedPeriod}
                className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>TẠO PHIẾU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD STAFF MODAL */}
      {isQuickAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Thêm nhân sự mới cho vị trí: {modalSelectedPositionDef.name}
              </h3>
              <button
                onClick={() => setIsQuickAddStaffOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã nhân viên (tùy chọn)</label>
                <input
                  type="text"
                  placeholder={`Ví dụ: NV${String(officeStaff.length + 1).padStart(3, '0')}`}
                  value={newStaffCode}
                  onChange={(e) => setNewStaffCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vị trí việc làm</label>
                <input
                  type="text"
                  disabled
                  value={modalSelectedPositionDef.name}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsQuickAddStaffOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleQuickAddStaffToPosition}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE EVALUATION CONFIRMATION MODAL */}
      {deletingEvalRecord && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">XÁC NHẬN XÓA PHIẾU KPI</h3>
              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn xóa phiếu KPI của:
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs">
                {deletingEvalRecord.staffName} – {deletingEvalRecord.staffCode || 'NV'}
                <div className="text-[11px] font-medium text-slate-500 mt-1">
                  Kỳ đánh giá: Tháng {deletingEvalRecord.month || modalEvalMonth || 9}/{deletingEvalRecord.year || 2026}
                </div>
              </div>
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                Thao tác này không thể hoàn tác và sẽ xóa phiếu khỏi cơ sở dữ liệu.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingEvalRecord(null)}
                disabled={isDeletingEval}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvaluation}
                disabled={isDeletingEval}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {isDeletingEval ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Xóa phiếu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CRITERION MODAL */}
      <StaffAddCriterionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        positionKey={sheetPositionKey}
        criteriaConfig={criteriaConfig}
        onConfigUpdated={(newCfg) => setCriteriaConfig(newCfg)}
        showToast={showToast}
      />

      {/* EDIT CRITERIA MODAL */}
      <StaffEditCriteriaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        positionKey={sheetPositionKey}
        criteriaConfig={criteriaConfig}
        onConfigUpdated={(newCfg) => setCriteriaConfig(newCfg)}
        showToast={showToast}
      />

      {/* 5. CẤU HÌNH XẾP LOẠI MODAL (Requirement 1) */}
      <StaffRankingConfigModal
        isOpen={isRankingConfigOpen}
        onClose={() => setIsRankingConfigOpen(false)}
        currentTiers={rankingTiers}
        onTiersUpdated={(newTiers) => {
          setRankingTiers(newTiers);
          showToast('Đã cập nhật cấu hình xếp loại KPI thành công!', 'success');
        }}
      />



      {/* 7. XÓA TOÀN BỘ MODAL (Requirement 5) */}
      <StaffClearEvaluationsModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        officeEvaluations={officeEvaluations}
        onEvaluationsCleared={handleEvaluationsCleared}
        currentMonth={modalEvalMonth}
        currentYear={modalEvalYear}
        schoolYear={schoolYear}
      />

      {/* 8. IN DANH SÁCH MODAL (Requirement 3) */}
      <StaffPrintListModal
        isOpen={isPrintListOpen}
        onClose={() => setIsPrintListOpen(false)}
        evaluations={filteredOfficeEvaluations}
        monthFilter={monthFilter}
        schoolYear={schoolYear}
        rankingTiers={rankingTiers}
      />

      {/* 9. XUẤT PHIẾU KPI NHÂN VIÊN (TẤT CẢ VỊ TRÍ) */}
      <StaffExportKpiFormsModal
        isOpen={isExportFormsModalOpen}
        onClose={() => setIsExportFormsModalOpen(false)}
        staffList={staffList}
        evaluationsList={evaluationsList}
        schoolYear={schoolYear}
        rankingTiers={rankingTiers}
        schoolName={schoolConfig?.fullName || 'TRƯỜNG THPT PHƯƠNG XÁ'}
        showToast={showToast}
      />

      {/* 10. UNSAVED CHANGES CONFIRMATION MODAL */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">Dữ liệu chưa được lưu</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Dữ liệu chưa được lưu. Bạn có chắc chắn muốn quay lại không?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                Ở LẠI
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  setIsDirty(false);
                  setActiveViewMode('list');
                  setCurrentEvalRecord(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                QUAY LẠI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
