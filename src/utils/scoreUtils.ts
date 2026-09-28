import { TeacherKpiEvaluation } from '../types';

export interface DisplayScoresResult {
  selfTotal: number;
  
  hasTtcmEvaluated: boolean;
  ttcmScoreNum: number | null;
  ttcmScoreLabel: string; // "92/100" or "Chưa chấm"
  
  hasBghEvaluated: boolean;
  bghScoreNum: number | null;
  bghScoreLabel: string; // "95/100" or "Chưa chấm"
  
  finalScore: number;
  finalScoreLabel: string; // "95" or "92" or "90" or "—"
}

/**
 * Utility function to compute live 3-tier display scores for TTCM and BGH.
 * Strictly adheres to requirement:
 * - TTCM ĐÁNH GIÁ -> Shows "92/100" or "Chưa chấm" (never TTCM name)
 * - BGH ĐÁNH GIÁ/DUYỆT -> Shows "95/100" or "Chưa chấm" (never BGH name)
 * - TỔNG ĐIỂM -> Final active score (BGH score if evaluated, else TTCM score, else Self score)
 */
export function getEvaluationDisplayScores(evalItem: TeacherKpiEvaluation): DisplayScoresResult {
  if (!evalItem) {
    return {
      selfTotal: 0,
      hasTtcmEvaluated: false,
      ttcmScoreNum: null,
      ttcmScoreLabel: 'Chưa chấm',
      hasBghEvaluated: false,
      bghScoreNum: null,
      bghScoreLabel: 'Chưa chấm',
      finalScore: 0,
      finalScoreLabel: '—',
    };
  }

  const scores = evalItem.scores || {};
  const scoreKeys = Object.keys(scores);

// 1. Self total score
  let selfTotal = evalItem.personal_score ?? evalItem.selfTotalScore ?? evalItem.self_total_score ?? 0;
  if (selfTotal === 0 && scoreKeys.length > 0) {
    let sumSelf = 0;
    scoreKeys.forEach((key) => {
      const item = scores[key];
      if (item && item.selfScore !== undefined && !item.isNa) {
        sumSelf += item.selfScore;
      }
    });
    if (sumSelf > 0) {
      selfTotal = sumSelf;
    }
  }

  // 2. Check TTCM evaluation
  let hasTtcmEvaluated = false;
  let ttcmScoreNum: number | null = null;

  if (evalItem.ttcm_status === 'completed' || evalItem.department_status === 'completed') {
    hasTtcmEvaluated = true;
    ttcmScoreNum = evalItem.ttcm_score ?? evalItem.department_score ?? evalItem.deptTotalScore ?? 100;
  } else {
    let countDeptScores = 0;
    let sumDeptScores = 0;
    scoreKeys.forEach((key) => {
      const item = scores[key];
      if (item && item.deptScore !== undefined && item.deptScore !== null) {
        countDeptScores++;
        sumDeptScores += item.deptScore;
      }
    });

    if (countDeptScores > 0 && (evalItem.ttcm_score !== undefined || evalItem.deptTotalScore !== undefined || ['dept_reviewed', 'bgh_approved', 'completed', 'locked'].includes(evalItem.status))) {
      hasTtcmEvaluated = true;
      ttcmScoreNum = evalItem.ttcm_score ?? evalItem.deptTotalScore ?? sumDeptScores;
    } else if (
      evalItem.ttcm_score !== undefined &&
      evalItem.ttcm_score !== null &&
      ['dept_reviewed', 'bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasTtcmEvaluated = true;
      ttcmScoreNum = evalItem.ttcm_score;
    } else if (
      evalItem.deptTotalScore !== undefined &&
      evalItem.deptTotalScore !== null &&
      ['dept_reviewed', 'bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasTtcmEvaluated = true;
      ttcmScoreNum = evalItem.deptTotalScore;
    } else if (
      evalItem.ttcm_total_score !== undefined &&
      evalItem.ttcm_total_score !== null &&
      ['dept_reviewed', 'bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasTtcmEvaluated = true;
      ttcmScoreNum = evalItem.ttcm_total_score;
    } else if (
      evalItem.dept_total_score !== undefined &&
      evalItem.dept_total_score !== null &&
      ['dept_reviewed', 'bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasTtcmEvaluated = true;
      ttcmScoreNum = evalItem.dept_total_score;
    }
  }

  // 3. Check BGH evaluation
  let hasBghEvaluated = false;
  let bghScoreNum: number | null = null;

  if (evalItem.bgh_status === 'completed' || evalItem.status === 'bgh_approved') {
    hasBghEvaluated = true;
    bghScoreNum = evalItem.bgh_score ?? evalItem.bghTotalScore ?? 100;
  } else {
    let countBghScores = 0;
    let sumBghScores = 0;
    scoreKeys.forEach((key) => {
      const item = scores[key];
      if (item && item.bghScore !== undefined && item.bghScore !== null) {
        countBghScores++;
        sumBghScores += item.bghScore;
      }
    });

    if (countBghScores > 0 && (evalItem.bgh_score !== undefined || evalItem.bghTotalScore !== undefined || ['bgh_approved', 'completed', 'locked'].includes(evalItem.status))) {
      hasBghEvaluated = true;
      bghScoreNum = evalItem.bgh_score ?? evalItem.bghTotalScore ?? sumBghScores;
    } else if (
      evalItem.bgh_score !== undefined &&
      evalItem.bgh_score !== null &&
      ['bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasBghEvaluated = true;
      bghScoreNum = evalItem.bgh_score;
    } else if (
      evalItem.bghTotalScore !== undefined &&
      evalItem.bghTotalScore !== null &&
      ['bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasBghEvaluated = true;
      bghScoreNum = evalItem.bghTotalScore;
    } else if (
      evalItem.bgh_total_score !== undefined &&
      evalItem.bgh_total_score !== null &&
      ['bgh_approved', 'completed', 'locked'].includes(evalItem.status)
    ) {
      hasBghEvaluated = true;
      bghScoreNum = evalItem.bgh_total_score;
    }
  }

  // 4. Determine final score according to rule (BGH > TTCM > Self)
  let finalScore = selfTotal;
  if (hasBghEvaluated && bghScoreNum !== null) {
    finalScore = bghScoreNum;
  } else if (hasTtcmEvaluated && ttcmScoreNum !== null) {
    finalScore = ttcmScoreNum;
  }

  const finalScoreLabel =
    evalItem.status === 'draft' && !hasTtcmEvaluated && !hasBghEvaluated && selfTotal === 0
      ? '—'
      : `${finalScore}`;

  return {
    selfTotal,
    hasTtcmEvaluated,
    ttcmScoreNum,
    ttcmScoreLabel: hasTtcmEvaluated && ttcmScoreNum !== null ? `${ttcmScoreNum}/100` : 'Chưa chấm',
    hasBghEvaluated,
    bghScoreNum,
    bghScoreLabel: hasBghEvaluated && bghScoreNum !== null ? `${bghScoreNum}/100` : 'Chưa chấm',
    finalScore,
    finalScoreLabel,
  };
}
