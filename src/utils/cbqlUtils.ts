import { StaffMember, TeacherKpiEvaluation } from '../types';

/**
 * Checks whether a staff member is a member of Ban Giám hiệu (Hiệu trưởng / Phó Hiệu trưởng)
 */
export function isBghLeader(
  staff: StaffMember | { type?: string; position?: string; concurrentPosition?: string } | null | undefined
): boolean {
  if (!staff) return false;
  if (staff.type === 'bgh') return true;

  const pos = (staff.position || '').toLowerCase();
  const concurrent = (staff.concurrentPosition || '').toLowerCase();

  return (
    pos.includes('hiệu trưởng') ||
    pos.includes('phó hiệu trưởng') ||
    concurrent.includes('hiệu trưởng') ||
    concurrent.includes('phó hiệu trưởng')
  );
}

/**
 * Checks whether a staff member is Tổ trưởng chuyên môn (TTCM) or Tổ phó chuyên môn (TPCM)
 */
export function isTtcmOrTpcm(
  staff: StaffMember | { type?: string; position?: string; concurrentPosition?: string } | null | undefined
): boolean {
  if (!staff) return false;
  // If is primary BGH, not TTCM/TPCM
  if (staff.type === 'bgh' && !staff.position?.toLowerCase().includes('tổ trưởng') && !staff.position?.toLowerCase().includes('tổ phó')) {
    return false;
  }

  const pos = (staff.position || '').toLowerCase();
  const concurrent = (staff.concurrentPosition || '').toLowerCase();

  const isLeader =
    pos.includes('tổ trưởng') ||
    pos.includes('tổ phó') ||
    pos.includes('ttcm') ||
    pos.includes('tpcm') ||
    concurrent.includes('tổ trưởng') ||
    concurrent.includes('tổ phó') ||
    concurrent.includes('ttcm') ||
    concurrent.includes('tpcm');

  const isPrincipal = pos.includes('hiệu trưởng') && !pos.includes('phó hiệu trưởng') && !pos.includes('tổ');
  return isLeader && !isPrincipal;
}

/**
 * Checks whether a staff member belongs to Cán bộ Quản lý (CBQL):
 * - Ban Giám hiệu (Hiệu trưởng, Phó Hiệu trưởng)
 * - Tổ trưởng chuyên môn (TTCM)
 * - Tổ phó chuyên môn (TPCM)
 * - Tổ trưởng / Tổ phó tổ Văn phòng
 */
export function isCbqlStaff(
  staff: StaffMember | { type?: string; position?: string; concurrentPosition?: string } | null | undefined
): boolean {
  if (!staff) return false;
  if (staff.type === 'bgh') return true;

  const pos = (staff.position || '').toLowerCase();
  const concurrent = (staff.concurrentPosition || '').toLowerCase();

  return (
    pos.includes('hiệu trưởng') ||
    pos.includes('phó hiệu trưởng') ||
    pos.includes('tổ trưởng') ||
    pos.includes('tổ phó') ||
    pos.includes('ttcm') ||
    pos.includes('tpcm') ||
    concurrent.includes('tổ trưởng') ||
    concurrent.includes('tổ phó') ||
    concurrent.includes('ttcm') ||
    concurrent.includes('tpcm')
  );
}

export type CbqlCategoryType = 'bgh' | 'totruong' | 'topho';

/**
 * Returns specific leadership tier for badge and grouping
 */
export function getCbqlCategory(
  staff: StaffMember | { type?: string; position?: string } | null | undefined
): CbqlCategoryType {
  if (!staff) return 'totruong';
  const pos = (staff.position || '').toLowerCase();

  if (staff.type === 'bgh' || (pos.includes('hiệu trưởng') && !pos.includes('tổ'))) {
    return 'bgh';
  }
  if (pos.includes('tổ trưởng') || pos.includes('ttcm')) {
    return 'totruong';
  }
  if (pos.includes('tổ phó') || pos.includes('tpcm')) {
    return 'topho';
  }
  return 'totruong';
}

/**
 * Visual badge styling for each CBQL role
 */
export function getCbqlCategoryBadge(category: CbqlCategoryType) {
  switch (category) {
    case 'bgh':
      return {
        label: 'Ban Giám hiệu',
        shortLabel: 'BGH',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-500',
      };
    case 'totruong':
      return {
        label: 'Tổ trưởng Chuyên môn',
        shortLabel: 'Tổ trưởng CM',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        dotColor: 'bg-blue-600',
      };
    case 'topho':
      return {
        label: 'Tổ phó Chuyên môn',
        shortLabel: 'Tổ phó CM',
        badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        dotColor: 'bg-indigo-600',
      };
  }
}

/**
 * Checks whether an evaluation belongs to CBQL module
 */
export function isCbqlEvaluation(
  evalItem: TeacherKpiEvaluation,
  staffList: StaffMember[]
): boolean {
  if (!evalItem) return false;
  if (evalItem.targetType === 'bgh') return true;

  // Check matching staff member
  const staff = staffList.find((s) => s.id === evalItem.staffId || s.code === evalItem.staffCode);
  if (staff && isCbqlStaff(staff)) return true;

  // Check position directly on evaluation
  const pos = (evalItem.position || '').toLowerCase();
  return (
    pos.includes('hiệu trưởng') ||
    pos.includes('phó hiệu trưởng') ||
    pos.includes('tổ trưởng') ||
    pos.includes('tổ phó') ||
    pos.includes('ttcm') ||
    pos.includes('tpcm')
  );
}

/**
 * Returns all staff members belonging to Cán bộ Quản lý (BGH, Tổ trưởng, Tổ phó)
 */
export function getCbqlStaffList(staffList: StaffMember[]): StaffMember[] {
  return staffList.filter((s) => isCbqlStaff(s));
}

/**
 * Council Evaluator constants for Hiệu trưởng / Phó Hiệu trưởng
 */
export const COUNCIL_EVALUATOR_INFO = {
  id: 'COUNCIL_TDKT',
  type: 'COUNCIL' as const,
  name: 'Hội đồng Thi đua – Khen thưởng',
  role: 'Hội đồng Thi đua – Khen thưởng',
  level: 'CAP_HOI_DONG' as const,
};

/**
 * Returns BGH Evaluator candidates (Only Hiệu trưởng & Phó Hiệu trưởng)
 */
export function getBghEvaluatorCandidates(staffList: StaffMember[]): StaffMember[] {
  const list = staffList.filter((s) => isBghLeader(s));
  const uniqueMap = new Map<string, StaffMember>();
  list.forEach((s) => uniqueMap.set(s.id, s));
  return Array.from(uniqueMap.values());
}

/**
 * Strictly validates the evaluator of a CBQL evaluation according to school rules:
 * - TTCM/TPCM must be evaluated by BGH (Hiệu trưởng / Phó Hiệu trưởng)
 * - Hiệu trưởng/Phó Hiệu trưởng must be evaluated by COUNCIL (Hội đồng Thi đua – Khen thưởng)
 */
export function validateCbqlEvaluator(
  staff: StaffMember,
  evaluatorId: string,
  evaluatorType?: string,
  staffList?: StaffMember[]
): { valid: boolean; error?: string } {
  const isBgh = isBghLeader(staff);
  const isTtcmTpcm = isTtcmOrTpcm(staff) || !isBgh;

  if (isBgh) {
    if (evaluatorType !== 'COUNCIL' && evaluatorId !== COUNCIL_EVALUATOR_INFO.id) {
      return {
        valid: false,
        error: 'Hiệu trưởng/Phó Hiệu trưởng phải được đánh giá bởi Hội đồng Thi đua – Khen thưởng.',
      };
    }
    return { valid: true };
  }

  if (isTtcmTpcm) {
    if (evaluatorType === 'COUNCIL' || evaluatorId === COUNCIL_EVALUATOR_INFO.id) {
      return {
        valid: false,
        error: 'Đối tượng TTCM/TPCM chỉ được đánh giá bởi Hiệu trưởng hoặc Phó Hiệu trưởng.',
      };
    }
    if (!evaluatorId) {
      return {
        valid: false,
        error: 'Vui lòng chọn Hiệu trưởng hoặc Phó Hiệu trưởng đánh giá!',
      };
    }
    if (staffList && staffList.length > 0) {
      const evaluatorStaff = staffList.find((s) => s.id === evaluatorId);
      if (!evaluatorStaff || !isBghLeader(evaluatorStaff)) {
        return {
          valid: false,
          error: 'Đối tượng TTCM/TPCM chỉ được đánh giá bởi Hiệu trưởng hoặc Phó Hiệu trưởng.',
        };
      }
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Formats display string for evaluator in CBQL KPI tables and cards
 */
export function getCbqlEvaluatorDisplay(
  evalItem: TeacherKpiEvaluation,
  staffList?: StaffMember[]
): {
  type: 'COUNCIL' | 'BGH';
  title: string;
  name: string;
  role: string;
  fullDisplay: string;
} {
  const staff = staffList?.find((s) => s.id === evalItem.staffId || s.code === evalItem.staffCode);
  const isBgh = isBghLeader(staff || { position: evalItem.position, type: evalItem.targetType });

  if (
    isBgh ||
    evalItem.evaluatorType === 'COUNCIL' ||
    evalItem.evaluator_type === 'COUNCIL' ||
    evalItem.evaluatorId === COUNCIL_EVALUATOR_INFO.id ||
    evalItem.evaluator_id === COUNCIL_EVALUATOR_INFO.id
  ) {
    return {
      type: 'COUNCIL',
      title: 'HỘI ĐỒNG ĐÁNH GIÁ',
      name: 'Hội đồng Thi đua – Khen thưởng',
      role: 'Hội đồng Thi đua – Khen thưởng',
      fullDisplay: 'Hội đồng Thi đua – Khen thưởng',
    };
  }

  // TTCM / TPCM evaluated by BGH
  const bghName =
    evalItem.bghEvaluatorName ||
    evalItem.bgh_evaluator_name ||
    evalItem.evaluatorName ||
    evalItem.evaluator_name ||
    'Hiệu trưởng / Phó Hiệu trưởng';
  const bghRole =
    evalItem.bghEvaluatorRole ||
    evalItem.bgh_evaluator_role ||
    evalItem.evaluatorRole ||
    evalItem.evaluator_role ||
    'Ban Giám hiệu';

  return {
    type: 'BGH',
    title: 'NGƯỜI ĐÁNH GIÁ',
    name: bghName,
    role: bghRole,
    fullDisplay: `${bghName}${bghRole && !bghName.includes(bghRole) ? ` – ${bghRole}` : ''}`,
  };
}
