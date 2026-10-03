import { TeacherKpiEvaluation } from '../types';
import { TEACHER_KPI_CRITERIA, BGH_KPI_CRITERIA, getOfficialStaffCriteria } from './kpiEvaluationTemplates';

/**
 * Helper to build default evaluation data for Cán bộ quản lý (BGH, Tổ trưởng, Tổ phó)
 */
export function createDefaultCbqlEvaluation(
  staffId: string,
  staffCode: string,
  staffName: string,
  department: string,
  position: string,
  schoolYear: string
): TeacherKpiEvaluation {
  const scores: TeacherKpiEvaluation['scores'] = {};

  BGH_KPI_CRITERIA.forEach((crit) => {
    scores[crit.id] = {
      criterionId: crit.id,
      selfScore: crit.maxPoints,
      deptScore: crit.maxPoints,
      bghScore: crit.maxPoints,
      isNa: false,
      evidence: 'Hoàn thành xuất sắc nhiệm vụ quản lý, chỉ đạo chuyên môn đơn vị',
    };
  });

  const pos = position.toLowerCase();
  const isBgh = staffId.startsWith('bgh') || pos.includes('hiệu trưởng');

  const evaluatorInfo = isBgh
    ? {
        evaluatorId: 'COUNCIL_TDKT',
        evaluator_id: 'COUNCIL_TDKT',
        evaluatorType: 'COUNCIL',
        evaluator_type: 'COUNCIL',
        evaluatorName: 'Hội đồng Thi đua – Khen thưởng',
        evaluator_name: 'Hội đồng Thi đua – Khen thưởng',
        evaluatorRole: 'Hội đồng Thi đua – Khen thưởng',
        evaluator_role: 'Hội đồng Thi đua – Khen thưởng',
        evaluationLevel: 'CAP_HOI_DONG',
        evaluation_level: 'CAP_HOI_DONG',
        bghEvaluatorId: 'COUNCIL_TDKT',
        bghEvaluatorName: 'Hội đồng Thi đua – Khen thưởng',
        bghEvaluatorRole: 'Hội đồng Thi đua – Khen thưởng',
        bgh_evaluator_id: 'COUNCIL_TDKT',
        bgh_evaluator_name: 'Hội đồng Thi đua – Khen thưởng',
        bgh_evaluator_role: 'Hội đồng Thi đua – Khen thưởng',
      }
    : {
        evaluatorId: 'bgh-01',
        evaluator_id: 'bgh-01',
        evaluatorType: 'BGH',
        evaluator_type: 'BGH',
        evaluatorName: 'Thầy Lê Quốc Tuấn',
        evaluator_name: 'Thầy Lê Quốc Tuấn',
        evaluatorRole: 'Hiệu trưởng',
        evaluator_role: 'Hiệu trưởng',
        evaluationLevel: 'CAP_BGH',
        evaluation_level: 'CAP_BGH',
        bghEvaluatorId: 'bgh-01',
        bghEvaluatorName: 'Thầy Lê Quốc Tuấn',
        bghEvaluatorRole: 'Hiệu trưởng',
        bgh_evaluator_id: 'bgh-01',
        bgh_evaluator_name: 'Thầy Lê Quốc Tuấn',
        bgh_evaluator_role: 'Hiệu trưởng',
      };

  return {
    id: `eval-${staffId}-${schoolYear.replace(/\s+/g, '')}`,
    staffId,
    staffCode,
    staffName,
    department,
    position,
    targetType: 'bgh',
    schoolYear,
    semester: 1,
    month: 9,
    year: 2026,
    evaluationPeriod: 'ki1',
    periodName: 'Kì I',
    ...evaluatorInfo,
    scores,
    selfTotalScore: 100,
    deptTotalScore: 100,
    bghTotalScore: 100,
    selfRank: 'Hoàn thành xuất sắc',
    deptRank: 'Hoàn thành xuất sắc',
    bghRank: 'Hoàn thành xuất sắc',
    status: 'bgh_approved',
    selfDate: '2026-09-20',
    deptDate: '2026-09-22',
    bghDate: '2026-09-23',
    updatedAt: new Date().toISOString(),
  };
}


/**
 * Helper to build default evaluation data for a teacher with near-perfect scores
 */
export function createDefaultTeacherEvaluation(
  staffId: string,
  staffCode: string,
  staffName: string,
  department: string,
  position: string,
  subject: string,
  schoolYear: string,
  isHomeroom: boolean = true
): TeacherKpiEvaluation {
  const scores: TeacherKpiEvaluation['scores'] = {};

  TEACHER_KPI_CRITERIA.forEach((crit) => {
    if (crit.id === 'III.2.10' && !isHomeroom) {
      scores[crit.id] = {
        criterionId: crit.id,
        selfScore: 0,
        deptScore: 0,
        bghScore: 0,
        isNa: true,
        evidence: 'Không được phân công chủ nhiệm năm học này',
      };
    } else {
      scores[crit.id] = {
        criterionId: crit.id,
        selfScore: crit.maxPoints,
        deptScore: crit.maxPoints,
        bghScore: crit.maxPoints,
        isNa: false,
        evidence: 'Thực hiện đầy đủ, hồ sơ minh chứng cập nhật trên phần mềm quản lý',
      };
    }
  });

  return {
    id: `eval-${staffId}-${schoolYear.replace(/\s+/g, '')}`,
    staffId,
    staffCode,
    staffName,
    department,
    position,
    subject,
    targetType: 'giaovien',
    schoolYear,
    semester: 1,
    month: 9,
    year: 2026,
    evaluationPeriod: 'ki1',
    periodName: 'Kì I',
    scores,
    selfTotalScore: 100,
    deptTotalScore: 100,
    bghTotalScore: 100,
    selfRank: 'Hoàn thành xuất sắc',
    deptRank: 'Hoàn thành xuất sắc',
    bghRank: 'Hoàn thành xuất sắc',
    status: 'bgh_approved',
    selfDate: '2026-09-20',
    deptDate: '2026-09-22',
    bghDate: '2026-09-23',
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultStaffEvaluation(
  staffId: string,
  staffCode: string,
  staffName: string,
  department: string,
  position: string,
  schoolYear: string
): TeacherKpiEvaluation {
  const scores: TeacherKpiEvaluation['scores'] = {};
  const { allCriteria } = getOfficialStaffCriteria(position);

  allCriteria.forEach((crit) => {
    scores[crit.id] = {
      criterionId: crit.id,
      selfScore: crit.maxPoints,
      deptScore: crit.maxPoints,
      bghScore: crit.maxPoints,
      isNa: false,
      evidence: 'Hồ sơ chứng từ lưu trữ đầy đủ, hoàn thành đúng tiến độ',
    };
  });

  return {
    id: `eval-${staffId}-${schoolYear.replace(/\s+/g, '')}`,
    evaluation_id: `eval-${staffId}-${schoolYear.replace(/\s+/g, '')}`,
    staffId,
    employee_id: staffId,
    staffCode,
    staffName,
    full_name: staffName,
    department,
    department_id: 'to-van-phong',
    position,
    job_position_name: position,
    targetType: 'nhanvien',
    schoolYear,
    semester: 1,
    month: 9,
    year: 2026,
    evaluationPeriod: 'thang',
    periodName: 'Tháng 09/2026',
    scores,
    selfTotalScore: 100,
    deptTotalScore: 100,
    bghTotalScore: 100,
    personal_score: 100,
    bgh_score: 100,
    bgh_total_score: 100,
    selfRank: 'Hoàn thành xuất sắc nhiệm vụ',
    deptRank: 'Hoàn thành xuất sắc nhiệm vụ',
    bghRank: 'Hoàn thành xuất sắc nhiệm vụ',
    evaluatorId: 'bgh-01',
    evaluatorName: 'Thầy Lê Quốc Tuấn – Hiệu trưởng',
    bghEvaluatorId: 'bgh-01',
    bghEvaluatorName: 'Thầy Lê Quốc Tuấn',
    bghEvaluatorRole: 'Hiệu trưởng',
    bgh_evaluator_id: 'bgh-01',
    bgh_evaluator_name: 'Thầy Lê Quốc Tuấn',
    bgh_comment: 'Đồng chí hoàn thành xuất sắc các nhiệm vụ được giao.',
    status: 'bgh_approved',
    selfDate: '2026-09-20',
    deptDate: '2026-09-22',
    bghDate: '2026-09-23',
    bgh_evaluated_at: '2026-09-23T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };
}

export const INITIAL_EVALUATIONS: TeacherKpiEvaluation[] = [
  // Ban Giám hiệu
  createDefaultCbqlEvaluation(
    'bgh-01',
    'BGH001',
    'Thầy Lê Quốc Tuấn',
    'Ban Giám hiệu',
    'Hiệu trưởng',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'bgh-02',
    'BGH002',
    'Cô Đặng Thu Hằng',
    'Ban Giám hiệu',
    'Phó Hiệu trưởng (Chuyên môn)',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'bgh-03',
    'BGH003',
    'Thầy Nguyễn Văn Long',
    'Ban Giám hiệu',
    'Phó Hiệu trưởng (Cơ sở vật chất - Nề nếp)',
    '2026 - 2027'
  ),

  // Tổ trưởng & Tổ phó chuyên môn (Cán bộ Quản lý)
  createDefaultCbqlEvaluation(
    'gv-01',
    'GV001',
    'Nguyễn Văn A',
    'Tổ Toán - Lí - Tin',
    'Tổ trưởng Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-02',
    'GV002',
    'Trần Thị B',
    'Tổ Văn - Ngoại ngữ',
    'Tổ trưởng Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-03',
    'GV003',
    'Lê Văn C',
    'Tổ Văn - Ngoại ngữ',
    'Tổ phó Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-04',
    'GV004',
    'Phạm Thị D',
    'Tổ Toán - Lí - Tin',
    'Tổ phó Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-05',
    'GV005',
    'Hoàng Văn E',
    'Tổ Hóa - Sinh - CN',
    'Tổ trưởng Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-08',
    'GV008',
    'Bùi Ngọc Lan',
    'Tổ Sử - Địa - KT&PL - TD - QPAN',
    'Tổ trưởng Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-10',
    'GV010',
    'Phạm Hoài Phương',
    'Tổ Sử - Địa - KT&PL - TD - QPAN',
    'Tổ phó Chuyên môn',
    '2026 - 2027'
  ),
  createDefaultCbqlEvaluation(
    'gv-11',
    'GV011',
    'Nguyễn Thị Hải Yến',
    'Tổ Hóa - Sinh - CN',
    'Tổ phó Chuyên môn',
    '2026 - 2027'
  ),

  // Nhân viên Văn phòng (Đầy đủ 12 nhân viên và 8 vị trí việc làm chuẩn hóa)
  createDefaultStaffEvaluation(
    'nv-01',
    'NV001',
    'Trần Thị Lan',
    'Tổ Văn phòng',
    'Kế toán trưởng',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-02',
    'NV002',
    'Nguyễn Văn Tuấn',
    'Tổ Văn phòng',
    'Nhân viên Kế toán',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-03',
    'NV003',
    'Hoàng Thị Mai',
    'Tổ Văn phòng',
    'Thủ quỹ',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-04',
    'NV004',
    'Phạm Thu Hương',
    'Tổ Văn phòng',
    'Nhân viên Văn thư - Lưu trữ',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-05',
    'NV005',
    'Vũ Thị Hồng',
    'Tổ Văn phòng',
    'Nhân viên Văn thư',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-06',
    'NV006',
    'Nguyễn Hải Đăng',
    'Tổ Văn phòng',
    'Nhân viên Y tế học đường',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-07',
    'NV007',
    'Đỗ Văn Hùng',
    'Tổ Văn phòng',
    'Nhân viên Bảo vệ trường',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-08',
    'NV008',
    'Trần Văn Cường',
    'Tổ Văn phòng',
    'Nhân viên Bảo vệ',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-09',
    'NV009',
    'Nguyễn Thị Thơm',
    'Tổ Văn phòng',
    'Nhân viên Phục vụ/Vệ sinh',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-10',
    'NV010',
    'Lê Thị Tuyết',
    'Tổ Văn phòng',
    'Nhân viên Thư viện',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-11',
    'NV011',
    'Ngô Văn Minh',
    'Tổ Văn phòng',
    'Nhân viên Thiết bị',
    '2026 - 2027'
  ),
  createDefaultStaffEvaluation(
    'nv-12',
    'NV012',
    'Đặng Hồng Phong',
    'Tổ Văn phòng',
    'Nhân viên Thiết bị',
    '2026 - 2027'
  ),
];

