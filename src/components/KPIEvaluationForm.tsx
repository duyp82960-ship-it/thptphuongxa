import React, { useState, useEffect, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  TeacherKpiEvaluation,
  CriterionScoreItem,
  StaffMember,
} from '../types';
import {
  KpiCriterionItem,
  TEACHER_KPI_CRITERIA,
  STAFF_KPI_CRITERIA,
  BGH_KPI_CRITERIA,
  computeTotalKpiScore,
} from '../data/kpiEvaluationTemplates';
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  RotateCcw,
  Save,
  CheckCheck,
  AlertCircle,
  Copy,
  FileCheck2,
  User,
  Building2,
  Calendar,
} from 'lucide-react';

export interface KPIEvaluationFormProps {
  evaluationId: string;
  employeeId: string;
  evaluatorId: string;
  level: 'self' | 'ttcm' | 'bgh';
  onClose: () => void;
  onSaved: () => void;
}

export const KPIEvaluationForm: React.FC<KPIEvaluationFormProps> = ({
  evaluationId,
  employeeId,
  evaluatorId,
  level,
  onClose,
  onSaved,
}) => {
  const {
    staffList,
    schoolYear,
    currentUser,
    evaluationsList,
    saveEvaluation,
    getCriteriaListForTarget,
    showToast,
  } = useKpi();

  // Find Target Employee
  const employee = useMemo(() => {
    return (
      staffList.find((s) => s.id === employeeId || s.code === employeeId) || {
        id: employeeId || 'gv-07',
        code: 'GV007',
        name: 'Đỗ Phương Tuấn',
        department: 'Tổ Hóa - Sinh - CN',
        position: 'Giáo viên Giảng dạy',
        type: 'giaovien' as const,
        status: 'Đang công tác',
        baseScore: 100,
      }
    );
  }, [staffList, employeeId]);

  // Evaluator info
  const evaluatorStaff = useMemo(() => {
    return staffList.find((s) => s.id === evaluatorId || s.code === evaluatorId) || currentUser;
  }, [staffList, evaluatorId, currentUser]);

  const targetType = (employee as StaffMember).type || 'giaovien';

  // Load Criteria with reliable Fallback
  const criteriaList: KpiCriterionItem[] = useMemo(() => {
    let list: KpiCriterionItem[] = [];
    try {
      list = getCriteriaListForTarget(targetType, (employee as StaffMember).position);
    } catch {
      list = [];
    }
    if (list && list.length > 0) return list;

    if (targetType === 'nhanvien' || (employee as StaffMember).department === 'Tổ Văn phòng') {
      return STAFF_KPI_CRITERIA;
    }
    if (targetType === 'bgh') {
      return BGH_KPI_CRITERIA;
    }
    if (TEACHER_KPI_CRITERIA && TEACHER_KPI_CRITERIA.length > 0) {
      return TEACHER_KPI_CRITERIA;
    }

    // Direct test fallback
    return [
      {
        id: 'test-1',
        section: 'I',
        order: 1,
        content: 'Tiêu chí kiểm tra 1: Thực hiện quy chế chuyên môn và nền nếp giảng dạy',
        maxPoints: 10,
        groupTitle: 'Nhóm tiêu chí I',
      },
      {
        id: 'test-2',
        section: 'II',
        order: 2,
        content: 'Tiêu chí kiểm tra 2: Chất lượng giảng dạy và đổi mới phương pháp',
        maxPoints: 10,
        groupTitle: 'Nhóm tiêu chí II',
      },
      {
        id: 'test-3',
        section: 'III',
        order: 3,
        content: 'Tiêu chí kiểm tra 3: Tinh thần phối hợp và trách nhiệm công việc',
        maxPoints: 10,
        groupTitle: 'Nhóm tiêu chí III',
      },
    ];
  }, [getCriteriaListForTarget, targetType, employee]);

  // Log criteria on load (Requirement 19)
  useEffect(() => {
    console.log('KPI CRITERIA', criteriaList);
  }, [criteriaList]);

  // Find existing evaluation in state or build default
  const existingEval = useMemo(() => {
    return (
      evaluationsList.find(
        (e) =>
          e.id === evaluationId ||
          (e.staffId === employeeId && e.schoolYear === schoolYear) ||
          (e.staffCode === (employee as StaffMember).code && e.schoolYear === schoolYear)
      ) || null
    );
  }, [evaluationsList, evaluationId, employeeId, schoolYear, employee]);

  // Local state for scores
  const [scores, setScores] = useState<Record<string, CriterionScoreItem>>({});
  const [comment, setComment] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Month & Year of evaluation
  const evalMonth = existingEval?.month || 9;
  const evalYear = existingEval?.year || 2026;

  // Initialize scores from existing evaluation or zeros (Requirement 9: never fake 100)
  useEffect(() => {
    const initial: Record<string, CriterionScoreItem> = {};

    criteriaList.forEach((crit) => {
      const prev = existingEval?.scores ? existingEval.scores[crit.id] : undefined;
      const selfVal = prev?.selfScore !== undefined ? prev.selfScore : 0;
      const deptVal = prev?.deptScore !== undefined ? prev.deptScore : 0;
      const bghVal = prev?.bghScore !== undefined ? prev.bghScore : 0;

      initial[crit.id] = {
        criterionId: crit.id,
        selfScore: selfVal,
        deptScore: deptVal,
        bghScore: bghVal,
        evidence: prev?.evidence || '',
        notes: prev?.notes || '',
        isNa: prev?.isNa || false,
      };
    });

    setScores(initial);

    if (level === 'self') {
      setComment(existingEval?.personal_comment || existingEval?.selfComment || '');
    } else if (level === 'ttcm') {
      setComment(existingEval?.ttcm_comment || existingEval?.department_comment || existingEval?.deptComment || '');
    } else {
      setComment(existingEval?.bgh_comment || existingEval?.bghComment || '');
    }
  }, [existingEval, criteriaList, level]);

  // Real-time calculation of total scores
  const selfTotal = useMemo(() => {
    let sum = 0;
    criteriaList.forEach((c) => {
      const item = scores[c.id];
      if (item && !item.isNa && typeof item.selfScore === 'number') {
        sum += item.selfScore;
      }
    });
    return Math.round(sum * 10) / 10;
  }, [criteriaList, scores]);

  const deptTotal = useMemo(() => {
    let sum = 0;
    criteriaList.forEach((c) => {
      const item = scores[c.id];
      if (item && !item.isNa && typeof item.deptScore === 'number') {
        sum += item.deptScore;
      }
    });
    return Math.round(sum * 10) / 10;
  }, [criteriaList, scores]);

  const bghTotal = useMemo(() => {
    let sum = 0;
    criteriaList.forEach((c) => {
      const item = scores[c.id];
      if (item && !item.isNa && typeof item.bghScore === 'number') {
        sum += item.bghScore;
      }
    });
    return Math.round(sum * 10) / 10;
  }, [criteriaList, scores]);

  // Current level score
  const currentLevelScore = level === 'self' ? selfTotal : level === 'ttcm' ? deptTotal : bghTotal;

  // Section scores calculation
  const sectionScores = useMemo(() => {
    let sI = 0, sII = 0, sIII1 = 0, sIII2 = 0;
    criteriaList.forEach((c) => {
      const item = scores[c.id];
      const val = item && !item.isNa ? (level === 'self' ? item.selfScore : level === 'ttcm' ? item.deptScore : item.bghScore) || 0 : 0;
      if (c.section === 'I') sI += val;
      else if (c.section === 'II') sII += val;
      else if (c.section === 'III.1') sIII1 += val;
      else if (c.section === 'III.2') sIII2 += val;
    });
    const sIII = sIII1 + sIII2;
    const total = sI + sII + sIII;
    return {
      I: Math.round(sI * 10) / 10,
      II: Math.round(sII * 10) / 10,
      III1: Math.round(sIII1 * 10) / 10,
      III2: Math.round(sIII2 * 10) / 10,
      III: Math.round(sIII * 10) / 10,
      total: Math.round(total * 10) / 10,
    };
  }, [criteriaList, scores, level]);

  // Handle direct score change (Requirement 7 & 19)
  const handleScoreChange = (criterionId: string, rawVal: number) => {
    const crit = criteriaList.find((c) => c.id === criterionId);
    const max = crit?.maxPoints || 10;

    // Clamp value between 0 and max
    const val = Math.max(0, Math.min(max, isNaN(rawVal) ? 0 : Math.round(rawVal * 10) / 10));

    console.log('KPI SCORE CHANGE', {
      criterionId,
      value: val,
      level,
    });

    setScores((prev) => {
      const current = prev[criterionId] || {
        criterionId,
        selfScore: 0,
        deptScore: 0,
        bghScore: 0,
      };

      const nextItem: CriterionScoreItem = {
        ...current,
        criterionId,
        isNa: false,
      };

      if (level === 'self') {
        nextItem.selfScore = val;
      } else if (level === 'ttcm') {
        nextItem.deptScore = val;
      } else {
        nextItem.bghScore = val;
      }

      return {
        ...prev,
        [criterionId]: nextItem,
      };
    });
  };

  const handleEvidenceChange = (criterionId: string, text: string) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        criterionId,
        evidence: text,
      },
    }));
  };

  // Quick Action: Fill max points for current level
  const handleFillMax = () => {
    const next: Record<string, CriterionScoreItem> = {};
    criteriaList.forEach((c) => {
      const cur = scores[c.id] || {
        criterionId: c.id,
        selfScore: 0,
        deptScore: 0,
        bghScore: 0,
      };
      next[c.id] = {
        ...cur,
        criterionId: c.id,
        selfScore: level === 'self' ? c.maxPoints : cur.selfScore,
        deptScore: level === 'ttcm' ? c.maxPoints : cur.deptScore,
        bghScore: level === 'bgh' ? c.maxPoints : cur.bghScore,
      };
    });
    setScores(next);
    showToast('Đã chấm tối đa cho tất cả tiêu chí!', 'info');
  };

  // Quick Action: Reset to zero for current level
  const handleResetZero = () => {
    const next: Record<string, CriterionScoreItem> = {};
    criteriaList.forEach((c) => {
      const cur = scores[c.id] || {
        criterionId: c.id,
        selfScore: 0,
        deptScore: 0,
        bghScore: 0,
      };
      next[c.id] = {
        ...cur,
        criterionId: c.id,
        selfScore: level === 'self' ? 0 : cur.selfScore,
        deptScore: level === 'ttcm' ? 0 : cur.deptScore,
        bghScore: level === 'bgh' ? 0 : cur.bghScore,
      };
    });
    setScores(next);
    showToast('Đã đặt lại điểm về 0!', 'info');
  };

  // Quick Action: Copy self to TTCM or TTCM to BGH
  const handleCopyPreviousLevel = () => {
    const next: Record<string, CriterionScoreItem> = {};
    criteriaList.forEach((c) => {
      const cur = scores[c.id] || {
        criterionId: c.id,
        selfScore: 0,
        deptScore: 0,
        bghScore: 0,
      };
      if (level === 'ttcm') {
        next[c.id] = {
          ...cur,
          criterionId: c.id,
          deptScore: cur.selfScore || c.maxPoints,
        };
      } else if (level === 'bgh') {
        next[c.id] = {
          ...cur,
          criterionId: c.id,
          bghScore: cur.deptScore || cur.selfScore || c.maxPoints,
        };
      }
    });
    setScores(next);
    showToast('Đã sao chép điểm từ cấp trước!', 'info');
  };

  // Save to Database / Context (Requirements 13, 14, 19)
  const handleSave = async (markComplete: boolean = true) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const evalDate = now.split('T')[0];

      // Formulate Payload
      const updatedSelfTotal = selfTotal;
      const updatedDeptTotal = level === 'ttcm' ? deptTotal : (existingEval?.ttcm_score ?? deptTotal);
      const updatedBghTotal = level === 'bgh' ? bghTotal : (existingEval?.bgh_score ?? bghTotal);

      const personalStatus =
        level === 'self'
          ? markComplete
            ? 'completed'
            : 'in_progress'
          : existingEval?.personal_status || (selfTotal > 0 ? 'completed' : 'not_started');

      const ttcmStatus =
        level === 'ttcm'
          ? markComplete
            ? 'completed'
            : 'in_progress'
          : existingEval?.ttcm_status || (deptTotal > 0 ? 'completed' : 'pending');

      const bghStatus =
        level === 'bgh'
          ? markComplete
            ? 'completed'
            : 'in_progress'
          : existingEval?.bgh_status || (bghTotal > 0 ? 'completed' : 'pending');

      const overallStatus =
        bghStatus === 'completed'
          ? 'bgh_approved'
          : ttcmStatus === 'completed'
          ? 'dept_reviewed'
          : personalStatus === 'completed'
          ? 'self_submitted'
          : 'draft';

      const payload: TeacherKpiEvaluation = {
        id: evaluationId,
        staffId: (employee as StaffMember).id,
        staffCode: (employee as StaffMember).code || '',
        staffName: (employee as StaffMember).name || '',
        department: (employee as StaffMember).department || 'Tổ Hóa - Sinh - CN',
        position: (employee as StaffMember).position || 'Giáo viên Giảng dạy',
        subject: (employee as StaffMember).subject || 'Hóa học',
        targetType: targetType,
        schoolYear: schoolYear,
        month: evalMonth,
        year: evalYear,
        semester: 1,
        evaluationPeriod: 'thang',
        periodName: `Tháng ${String(evalMonth).padStart(2, '0')}/${evalYear}`,

        // Level 1: Self
        personal_score: updatedSelfTotal,
        personal_comment: level === 'self' ? comment : existingEval?.personal_comment || '',
        personal_evaluator_id: (employee as StaffMember).id,
        personal_evaluator_name: (employee as StaffMember).name,
        personal_evaluated_at: level === 'self' ? evalDate : existingEval?.personal_evaluated_at || evalDate,
        personal_status: personalStatus,
        selfTotalScore: updatedSelfTotal,
        selfComment: level === 'self' ? comment : existingEval?.selfComment || '',
        selfDate: level === 'self' ? evalDate : existingEval?.selfDate || evalDate,

        // Level 2: TTCM
        ttcm_score: updatedDeptTotal,
        ttcm_comment: level === 'ttcm' ? comment : existingEval?.ttcm_comment || '',
        ttcm_evaluator_id: level === 'ttcm' ? evaluatorId : existingEval?.ttcm_evaluator_id || evaluatorId,
        ttcm_evaluator_name: level === 'ttcm' ? evaluatorStaff?.name || 'Tổ trưởng Chuyên môn' : existingEval?.ttcm_evaluator_name,
        ttcm_evaluated_at: level === 'ttcm' ? evalDate : existingEval?.ttcm_evaluated_at || '',
        ttcm_status: ttcmStatus,
        department_score: updatedDeptTotal,
        department_comment: level === 'ttcm' ? comment : existingEval?.department_comment || '',
        department_evaluator_id: level === 'ttcm' ? evaluatorId : existingEval?.department_evaluator_id || evaluatorId,
        deptTotalScore: updatedDeptTotal,
        deptComment: level === 'ttcm' ? comment : existingEval?.deptComment || '',
        deptDate: level === 'ttcm' ? evalDate : existingEval?.deptDate || '',

        // Level 3: BGH
        bgh_score: updatedBghTotal,
        bgh_comment: level === 'bgh' ? comment : existingEval?.bgh_comment || '',
        bgh_evaluator_id: level === 'bgh' ? evaluatorId : existingEval?.bgh_evaluator_id || evaluatorId,
        bgh_evaluator_name: level === 'bgh' ? evaluatorStaff?.name || 'Ban Giám hiệu' : existingEval?.bgh_evaluator_name,
        bgh_evaluated_at: level === 'bgh' ? evalDate : existingEval?.bgh_evaluated_at || '',
        bgh_status: bghStatus,
        bghTotalScore: updatedBghTotal,
        bghComment: level === 'bgh' ? comment : existingEval?.bghComment || '',
        bghDate: level === 'bgh' ? evalDate : existingEval?.bghDate || '',

        selfRank: 'Hoàn thành xuất sắc',
        deptRank: 'Hoàn thành xuất sắc',
        bghRank: 'Hoàn thành xuất sắc',

        scores: scores,
        status: overallStatus,
        updatedAt: now,
      };

      console.log('KPI SAVE', payload);

      await saveEvaluation(payload);

      showToast(
        `Đã lưu thành công điểm KPI cấp ${
          level === 'self' ? 'Cá nhân tự chấm' : level === 'ttcm' ? 'Tổ chuyên môn' : 'Ban Giám hiệu'
        } (${currentLevelScore}/100đ)!`,
        'success'
      );

      onSaved();
    } catch (err) {
      console.error('Lỗi khi lưu điểm KPI:', err);
      showToast(`Lỗi khi lưu điểm KPI: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Requirement 5: Clear error guard checks
  if (!evaluationId) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-rose-900">Lỗi: Phiếu KPI chưa có mã evaluationId.</h3>
          <p className="text-xs text-slate-600">Vui lòng kiểm tra lại liên kết hoặc tạo phiếu mới.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-rose-900">Lỗi: Phiếu KPI chưa có mã nhân viên.</h3>
          <p className="text-xs text-slate-600">Không tìm thấy mã nhân viên cần đánh giá.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    );
  }

  if (!criteriaList || criteriaList.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-rose-900">Lỗi: Chưa tải được danh mục tiêu chí KPI.</h3>
          <p className="text-xs text-slate-600">Hệ thống chưa tải được danh mục tiêu chí cho đối tượng này.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    );
  }

  const levelTitle =
    level === 'self'
      ? 'CÁ NHÂN TỰ ĐÁNH GIÁ'
      : level === 'ttcm'
      ? 'TỔ TRƯỞNG / TTCM ĐÁNH GIÁ'
      : 'BAN GIÁM HIỆU ĐÁNH GIÁ & DUYỆT';

  const levelBadgeBg =
    level === 'self'
      ? 'bg-blue-600 text-white'
      : level === 'ttcm'
      ? 'bg-indigo-600 text-white'
      : 'bg-purple-600 text-white';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* ========================================================
            HEADER BANNER (Requirement 6)
           ======================================================== */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shrink-0 border-b border-blue-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${levelBadgeBg}`}>
                  {levelTitle}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Mã phiếu: {evaluationId}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ĐÁNH GIÁ KPI – {levelTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-bold text-blue-200">Tổng điểm cấp này:</div>
                <div className="text-2xl font-black text-amber-300">
                  {currentLevelScore}/100đ
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Đóng form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Target Employee Info Grid (Requirement 6) */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-blue-300 text-[10px] font-bold uppercase block">Họ và tên:</span>
              <span className="font-extrabold text-white text-sm">{(employee as StaffMember).name}</span>
            </div>
            <div>
              <span className="text-blue-300 text-[10px] font-bold uppercase block">Mã nhân sự & Chức vụ:</span>
              <span className="font-bold text-white">{(employee as StaffMember).code} • {(employee as StaffMember).position}</span>
            </div>
            <div>
              <span className="text-blue-300 text-[10px] font-bold uppercase block">Tổ / Bộ phận:</span>
              <span className="font-bold text-white">{(employee as StaffMember).department}</span>
            </div>
            <div>
              <span className="text-blue-300 text-[10px] font-bold uppercase block">Kỳ & Năm học:</span>
              <span className="font-bold text-white">Tháng {String(evalMonth).padStart(2, '0')}/{evalYear} • {schoolYear}</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            ACTION TOOLBAR (Quick actions & Total Score Display)
           ======================================================== */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Thao tác nhanh:</span>
            <button
              onClick={handleFillMax}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chấm tối đa (100đ)</span>
            </button>
            <button
              onClick={handleResetZero}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Đặt về 0</span>
            </button>
            {level !== 'self' && (
              <button
                onClick={handleCopyPreviousLevel}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Lấy điểm cấp trước</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-600">
              Điểm hiện tại: <strong className="text-blue-900 font-black text-sm">{currentLevelScore}/100đ</strong>
            </div>
          </div>
        </div>

        {/* ========================================================
            MAIN BODY: DANH SÁCH TIÊU CHÍ KPI (Requirement 6 & 7)
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* BẢNG TỔNG KẾT ĐIỂM CÁC MỤC (DỄ QUAN SÁT) */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-4 rounded-2xl shadow-md border border-blue-800">
            <div className="text-xs font-black uppercase tracking-wider text-amber-300 mb-2.5 flex items-center gap-1.5">
              <span>📊 Bảng tổng hợp điểm các mục KPI hiện tại:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-center">
                <div className="text-[10px] text-blue-200 uppercase font-bold">I. Chính trị tư tưởng</div>
                <div className="text-base font-black text-amber-300 mt-0.5">{sectionScores.I} / 15đ</div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-center">
                <div className="text-[10px] text-blue-200 uppercase font-bold">II. Tác phong, lề lối</div>
                <div className="text-base font-black text-amber-300 mt-0.5">{sectionScores.II} / 15đ</div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-center">
                <div className="text-[10px] text-indigo-200 uppercase font-bold">III.1. Năng lực & kỹ năng</div>
                <div className="text-base font-black text-indigo-300 mt-0.5">{sectionScores.III1} / 10đ</div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-center">
                <div className="text-[10px] text-indigo-200 uppercase font-bold">III.2. Kết quả thực hiện NV</div>
                <div className="text-base font-black text-indigo-300 mt-0.5">{sectionScores.III2} / 60đ</div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-center">
                <div className="text-[10px] text-teal-200 uppercase font-bold">III. Tổng kết quả (III)</div>
                <div className="text-base font-black text-teal-300 mt-0.5">{sectionScores.III} / 70đ</div>
              </div>
              <div className="bg-blue-600 p-2.5 rounded-xl border-2 border-amber-400 text-center shadow-md">
                <div className="text-[10px] text-white uppercase font-black">TỔNG TOÀN PHIẾU</div>
                <div className="text-lg font-black text-amber-300 mt-0.5">{sectionScores.total} / 100đ</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase text-[11px] sticky top-0 z-10">
                  <th className="py-3 px-3 w-12 text-center border-r border-slate-800">STT</th>
                  <th className="py-3 px-3 min-w-[280px] border-r border-slate-800">NỘI DUNG TIÊU CHÍ KPI</th>
                  <th className="py-3 px-2 w-24 text-center border-r border-slate-800">ĐIỂM TỐI ĐA</th>
                  {level !== 'self' && (
                    <th className="py-3 px-2 w-24 text-center border-r border-slate-800 bg-slate-800 text-blue-200">
                      TỰ CHẤM
                    </th>
                  )}
                  {level === 'bgh' && (
                    <th className="py-3 px-2 w-24 text-center border-r border-slate-800 bg-slate-800 text-indigo-200">
                      TTCM CHẤM
                    </th>
                  )}
                  <th className="py-3 px-3 w-36 text-center bg-blue-900 text-white border-r border-blue-800">
                    <div>ĐIỂM ĐÁNH GIÁ</div>
                    <div className="text-[10px] text-blue-200 normal-case font-semibold">(Nhập trực tiếp)</div>
                  </th>
                  <th className="py-3 px-3 min-w-[220px]">MINH CHỨNG / NHẬN XÉT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {criteriaList.map((crit, idx) => {
                  const item = scores[crit.id] || {
                    criterionId: crit.id,
                    selfScore: 0,
                    deptScore: 0,
                    bghScore: 0,
                    evidence: '',
                  };

                  const prevCrit = idx > 0 ? criteriaList[idx - 1] : null;
                  const isNewSection = !prevCrit || prevCrit.section !== crit.section;

                  const currentScoreVal =
                    level === 'self' ? item.selfScore : level === 'ttcm' ? item.deptScore : item.bghScore;

                  const totalCols = level === 'bgh' ? 7 : level === 'ttcm' ? 6 : 5;

                  return (
                    <React.Fragment key={crit.id}>
                      {isNewSection && (
                        <React.Fragment>
                          {crit.section === 'III.1' && (
                            <tr className="bg-indigo-100/90 border-y border-indigo-300 font-black text-indigo-950 text-xs uppercase tracking-wide">
                              <td colSpan={totalCols - 1} className="py-3 px-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                  <span>III. KẾT QUẢ THỰC HIỆN NHIỆM VỤ</span>
                                  <span className="font-normal normal-case text-indigo-900 text-xs">
                                    Điểm tối đa: 70 | Tổng điểm đã chấm: <strong className="font-black text-indigo-950">{sectionScores.III}/70</strong>
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-black text-indigo-950 text-sm bg-indigo-200/90 border-l border-indigo-300 whitespace-nowrap">
                                {sectionScores.III} / 70 đ
                              </td>
                            </tr>
                          )}
                          <tr className="bg-blue-100/90 border-y border-blue-300 font-black text-blue-950 text-xs uppercase tracking-wide">
                            <td colSpan={totalCols - 1} className="py-2.5 px-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <span>
                                  {crit.section === 'I' && 'I. CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG'}
                                  {crit.section === 'II' && 'II. TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT'}
                                  {crit.section === 'III.1' && 'III.1. NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC'}
                                  {crit.section === 'III.2' && 'III.2. KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO'}
                                  {!['I', 'II', 'III.1', 'III.2'].includes(crit.section) && `${crit.section}. ${crit.sectionTitle || crit.groupTitle || ''}`}
                                </span>
                                <span className="font-normal normal-case text-blue-900 text-xs">
                                  {crit.section === 'I' && <>Điểm tối đa: 15 | Tổng điểm đã chấm: <strong className="font-black text-blue-950">{sectionScores.I}/15</strong></>}
                                  {crit.section === 'II' && <>Điểm tối đa: 15 | Tổng điểm đã chấm: <strong className="font-black text-blue-950">{sectionScores.II}/15</strong></>}
                                  {crit.section === 'III.1' && <>Điểm tối đa: 10 | Tổng điểm: <strong className="font-black text-blue-950">{sectionScores.III1}/10</strong></>}
                                  {crit.section === 'III.2' && <>Điểm tối đa: 60 | Tổng điểm: <strong className="font-black text-blue-950">{sectionScores.III2}/60</strong></>}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-blue-950 text-xs bg-blue-200/90 border-l border-blue-300 whitespace-nowrap">
                              {crit.section === 'I' && `${sectionScores.I} / 15 đ`}
                              {crit.section === 'II' && `${sectionScores.II} / 15 đ`}
                              {crit.section === 'III.1' && `${sectionScores.III1} / 10 đ`}
                              {crit.section === 'III.2' && `${sectionScores.III2} / 60 đ`}
                            </td>
                          </tr>
                        </React.Fragment>
                      )}
                      <tr className="hover:bg-blue-50/30 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900 leading-snug">
                            {crit.content}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mã: {crit.id}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-black text-slate-700 bg-slate-50 border-r border-slate-200 text-xs">
                          {crit.maxPoints}đ
                        </td>

                        {/* Tự chấm (if viewing TTCM or BGH) */}
                        {level !== 'self' && (
                          <td className="py-2.5 px-2 text-center font-black text-blue-900 bg-blue-50/40 border-r border-slate-200">
                            {item.selfScore}đ
                          </td>
                        )}

                        {/* TTCM chấm (if viewing BGH) */}
                        {level === 'bgh' && (
                          <td className="py-2.5 px-2 text-center font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                            {item.deptScore}đ
                          </td>
                        )}

                        {/* Ô NHẬP ĐIỂM TRỰC TIẾP (Requirement 6, 7, 8) */}
                        <td className="py-2 px-3 text-center bg-blue-50/50 border-r border-slate-200">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={crit.maxPoints}
                              step="0.5"
                              disabled={false}
                              readOnly={false}
                              value={currentScoreVal !== undefined ? currentScoreVal : ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const num = raw === '' ? 0 : parseFloat(raw);
                                handleScoreChange(crit.id, isNaN(num) ? 0 : num);
                              }}
                              placeholder="0"
                              className="w-20 py-1.5 px-2 text-center font-black text-sm rounded-lg border-2 border-blue-400 bg-white text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-xs cursor-text"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">/{crit.maxPoints}</span>
                          </div>
                        </td>

                        {/* Minh chứng / Ghi chú */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.evidence || ''}
                            onChange={(e) => handleEvidenceChange(crit.id, e.target.value)}
                            placeholder="Nhập minh chứng, số hiệu văn bản, giải trình..."
                            className="w-full py-1.5 px-2.5 text-xs rounded-lg font-medium border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* HÀNG TỔNG ĐIỂM (Requirement 9: Live calculation) */}
                <tr className="bg-slate-900 text-white font-black text-xs">
                  <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-right border-r border-slate-800">
                    TỔNG ĐIỂM KPI:
                  </td>
                  <td className="py-3 px-2 text-center text-amber-300 border-r border-slate-800 font-black">
                    100đ
                  </td>
                  {level !== 'self' && (
                    <td className="py-3 px-2 text-center text-blue-200 border-r border-slate-800 font-black">
                      {selfTotal}đ
                    </td>
                  )}
                  {level === 'bgh' && (
                    <td className="py-3 px-2 text-center text-indigo-200 border-r border-slate-800 font-black">
                      {deptTotal}đ
                    </td>
                  )}
                  <td className="py-3 px-3 text-center bg-blue-800 text-amber-300 border-r border-blue-700 text-sm font-black">
                    TỔNG ĐIỂM KPI: {sectionScores.total}/100 ĐIỂM
                  </td>
                  <td className="py-3 px-3 text-blue-200 italic font-medium">
                    {level === 'self'
                      ? 'Điểm tự đánh giá được lưu và chuyển sang Tổ chuyên môn xem xét'
                      : level === 'ttcm'
                      ? 'Điểm tổ chuyên môn được chuyển sang Ban Giám hiệu duyệt'
                      : 'Ban Giám hiệu chốt điểm và kết quả xếp loại thi đua'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ý KIẾN / NHẬN XÉT */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Ý KIẾN / NHẬN XÉT CỦA {levelTitle}:
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập nhận xét chi tiết, đánh giá ưu điểm, hạn chế và đề xuất..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ========================================================
            FOOTER ACTIONS
           ======================================================== */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>✕ ĐÓNG FORM</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-blue-900 border border-blue-300 font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-blue-600" />
              <span>💾 LƯU NHÁP</span>
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{isSaving ? 'ĐANG LƯU...' : '✅ LƯU & HOÀN TẤT ĐÁNH GIÁ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
