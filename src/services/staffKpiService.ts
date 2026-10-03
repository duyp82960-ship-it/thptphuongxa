import { doc, getDoc, setDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeForFirestore } from './dbService';
import { TeacherKpiEvaluation } from '../types';
import {
  STAFF_GENERAL_KPI_CRITERIA,
  OFFICIAL_STAFF_POSITIONS,
  KpiCriterionItem,
  StaffPositionDefinition,
  detectStaffPositionKey,
} from '../data/kpiEvaluationTemplates';

export interface StaffRankingTier {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
  order: number;
  isActive: boolean;
  description?: string;
}

export const DEFAULT_STAFF_RANKING_TIERS: StaffRankingTier[] = [
  {
    id: 'tier-1',
    name: 'Hoàn thành xuất sắc nhiệm vụ',
    minScore: 90,
    maxScore: 100,
    color: 'emerald',
    order: 1,
    isActive: true,
    description: 'Từ 90 đến 100 điểm',
  },
  {
    id: 'tier-2',
    name: 'Hoàn thành tốt nhiệm vụ',
    minScore: 80,
    maxScore: 90,
    color: 'blue',
    order: 2,
    isActive: true,
    description: 'Từ 80 đến dưới 90 điểm',
  },
  {
    id: 'tier-3',
    name: 'Hoàn thành nhiệm vụ',
    minScore: 65,
    maxScore: 80,
    color: 'amber',
    order: 3,
    isActive: true,
    description: 'Từ 65 đến dưới 80 điểm',
  },
  {
    id: 'tier-4',
    name: 'Không hoàn thành nhiệm vụ',
    minScore: 0,
    maxScore: 65,
    color: 'rose',
    order: 4,
    isActive: true,
    description: 'Dưới 65 điểm',
  },
];

const RANKING_CONFIG_DOC = 'settings/staff_ranking_config';
const CRITERIA_CONFIG_DOC = 'settings/staff_criteria_config';
const LOCAL_STORAGE_RANKING_KEY = 'thpt_px_staff_ranking_tiers_v2';
const LOCAL_STORAGE_CRITERIA_KEY = 'thpt_px_staff_criteria_config_v2';

/**
 * Fetch staff ranking tiers from Firestore, falling back to localStorage and default
 */
export async function fetchStaffRankingTiers(): Promise<StaffRankingTier[]> {
  try {
    const docRef = doc(db, 'settings', 'staff_ranking_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.tiers) && data.tiers.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_RANKING_KEY, JSON.stringify(data.tiers));
        return data.tiers;
      }
    }
  } catch (err) {
    console.warn('Error fetching staff ranking config from Firestore, checking cache:', err);
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_RANKING_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading ranking tiers from cache:', err);
  }

  return DEFAULT_STAFF_RANKING_TIERS;
}

/**
 * Save staff ranking tiers to Firestore and localStorage
 */
export async function saveStaffRankingTiers(tiers: StaffRankingTier[]): Promise<void> {
  localStorage.setItem(LOCAL_STORAGE_RANKING_KEY, JSON.stringify(tiers));
  try {
    const docRef = doc(db, 'settings', 'staff_ranking_config');
    await setDoc(docRef, sanitizeForFirestore({
      tiers,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.error('Error saving staff ranking config to Firestore:', err);
    throw err;
  }
}

/**
 * Calculate ranking for staff based on custom configured tiers
 */
export function calculateStaffRank(score: number, tiers?: StaffRankingTier[]): string {
  if (tiers && tiers.length > 0) {
    const activeTiers = tiers
      .filter((t) => t.isActive)
      .sort((a, b) => b.minScore - a.minScore);

    if (activeTiers.length > 0) {
      for (const t of activeTiers) {
        const isMaxLimit = t.maxScore >= 100;
        if (score >= t.minScore && (isMaxLimit ? score <= 100 : score < t.maxScore)) {
          return t.name;
        }
      }

      // If score is higher than highest tier minScore
      if (score >= activeTiers[0].minScore) {
        return activeTiers[0].name;
      }

      // Return lowest active tier
      return activeTiers[activeTiers.length - 1].name;
    }
  }

  // Statutory standard threshold (Requirement 6):
  // 90–100 → Hoàn thành xuất sắc nhiệm vụ
  // 80–<90 → Hoàn thành tốt nhiệm vụ
  // 65–<80 → Hoàn thành nhiệm vụ
  // <65 → Không hoàn thành nhiệm vụ
  if (score >= 90) return 'Hoàn thành xuất sắc nhiệm vụ';
  if (score >= 80) return 'Hoàn thành tốt nhiệm vụ';
  if (score >= 65) return 'Hoàn thành nhiệm vụ';
  return 'Không hoàn thành nhiệm vụ';
}

/**
 * Get CSS badge classes for a ranking based on configured color
 */
export function getStaffRankBadgeClass(rankName: string, tiers: StaffRankingTier[]): string {
  const tier = tiers.find((t) => t.name.toLowerCase().trim() === (rankName || '').toLowerCase().trim());
  if (!tier) {
    // Default mappings
    const norm = (rankName || '').toLowerCase();
    if (norm.includes('xuất sắc')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (norm.includes('tốt')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (norm.includes('chưa') || norm.includes('không')) return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  }

  switch (tier.color) {
    case 'emerald':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'blue':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'amber':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'rose':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'purple':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

export interface StaffCriteriaGroupDef {
  key: string;
  name: string;
  maxPoints: number;
  isCustom?: boolean;
}

export interface StaffCriteriaConfig {
  generalCriteria: KpiCriterionItem[];
  positionCriteriaMap: Record<string, KpiCriterionItem[]>;
  customGroups?: StaffCriteriaGroupDef[];
  version: number;
}

/**
 * Fetch staff criteria configuration from Firestore, falling back to default
 */
export async function fetchStaffCriteriaConfig(): Promise<StaffCriteriaConfig> {
  const defaultMap: Record<string, KpiCriterionItem[]> = {};
  OFFICIAL_STAFF_POSITIONS.forEach((pos) => {
    defaultMap[pos.key] = pos.criteria;
  });

  const defaultConfig: StaffCriteriaConfig = {
    generalCriteria: STAFF_GENERAL_KPI_CRITERIA,
    positionCriteriaMap: defaultMap,
    customGroups: [],
    version: 1,
  };

  try {
    const docRef = doc(db, 'settings', 'staff_criteria_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.generalCriteria && data.positionCriteriaMap) {
        localStorage.setItem(LOCAL_STORAGE_CRITERIA_KEY, JSON.stringify(data));
        return {
          generalCriteria: data.generalCriteria,
          positionCriteriaMap: data.positionCriteriaMap,
          customGroups: Array.isArray(data.customGroups) ? data.customGroups : [],
          version: data.version || 1,
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching staff criteria config from Firestore, checking cache:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_CRITERIA_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.generalCriteria && parsed.positionCriteriaMap) {
        return {
          generalCriteria: parsed.generalCriteria,
          positionCriteriaMap: parsed.positionCriteriaMap,
          customGroups: Array.isArray(parsed.customGroups) ? parsed.customGroups : [],
          version: parsed.version || 1,
        };
      }
    }
  } catch (err) {
    console.error('Error reading criteria config from cache:', err);
  }

  return defaultConfig;
}

/**
 * Save staff criteria configuration to Firestore and localStorage
 */
export async function saveStaffCriteriaConfig(config: StaffCriteriaConfig): Promise<void> {
  const updatedConfig = {
    ...config,
    version: (config.version || 1) + 1,
  };
  localStorage.setItem(LOCAL_STORAGE_CRITERIA_KEY, JSON.stringify(updatedConfig));
  try {
    const docRef = doc(db, 'settings', 'staff_criteria_config');
    await setDoc(docRef, sanitizeForFirestore({
      ...updatedConfig,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.error('Error saving staff criteria config to Firestore:', err);
    throw err;
  }
}
