import { TeacherKpiEvaluation } from '../types';
import { getEvaluationDisplayScores } from './scoreUtils';

export interface KpiRankingTier {
  code: 'HTSXNV' | 'HTTNV' | 'HTNV' | 'KHTNV';
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
}

export const DEFAULT_KPI_RANKING_TIERS: KpiRankingTier[] = [
  {
    code: 'HTSXNV',
    name: 'Hoàn thành xuất sắc nhiệm vụ',
    minScore: 95,
    maxScore: 100,
    description: 'Từ 95 đến 100 điểm',
  },
  {
    code: 'HTTNV',
    name: 'Hoàn thành tốt nhiệm vụ',
    minScore: 85,
    maxScore: 95,
    description: 'Từ 85 đến dưới 95 điểm',
  },
  {
    code: 'HTNV',
    name: 'Hoàn thành nhiệm vụ',
    minScore: 70,
    maxScore: 85,
    description: 'Từ 70 đến dưới 85 điểm',
  },
  {
    code: 'KHTNV',
    name: 'Không hoàn thành nhiệm vụ',
    minScore: 0,
    maxScore: 70,
    description: 'Dưới 70 điểm',
  },
];

const STORAGE_KEY = 'thpt_px_kpi_ranking_tiers_v1';

export function getStoredRankingTiers(): KpiRankingTier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read stored ranking tiers', e);
  }
  return DEFAULT_KPI_RANKING_TIERS;
}

export function saveStoredRankingTiers(tiers: KpiRankingTier[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tiers));
  } catch (e) {
    console.error('Failed to save ranking tiers', e);
  }
}

export interface KpiRankingResult {
  code: 'HTSXNV' | 'HTTNV' | 'HTNV' | 'KHTNV' | 'CHUA_XEP_LOAI';
  name: string; // 'Hoàn thành xuất sắc nhiệm vụ' or 'Chưa xếp loại'
  fullName: string;
  isRanked: boolean;
  score: number | null;
  badgeClass: string;
}

/**
 * Xác định KẾT QUẢ XẾP LOẠI chính thức của Phiếu KPI:
 * - DỰA TRÊN TỔNG ĐIỂM BGH ĐÁNH GIÁ/DUYỆT
 * - CHỈ ĐƯỢC XÁC ĐỊNH KHI BGH ĐÃ ĐÁNH GIÁ
 * - Nếu BGH chưa đánh giá -> "Chưa xếp loại"
 * - Chỉ gồm 4 kết quả: HTSXNV, HTTNV, HTNV, KHTNV
 */
export function getKpiRankingResult(
  evalItem: TeacherKpiEvaluation | undefined | null,
  customTiers?: KpiRankingTier[]
): KpiRankingResult {
  if (!evalItem) {
    return {
      code: 'CHUA_XEP_LOAI',
      name: 'Chưa xếp loại',
      fullName: 'Chưa xếp loại',
      isRanked: false,
      score: null,
      badgeClass: 'bg-slate-100 text-slate-500 border border-slate-300',
    };
  }

  const scoresInfo = getEvaluationDisplayScores(evalItem);

  // Chỉ xếp loại khi BGH ĐÃ HOÀN TẤT ĐÁNH GIÁ
  if (!scoresInfo.hasBghEvaluated || scoresInfo.bghScoreNum === null) {
    return {
      code: 'CHUA_XEP_LOAI',
      name: 'Chưa xếp loại',
      fullName: 'Chưa xếp loại',
      isRanked: false,
      score: null,
      badgeClass: 'bg-slate-100 text-slate-500 border border-slate-300',
    };
  }

  const bghScore = scoresInfo.bghScoreNum;
  const tiers = customTiers || getStoredRankingTiers();

  // Tìm tier phù hợp (sắp xếp giảm dần theo minScore)
  const sorted = [...tiers].sort((a, b) => b.minScore - a.minScore);
  const matched = sorted.find((t) => bghScore >= t.minScore) || sorted[sorted.length - 1];

  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
  if (matched.code === 'HTSXNV') {
    badgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
  } else if (matched.code === 'HTTNV') {
    badgeClass = 'bg-blue-100 text-blue-900 border border-blue-300';
  } else if (matched.code === 'HTNV') {
    badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300';
  } else if (matched.code === 'KHTNV') {
    badgeClass = 'bg-rose-100 text-rose-900 border border-rose-300';
  }

  return {
    code: matched.code,
    name: matched.name,
    fullName: `${matched.name} (${matched.code})`,
    isRanked: true,
    score: bghScore,
    badgeClass,
  };
}
