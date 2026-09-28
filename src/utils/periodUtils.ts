import { EvaluationPeriod, TeacherKpiEvaluation } from '../types';

export interface EvaluationPeriodOption {
  id: EvaluationPeriod;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  dotColor: string;
}

export const EVALUATION_PERIOD_OPTIONS: EvaluationPeriodOption[] = [
  {
    id: 'ki1',
    label: 'Kì I (Học kì I)',
    shortLabel: 'Kì I',
    description: 'Đánh giá KPI kết quả thực hiện nhiệm vụ Học kì I',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
    dotColor: 'bg-blue-600',
  },
  {
    id: 'ki2',
    label: 'Kì II (Học kì II)',
    shortLabel: 'Kì II',
    description: 'Đánh giá KPI kết quả thực hiện nhiệm vụ Học kì II',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20',
    dotColor: 'bg-purple-600',
  },
  {
    id: 'canam',
    label: 'Cả năm (Toàn khóa học)',
    shortLabel: 'Cả năm',
    description: 'Tổng kết đánh giá KPI cả năm học của cán bộ, giáo viên, nhân viên',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
    dotColor: 'bg-emerald-600',
  },
  {
    id: 'thang',
    label: 'Theo tháng (Định kỳ)',
    shortLabel: 'Theo tháng',
    description: 'Đánh giá KPI từng tháng trong năm học',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20',
    dotColor: 'bg-amber-600',
  },
];

/**
 * Resolves the evaluation period from an evaluation record
 */
export function getEvaluationPeriod(evalItem?: Partial<TeacherKpiEvaluation> | null): EvaluationPeriod {
  if (!evalItem) return 'ki1';
  if (evalItem.evaluationPeriod) return evalItem.evaluationPeriod;

  // Check periodName string
  const pName = (evalItem.periodName || '').toLowerCase();
  if (pName.includes('cả năm') || pName.includes('canam') || pName.includes('toàn năm')) {
    return 'canam';
  }
  if (pName.includes('kì ii') || pName.includes('kỳ ii') || pName.includes('hk2') || pName.includes('học kỳ 2')) {
    return 'ki2';
  }
  if (pName.includes('kì i') || pName.includes('kỳ i') || pName.includes('hk1') || pName.includes('học kỳ 1')) {
    return 'ki1';
  }

  // Check month
  if (evalItem.month && evalItem.month > 0) {
    return 'thang';
  }

  // Check semester
  if (evalItem.semester === 2) {
    return 'ki2';
  }

  return 'ki1';
}

/**
 * Returns formatted label for the evaluation period
 */
export function getEvaluationPeriodLabel(evalItem?: Partial<TeacherKpiEvaluation> | null): string {
  if (!evalItem) return 'Kì I';

  const period = getEvaluationPeriod(evalItem);

  if (period === 'ki1') return 'Kì I';
  if (period === 'ki2') return 'Kì II';
  if (period === 'canam') return 'Cả năm';

  if (period === 'thang') {
    const m = evalItem.month || 9;
    const y = evalItem.year || 2026;
    return `Tháng ${String(m).padStart(2, '0')}/${y}`;
  }

  return evalItem.periodName || 'Kì I';
}

/**
 * Returns full title including school year for documents and print sheets
 */
export function getEvaluationPeriodFullTitle(
  evalItem?: Partial<TeacherKpiEvaluation> | null,
  schoolYear: string = '2026 - 2027'
): string {
  const label = getEvaluationPeriodLabel(evalItem);
  const yr = evalItem?.schoolYear || schoolYear;
  return `KỲ ĐÁNH GIÁ: ${label.toUpperCase()} – NĂM HỌC ${yr}`;
}

/**
 * Returns styling classes for evaluation period badges
 */
export function getEvaluationPeriodBadge(evalItemOrPeriod?: Partial<TeacherKpiEvaluation> | EvaluationPeriod | null): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  const period: EvaluationPeriod =
    typeof evalItemOrPeriod === 'string'
      ? (evalItemOrPeriod as EvaluationPeriod)
      : getEvaluationPeriod(evalItemOrPeriod);

  const label =
    typeof evalItemOrPeriod === 'string'
      ? evalItemOrPeriod === 'ki1'
        ? 'Kì I'
        : evalItemOrPeriod === 'ki2'
        ? 'Kì II'
        : evalItemOrPeriod === 'canam'
        ? 'Cả năm'
        : 'Theo tháng'
      : getEvaluationPeriodLabel(evalItemOrPeriod);

  switch (period) {
    case 'ki1':
      return {
        label,
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-500/20',
        dotColor: 'bg-blue-600',
      };
    case 'ki2':
      return {
        label,
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200 ring-1 ring-purple-500/20',
        dotColor: 'bg-purple-600',
      };
    case 'canam':
      return {
        label,
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 ring-1 ring-emerald-500/20',
        dotColor: 'bg-emerald-600',
      };
    case 'thang':
    default:
      return {
        label,
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 ring-1 ring-amber-500/20',
        dotColor: 'bg-amber-600',
      };
  }
}

/**
 * Checks if an evaluation item matches a period filter
 */
export function matchesEvaluationPeriod(
  evalItem: Partial<TeacherKpiEvaluation>,
  periodFilter: EvaluationPeriod | 'all',
  monthFilter?: number | 'all',
  yearFilter?: number | 'all'
): boolean {
  if (periodFilter !== 'all') {
    const itemPeriod = getEvaluationPeriod(evalItem);
    if (itemPeriod !== periodFilter) {
      return false;
    }
    // If filtering by monthly period, check specific month if specified
    if (periodFilter === 'thang' && monthFilter && monthFilter !== 'all') {
      if (evalItem.month && evalItem.month !== monthFilter) {
        return false;
      }
    }
  } else {
    // If periodFilter is 'all', but monthFilter is specifically set
    if (monthFilter && monthFilter !== 'all') {
      if (evalItem.month && evalItem.month !== monthFilter) {
        return false;
      }
    }
  }

  // Year filter
  if (yearFilter && yearFilter !== 'all') {
    if (evalItem.year && evalItem.year !== yearFilter) {
      if (!evalItem.schoolYear?.includes(String(yearFilter))) {
        return false;
      }
    }
  }

  return true;
}
