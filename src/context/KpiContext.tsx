import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  UserAccount,
  StaffMember,
  KpiCriterion,
  KpiIncident,
  PersonKpiSummary,
  PersonType,
  TeacherKpiEvaluation,
  TaskTrackingRecord,
  HomepageBackground,
  BackgroundPosition,
  SchoolUiSettings,
  LeaveRequest,
  StaffLeaveQuotaSummary,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_STAFF,
  INITIAL_CRITERIA,
  INITIAL_INCIDENTS,
  CURRENT_SCHOOL_YEAR,
  CURRENT_SEMESTER,
  CURRENT_MONTH,
  SCHOOL_CONFIG,
  DEFAULT_SCHOOL_UI_SETTINGS,
} from '../mockData';
import { INITIAL_EVALUATIONS } from '../data/initialEvaluations';
import { INITIAL_LEAVE_REQUESTS } from '../data/initialLeaveRequests';
import {
  initializeDatabaseIfNeeded,
  dbAddStaff,
  dbUpdateStaff,
  dbDeleteStaff,
  dbBulkAddStaff,
  dbAddCriterion,
  dbUpdateCriterion,
  dbDeleteCriterion,
  dbAddIncident,
  dbDeleteIncident,
  dbSaveEvaluation,
  dbDeleteEvaluation,
  dbBulkDeleteEvaluations,
  dbUpdateUser,
  dbSaveCriteriaTemplate,
  dbFetchCriteriaTemplates,
  dbSaveTrackingRecord,
  dbDeleteTrackingRecord,
  dbFetchSchoolUiSettings,
  dbSaveSchoolUiSettings,
  dbResetSchoolUiSettings,
  dbSaveLeaveRequest,
  dbDeleteLeaveRequest,
  dbBulkDeleteLeaveRequests,
  dbClearAllLeaveRequests,
  dbBulkAddLeaveRequests,
} from '../services/dbService';
import {
  KpiCriterionItem,
  TEACHER_KPI_CRITERIA,
  BGH_KPI_CRITERIA,
  STAFF_KPI_CRITERIA,
  getCriteriaForTarget,
  getOfficialStaffCriteria,
  calculateKpiRank,
} from '../data/kpiEvaluationTemplates';
import { CriteriaEditorModal } from '../components/CriteriaEditorModal';
import {
  dbFetchAllBackgrounds,
  dbSaveBackground,
  dbSetActiveBackground,
  dbUpdateBackgroundConfig,
  dbDeleteBackground,
  DEFAULT_HOMEPAGE_BACKGROUND,
} from '../services/backgroundService';
import {
  isCbqlStaff,
  isBghLeader,
  isTtcmOrTpcm,
  isCbqlEvaluation,
  COUNCIL_EVALUATOR_INFO,
} from '../utils/cbqlUtils';

const STORAGE_KEYS = {
  USER: 'thpt_phuong_xa_current_user',
  YEAR: 'thpt_phuong_xa_year',
  SEMESTER: 'thpt_phuong_xa_semester',
  MONTH: 'thpt_phuong_xa_month',
};

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface FilterOptions {
  month?: number;
  semester?: 1 | 2;
  schoolYear?: string;
  type?: PersonType;
  department?: string;
}

interface KpiContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  staffList: StaffMember[];
  criteriaList: KpiCriterion[];
  incidentsList: KpiIncident[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPersonId: string | null;
  setSelectedPersonId: (id: string | null) => void;
  schoolYear: string;
  setSchoolYear: (year: string) => void;
  semester: 1 | 2;
  setSemester: (sem: 1 | 2) => void;
  month: number;
  setMonth: (m: number) => void;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  switchUserById: (userId: string) => void;
  updateBghName: (newName: string, newPosition?: string) => Promise<void>;
  updateUser: (user: UserAccount) => Promise<void>;
  // Staff CRUD
  addStaff: (member: Omit<StaffMember, 'id'>) => Promise<void>;
  updateStaff: (member: StaffMember) => Promise<void>;
  deleteStaff: (id: string) => Promise<boolean>;
  bulkAddStaff: (
    members: Omit<StaffMember, 'id'>[],
    mode: 'append' | 'replace'
  ) => Promise<{ addedCount: number; updatedCount: number; total: number }>;
  clearAllStaff: () => Promise<void>;
  restoreInitialStaff: () => Promise<void>;
  // Criteria CRUD
  addCriterion: (criterion: Omit<KpiCriterion, 'id'>) => Promise<void>;
  updateCriterion: (criterion: KpiCriterion) => Promise<void>;
  deleteCriterion: (id: string) => Promise<boolean>;
  toggleCriterionStatus: (id: string) => Promise<void>;
  // Incidents CRUD
  addIncident: (incident: Omit<KpiIncident, 'id' | 'createdAt'>) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  // KPI Calculation
  getPersonKpiSummary: (personId: string, options?: FilterOptions) => PersonKpiSummary | null;
  getAllSummaries: (options?: FilterOptions) => PersonKpiSummary[];
  // Data Tools
  resetToDemoData: () => Promise<void>;
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => Promise<boolean>;
  // Criteria Set & Template Versioning Management
  getCriteriaListForTarget: (
    targetType: 'bgh' | 'giaovien' | 'nhanvien',
    position?: string
  ) => KpiCriterionItem[];
  updateCriteriaSetForTarget: (
    targetType: 'bgh' | 'giaovien' | 'nhanvien',
    newCriteria: KpiCriterionItem[]
  ) => Promise<void>;
  getCriteriaVersion: (targetType: 'bgh' | 'giaovien' | 'nhanvien') => number;
  isCriteriaEditorOpen: boolean;
  setIsCriteriaEditorOpen: (open: boolean) => void;
  criteriaEditorTarget: 'bgh' | 'giaovien' | 'nhanvien';
  openCriteriaEditor: (targetType: 'bgh' | 'giaovien' | 'nhanvien') => void;
  // Official KPI Evaluations (THPT PHƯƠNG XÁ 2026-2027)
  evaluationsList: TeacherKpiEvaluation[];
  saveEvaluation: (evalData: TeacherKpiEvaluation) => Promise<void>;
  getEvaluation: (staffId: string, schoolYear?: string) => TeacherKpiEvaluation | undefined;
  deleteEvaluation: (id: string) => Promise<void>;
  clearAllEvaluations: (targetType?: PersonType | 'all') => Promise<void>;
  activeEvaluationStaffId: string | null;
  setActiveEvaluationStaffId: (id: string | null) => void;
  // Task Tracking Operations (Quy trình: Theo dõi -> Đánh giá -> Chốt -> Tạo Phiếu KPI)
  trackingList: TaskTrackingRecord[];
  saveTrackingRecord: (record: TaskTrackingRecord) => Promise<void>;
  deleteTrackingRecord: (id: string) => Promise<void>;
  lockTrackingRecord: (id: string) => Promise<void>;
  generateKpiFromTrackingRecord: (trackingId: string) => Promise<TeacherKpiEvaluation | null>;
  // UI & Toast
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  isQuickIncidentOpen: boolean;
  setIsQuickIncidentOpen: (open: boolean) => void;
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;
  printData: { title: string; subtitle: string; content?: ReactNode } | null;
  openPrintModal: (title: string, subtitle: string, content?: ReactNode) => void;
  // Leave Request & Quota Management
  leaveRequestsList: LeaveRequest[];
  saveLeaveRequest: (request: LeaveRequest) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  bulkDeleteLeaveRequests: (ids: string[]) => Promise<void>;
  clearAllLeaveRequests: () => Promise<void>;
  restoreInitialLeaveRequests: () => Promise<void>;
  approveLeaveRequest: (id: string, reviewerRole: 'dept' | 'bgh', note?: string) => Promise<void>;
  rejectLeaveRequest: (id: string, reviewerRole: 'dept' | 'bgh', reason: string) => Promise<void>;
  cancelLeaveRequest: (id: string) => Promise<void>;
  getStaffLeaveQuota: (staffId: string, year?: number) => StaffLeaveQuotaSummary;
  schoolConfig: typeof SCHOOL_CONFIG;
  isDbLoading: boolean;
  // School UI & Homepage Branding Settings
  uiSettings: SchoolUiSettings;
  updateUiSettings: (settings: SchoolUiSettings) => Promise<void>;
  resetUiSettings: () => Promise<void>;
  // Homepage Background Management
  activeBackground: HomepageBackground;
  backgroundsList: HomepageBackground[];
  isBackgroundLoading: boolean;
  saveBackground: (
    bgData: Omit<HomepageBackground, 'id' | 'created_at'>,
    customId?: string
  ) => Promise<HomepageBackground>;
  activateBackground: (id: string) => Promise<void>;
  updateBackgroundConfig: (
    id: string,
    updates: { position?: BackgroundPosition; overlay_opacity?: number }
  ) => Promise<void>;
  deleteBackground: (id: string) => Promise<boolean>;
}

const KpiContext = createContext<KpiContextType | undefined>(undefined);

export const KpiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Database-backed Users accounts
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);

  // Current user state (session only)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0];
  });

  // Database-backed states
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [criteriaList, setCriteriaList] = useState<KpiCriterion[]>(INITIAL_CRITERIA);
  const [incidentsList, setIncidentsList] = useState<KpiIncident[]>(INITIAL_INCIDENTS);
  const [evaluationsList, setEvaluationsList] = useState<TeacherKpiEvaluation[]>(() => {
    try {
      const cached = localStorage.getItem('thpt_phuong_xa_evaluations_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading initial cached evaluations:', e);
    }
    return INITIAL_EVALUATIONS;
  });
  const [trackingList, setTrackingList] = useState<TaskTrackingRecord[]>([]);
  const [leaveRequestsList, setLeaveRequestsList] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);

  // App navigation & filters
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [schoolYear, setSchoolYear] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.YEAR) || CURRENT_SCHOOL_YEAR;
  });
  const [semester, setSemester] = useState<1 | 2>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEMESTER);
    return saved ? (Number(saved) as 1 | 2) : CURRENT_SEMESTER;
  });
  const [month, setMonth] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTH);
    return saved ? Number(saved) : CURRENT_MONTH;
  });

  const [activeEvaluationStaffId, setActiveEvaluationStaffId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isQuickIncidentOpen, setIsQuickIncidentOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{ title: string; subtitle: string; content?: ReactNode } | null>(null);

  // Background states
  const [backgroundsList, setBackgroundsList] = useState<HomepageBackground[]>([]);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState<boolean>(false);

  // School UI & Homepage Branding Settings
  const [uiSettings, setUiSettings] = useState<SchoolUiSettings>(() => {
    try {
      const saved = localStorage.getItem('thpt_phuong_xa_ui_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SCHOOL_UI_SETTINGS;
  });


  // Criteria templates & versioning state
  const [criteriaTemplates, setCriteriaTemplates] = useState<
    Record<string, { criteria: KpiCriterionItem[]; version: number }>
  >(() => {
    try {
      const savedGiaovien = localStorage.getItem('thpt_phuong_xa_criteria_giaovien');
      const savedBgh = localStorage.getItem('thpt_phuong_xa_criteria_bgh');
      const savedNhanvien = localStorage.getItem('thpt_phuong_xa_criteria_nhanvien');

      return {
        giaovien: savedGiaovien
          ? JSON.parse(savedGiaovien)
          : { criteria: TEACHER_KPI_CRITERIA, version: 1 },
        bgh: savedBgh
          ? JSON.parse(savedBgh)
          : { criteria: BGH_KPI_CRITERIA, version: 1 },
        nhanvien: savedNhanvien
          ? JSON.parse(savedNhanvien)
          : { criteria: STAFF_KPI_CRITERIA, version: 1 },
      };
    } catch (e) {
      return {
        giaovien: { criteria: TEACHER_KPI_CRITERIA, version: 1 },
        bgh: { criteria: BGH_KPI_CRITERIA, version: 1 },
        nhanvien: { criteria: STAFF_KPI_CRITERIA, version: 1 },
      };
    }
  });

  const [isCriteriaEditorOpen, setIsCriteriaEditorOpen] = useState(false);
  const [criteriaEditorTarget, setCriteriaEditorTarget] = useState<'bgh' | 'giaovien' | 'nhanvien'>('giaovien');

  const openCriteriaEditor = (targetType: 'bgh' | 'giaovien' | 'nhanvien') => {
    setCriteriaEditorTarget(targetType);
    setIsCriteriaEditorOpen(true);
  };

  const getCriteriaListForTarget = (
    targetType: 'bgh' | 'giaovien' | 'nhanvien',
    position?: string
  ): KpiCriterionItem[] => {
    if (targetType === 'nhanvien') {
      return getOfficialStaffCriteria(position || '').allCriteria;
    }
    const tData = criteriaTemplates[targetType];
    if (tData && tData.criteria && tData.criteria.length > 0) {
      return tData.criteria;
    }
    return getCriteriaForTarget(targetType, position);
  };

  const getCriteriaVersion = (targetType: 'bgh' | 'giaovien' | 'nhanvien'): number => {
    return criteriaTemplates[targetType]?.version || 1;
  };

  const updateCriteriaSetForTarget = async (
    targetType: 'bgh' | 'giaovien' | 'nhanvien',
    newCriteria: KpiCriterionItem[]
  ): Promise<void> => {
    const nextVer = (criteriaTemplates[targetType]?.version || 1) + 1;
    const newEntry = { criteria: newCriteria, version: nextVer };

    setCriteriaTemplates((prev) => ({
      ...prev,
      [targetType]: newEntry,
    }));

    try {
      localStorage.setItem(
        `thpt_phuong_xa_criteria_${targetType}`,
        JSON.stringify(newEntry)
      );
      await dbSaveCriteriaTemplate(targetType, newCriteria, nextVer);
    } catch (e) {
      console.error('Error persisting criteria set template:', e);
    }
  };

  const activeBackground = useMemo(() => {
    return backgroundsList.find((b) => b.is_active) || DEFAULT_HOMEPAGE_BACKGROUND;
  }, [backgroundsList]);

  // Load from Firebase on app mount
  useEffect(() => {
    let isMounted = true;
    async function loadDatabase() {
      setIsDbLoading(true);
      try {
        const data = await initializeDatabaseIfNeeded();
        if (isMounted) {
          if (data.staffList.length > 0) setStaffList(data.staffList);
          if (data.criteriaList.length > 0) setCriteriaList(data.criteriaList);
          if (data.incidentsList.length > 0) setIncidentsList(data.incidentsList);
          if (data.evaluationsList.length > 0) setEvaluationsList(data.evaluationsList);
          if (data.trackingList && data.trackingList.length > 0) setTrackingList(data.trackingList);
          if (data.leaveRequestsList && data.leaveRequestsList.length > 0) setLeaveRequestsList(data.leaveRequestsList);
          if (data.usersList && data.usersList.length > 0) {
            setUsers(data.usersList);
            // If currentUser is one of the users, sync the updated user info
            setCurrentUser((prev) => {
              if (!prev) return data.usersList[0];
              const updated = data.usersList.find((u) => u.id === prev.id);
              return updated || prev;
            });
          }
        }

        // Fetch backgrounds from database (Firestore & IndexedDB)
        const bgData = await dbFetchAllBackgrounds();
        if (isMounted && bgData && bgData.length > 0) {
          setBackgroundsList(bgData);
        }

        // Fetch School UI Branding Settings from Firestore
        try {
          const cloudUiSettings = await dbFetchSchoolUiSettings();
          if (isMounted) {
            if (cloudUiSettings) {
              setUiSettings(cloudUiSettings);
              localStorage.setItem('thpt_phuong_xa_ui_settings', JSON.stringify(cloudUiSettings));
            } else {
              // Initial seed to Firestore
              await dbSaveSchoolUiSettings(DEFAULT_SCHOOL_UI_SETTINGS);
            }
          }
        } catch (uiErr) {
          console.warn('Could not sync school UI settings from Firestore:', uiErr);
        }

      } catch (err) {
        console.error('Failed to load initial data from Database:', err);
      } finally {
        if (isMounted) setIsDbLoading(false);
      }
    }
    loadDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // UI preferences persistence only
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.YEAR, schoolYear);
  }, [schoolYear]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEMESTER, String(semester));
  }, [semester]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONTH, String(month));
  }, [month]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3800);
  };

  const updateUiSettings = async (newSettings: SchoolUiSettings) => {
    setUiSettings(newSettings);
    localStorage.setItem('thpt_phuong_xa_ui_settings', JSON.stringify(newSettings));
    try {
      await dbSaveSchoolUiSettings(newSettings);
      showToast('Đã lưu cấu hình giao diện thành công!', 'success');
    } catch (err) {
      console.error('Lỗi khi lưu cấu hình giao diện vào Firestore:', err);
      showToast('Đã lưu cấu hình giao diện vào bộ nhớ máy (F5 không mất)', 'info');
    }
  };

  const resetUiSettings = async () => {
    try {
      const defaultSettings = await dbResetSchoolUiSettings();
      setUiSettings(defaultSettings);
      localStorage.setItem('thpt_phuong_xa_ui_settings', JSON.stringify(defaultSettings));
      showToast('Đã khôi phục cấu hình giao diện mặc định!', 'info');
    } catch (err) {
      console.error('Lỗi khôi phục cấu hình mặc định:', err);
      setUiSettings(DEFAULT_SCHOOL_UI_SETTINGS);
      localStorage.setItem('thpt_phuong_xa_ui_settings', JSON.stringify(DEFAULT_SCHOOL_UI_SETTINGS));
      showToast('Đã khôi phục giao diện mặc định ban đầu', 'info');
    }
  };

  const dynamicSchoolConfig = useMemo(() => {
    const sName = uiSettings.school_name || SCHOOL_CONFIG.fullName;
    const short = sName.replace(/^TRƯỜNG\s+/i, '').trim();
    return {
      ...SCHOOL_CONFIG,
      fullName: sName,
      shortName: short || sName,
      normalName: sName,
      department: uiSettings.department_name || SCHOOL_CONFIG.department,
    };
  }, [uiSettings.school_name, uiSettings.department_name]);


  const login = (username: string, pass: string): boolean => {
    const matched = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (matched && pass.length >= 4) {
      setCurrentUser(matched);
      if (matched.role === 'giaovien' || matched.role === 'nhanvien') {
        setSelectedPersonId(matched.personId);
        setActiveTab('kpi-personal');
      } else {
        setActiveTab('dashboard');
      }
      showToast(`Chào mừng ${matched.name} (${matched.position})!`, 'success');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  const switchUserById = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'giaovien' || user.role === 'nhanvien') {
        setSelectedPersonId(user.personId);
        setActiveTab('kpi-personal');
      }
      showToast(`Đã chuyển sang tài khoản: ${user.name} [${user.position}]`, 'info');
    }
  };

  // Update User Account (persists to Firestore)
  const updateUser = async (updatedUser: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    try {
      await dbUpdateUser(updatedUser);
      showToast(`Đã lưu thay đổi cho tài khoản ${updatedUser.name}`, 'success');
    } catch (err) {
      console.error('Error updating user in database:', err);
      showToast('Đã cập nhật trên giao diện (lỗi lưu Cloud DB)', 'warning');
    }
  };

  // Specifically change Ban Giám hiệu / Hiệu trưởng name and sync with BGH Staff record
  const updateBghName = async (newName: string, newPosition?: string) => {
    if (!newName.trim()) return;
    const cleanName = newName.trim();

    // 1. Find and update BGH user account (user-bgh)
    const bghUser = users.find((u) => u.role === 'bgh') || users[0];
    if (bghUser) {
      const updatedUser: UserAccount = {
        ...bghUser,
        name: cleanName,
        position: newPosition?.trim() || bghUser.position || 'Hiệu trưởng',
      };
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      if (currentUser?.role === 'bgh') {
        setCurrentUser(updatedUser);
      }
      try {
        await dbUpdateUser(updatedUser);
      } catch (err) {
        console.error('Error updating BGH user in database:', err);
      }
    }

    // 2. Also sync with the corresponding BGH staff member in staffList
    const bghStaff = staffList.find((s) => s.type === 'bgh');
    if (bghStaff) {
      const updatedStaff: StaffMember = {
        ...bghStaff,
        name: cleanName,
        position: newPosition?.trim() || bghStaff.position,
      };
      setStaffList((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));
      // Also update incidents linked to this staff
      setIncidentsList((prev) =>
        prev.map((inc) => (inc.personId === updatedStaff.id ? { ...inc, personName: cleanName } : inc))
      );
      try {
        await dbUpdateStaff(updatedStaff);
      } catch (err) {
        console.error('Error updating BGH staff in database:', err);
      }
    }

    showToast(`Đã cập nhật thông tin Ban Giám hiệu: ${cleanName}`, 'success');
  };

  // ==================== STAFF CRUD (DATABASE INTEGRATED) ====================

  const addStaff = async (member: Omit<StaffMember, 'id'>) => {
    const newId = `staff-${Date.now()}`;
    const newStaff: StaffMember = { ...member, id: newId };
    // Optimistic UI update
    setStaffList((prev) => [newStaff, ...prev]);
    try {
      await dbAddStaff(newStaff);
      showToast(`Đã lưu thành công nhân sự: ${member.name} vào Database`, 'success');
    } catch (err) {
      console.error('Error saving staff to database:', err);
      showToast(`Lỗi khi lưu ${member.name} vào Database. Đã lưu bộ nhớ tạm.`, 'warning');
    }
  };

  const updateStaff = async (member: StaffMember) => {
    setStaffList((prev) => prev.map((s) => (s.id === member.id ? member : s)));
    setIncidentsList((prev) =>
      prev.map((inc) => (inc.personId === member.id ? { ...inc, personName: member.name, department: member.department } : inc))
    );
    try {
      await dbUpdateStaff(member);
      showToast(`Đã cập nhật thành công thông tin cho: ${member.name}`, 'success');
    } catch (err) {
      console.error('Error updating staff in database:', err);
      showToast(`Lỗi khi lưu cập nhật vào Database`, 'warning');
    }
  };

  const deleteStaff = async (id: string): Promise<boolean> => {
    const target = staffList.find((s) => s.id === id);
    if (!target) return false;
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    setIncidentsList((prev) => prev.filter((inc) => inc.personId !== id));
    try {
      await dbDeleteStaff(id);
      showToast(`Đã xóa cán bộ/giáo viên: ${target.name} khỏi Database`, 'warning');
      return true;
    } catch (err) {
      console.error('Error deleting staff from database:', err);
      showToast(`Lỗi khi xóa từ Database`, 'error');
      return true;
    }
  };

  const bulkAddStaff = async (
    members: Omit<StaffMember, 'id'>[],
    mode: 'append' | 'replace'
  ): Promise<{ addedCount: number; updatedCount: number; total: number }> => {
    let addedCount = 0;
    let updatedCount = 0;

    if (mode === 'replace') {
      const newStaffList: StaffMember[] = members.map((m, idx) => ({
        ...m,
        id: `staff-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      }));
      setStaffList(newStaffList);
      const newIds = new Set(newStaffList.map((s) => s.id));
      setIncidentsList((prev) => prev.filter((inc) => newIds.has(inc.personId)));

      try {
        await dbBulkAddStaff(newStaffList);
        showToast(`Đã lưu mới toàn bộ ${newStaffList.length} nhân sự vào Database!`, 'success');
      } catch (err) {
        console.error('Error bulk adding staff:', err);
        showToast(`Lỗi khi ghi xuống Database`, 'warning');
      }
      return { addedCount: newStaffList.length, updatedCount: 0, total: newStaffList.length };
    } else {
      const existingByCode = new Map<string, StaffMember>(
        staffList.map((s) => [s.code.trim().toUpperCase(), s])
      );
      const updatedList = [...staffList];
      const newlyAdded: StaffMember[] = [];

      for (let idx = 0; idx < members.length; idx++) {
        const m = members[idx];
        const normalizedCode = (m.code || '').trim().toUpperCase();
        const existing = normalizedCode ? existingByCode.get(normalizedCode) : undefined;

        if (existing) {
          const targetIndex = updatedList.findIndex((s) => s.id === existing.id);
          if (targetIndex !== -1) {
            const merged = { ...m, id: existing.id };
            updatedList[targetIndex] = merged;
            await dbUpdateStaff(merged);
            updatedCount++;
          }
        } else {
          const newMember: StaffMember = {
            ...m,
            id: `staff-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          };
          updatedList.push(newMember);
          newlyAdded.push(newMember);
          if (normalizedCode) {
            existingByCode.set(normalizedCode, newMember);
          }
          addedCount++;
        }
      }

      setStaffList(updatedList);
      if (newlyAdded.length > 0) {
        await dbBulkAddStaff(newlyAdded);
      }

      showToast(`Đã nhập từ Excel & lưu Database: thêm ${addedCount}, cập nhật ${updatedCount}!`, 'success');
      return { addedCount, updatedCount, total: staffList.length + addedCount };
    }
  };

  const clearAllStaff = async () => {
    const oldStaff = [...staffList];
    setStaffList([]);
    setIncidentsList([]);
    try {
      for (const s of oldStaff) {
        await dbDeleteStaff(s.id);
      }
      showToast('Đã xóa danh sách nhân sự trên Database!', 'warning');
    } catch (err) {
      console.error(err);
    }
  };

  const restoreInitialStaff = async () => {
    setStaffList(INITIAL_STAFF);
    setIncidentsList(INITIAL_INCIDENTS);
    try {
      await dbBulkAddStaff(INITIAL_STAFF);
      showToast('Đã nạp lại dữ liệu nhân sự mẫu ban đầu vào Database!', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // ==================== CRITERIA CRUD (DATABASE INTEGRATED) ====================

  const addCriterion = async (crit: Omit<KpiCriterion, 'id'>) => {
    const newId = `crit-${Date.now()}`;
    const newCrit: KpiCriterion = { ...crit, id: newId };
    setCriteriaList((prev) => [newCrit, ...prev]);
    try {
      await dbAddCriterion(newCrit);
      showToast(`Đã lưu tiêu chí KPI [${crit.code}] vào Database`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Lỗi khi lưu tiêu chí vào Database`, 'warning');
    }
  };

  const updateCriterion = async (crit: KpiCriterion) => {
    setCriteriaList((prev) => prev.map((c) => (c.id === crit.id ? crit : c)));
    try {
      await dbUpdateCriterion(crit);
      showToast(`Đã cập nhật tiêu chí KPI [${crit.code}] vào Database`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Lỗi khi cập nhật tiêu chí vào Database`, 'warning');
    }
  };

  const deleteCriterion = async (id: string): Promise<boolean> => {
    const target = criteriaList.find((c) => c.id === id);
    if (!target) return false;
    setCriteriaList((prev) => prev.filter((c) => c.id !== id));
    try {
      await dbDeleteCriterion(id);
      showToast(`Đã xóa tiêu chí KPI: ${target.code} khỏi Database`, 'warning');
      return true;
    } catch (err) {
      console.error(err);
      showToast(`Lỗi khi xóa tiêu chí từ Database`, 'error');
      return true;
    }
  };

  const toggleCriterionStatus = async (id: string) => {
    const target = criteriaList.find((c) => c.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    const updated = { ...target, status: nextStatus };
    setCriteriaList((prev) => prev.map((c) => (c.id === id ? updated : c)));
    try {
      await dbUpdateCriterion(updated);
      showToast(`Tiêu chí ${target.code}: ${nextStatus === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // ==================== INCIDENTS CRUD (DATABASE INTEGRATED) ====================

  const addIncident = async (incident: Omit<KpiIncident, 'id' | 'createdAt'>) => {
    const newId = `inc-${Date.now()}`;
    const newIncident: KpiIncident = {
      ...incident,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setIncidentsList((prev) => [newIncident, ...prev]);
    try {
      await dbAddIncident(newIncident);
      showToast(
        `Đã lưu phát sinh KPI cho ${incident.personName} (${incident.type === 'plus' ? '+' : '-'}${incident.totalPoints}đ) vào Database`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi ghi phát sinh vào Database', 'warning');
    }
  };

  const deleteIncident = async (id: string) => {
    setIncidentsList((prev) => prev.filter((inc) => inc.id !== id));
    try {
      await dbDeleteIncident(id);
      showToast('Đã xóa dòng phát sinh KPI khỏi Database', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // ==================== EVALUATIONS CRUD (DATABASE INTEGRATED) ====================

  // ==================== TASK TRACKING OPERATIONS ====================

  const saveTrackingRecord = async (record: TaskTrackingRecord) => {
    const updatedRecord: TaskTrackingRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
    };

    setTrackingList((prev) => {
      const idx = prev.findIndex((r) => r.id === updatedRecord.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedRecord;
        return next;
      }
      return [updatedRecord, ...prev];
    });

    try {
      await dbSaveTrackingRecord(updatedRecord);
      showToast(`Đã lưu đợt theo dõi thực hiện cho ${updatedRecord.staffName}!`, 'success');
    } catch (err) {
      console.error('Error saving tracking record to database:', err);
      showToast('Lỗi khi lưu đợt theo dõi vào cơ sở dữ liệu', 'warning');
    }
  };

  const deleteTrackingRecord = async (id: string) => {
    const target = trackingList.find((r) => r.id === id);
    if (!target) return;

    setTrackingList((prev) => prev.filter((r) => r.id !== id));
    try {
      await dbDeleteTrackingRecord(id);
      showToast(`Đã xóa đợt theo dõi của ${target.staffName}`, 'info');
    } catch (err) {
      console.error('Error deleting tracking record:', err);
    }
  };

  const lockTrackingRecord = async (id: string) => {
    const target = trackingList.find((r) => r.id === id);
    if (!target) return;

    const lockedRecord: TaskTrackingRecord = {
      ...target,
      status: 'Đã chốt',
      isLocked: true,
      lockedBy: currentUser?.name || 'Admin',
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      historyLogs: [
        ...(target.historyLogs || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Chốt kết quả theo dõi',
          actorName: currentUser?.name || 'Admin',
          details: 'Khóa không cho chỉnh sửa tự do kết quả theo dõi.',
        },
      ],
    };

    setTrackingList((prev) => prev.map((r) => (r.id === id ? lockedRecord : r)));
    try {
      await dbSaveTrackingRecord(lockedRecord);
      showToast(`Đã chốt kết quả theo dõi nhiệm vụ cho ${target.staffName}!`, 'success');
    } catch (err) {
      console.error('Error locking tracking record:', err);
    }
  };

  const generateKpiFromTrackingRecord = async (
    trackingId: string
  ): Promise<TeacherKpiEvaluation | null> => {
    const targetTrack = trackingList.find((r) => r.id === trackingId);
    if (!targetTrack) {
      showToast('Không tìm thấy dữ liệu theo dõi!', 'error');
      return null;
    }

    // Must be locked/finalized
    if (!targetTrack.isLocked && targetTrack.status !== 'Đã chốt' && targetTrack.status !== 'Đã tạo Phiếu KPI') {
      showToast('Cần chốt kết quả theo dõi trước khi tạo Phiếu KPI!', 'warning');
      return null;
    }

    // Check anti-duplication
    const existingByLink = evaluationsList.find(
      (e) =>
        e.tracking_period_id === trackingId ||
        e.trackingPeriodId === trackingId ||
        (e.staffId === targetTrack.staffId &&
          e.month === targetTrack.month &&
          e.year === targetTrack.year &&
          e.targetType === targetTrack.targetType)
    );

    if (existingByLink || targetTrack.generatedKpiId) {
      showToast('Đã tồn tại Phiếu KPI được tạo từ kết quả theo dõi này.', 'warning');
      return existingByLink || null;
    }

    // Map criteria items into scores record
    const scores: Record<string, any> = {};
    let selfTotal = 0;
    let deptTotal = 0;
    let bghTotal = 0;

    Object.keys(targetTrack.items).forEach((critId) => {
      const item = targetTrack.items[critId];
      const selfScore =
        item.selfProposedScore !== undefined
          ? item.selfProposedScore
          : item.progress === 100
          ? item.maxPoints
          : Math.round((item.maxPoints * item.progress) / 100);

      const deptScore = item.ttcmProposedScore !== undefined ? item.ttcmProposedScore : selfScore;
      const bghScore = item.bghProposedScore !== undefined ? item.bghProposedScore : deptScore;

      selfTotal += selfScore;
      deptTotal += deptScore;
      bghTotal += bghScore;

      scores[critId] = {
        criterionId: critId,
        selfScore,
        deptScore,
        bghScore,
        evidence: item.evidence || '',
        progress: item.progress,
        status: item.status,
        result: item.actualResult || (item.progress === 100 ? 'Đạt yêu cầu' : ''),
        notes: item.bghNotes || item.ttcmNotes || item.selfNotes || '',
        updatedAt: new Date().toISOString(),
      };
    });

    const newEvalId = `eval-${targetTrack.staffId}-t${String(targetTrack.month).padStart(2, '0')}-${targetTrack.year}`;

    const newEval: TeacherKpiEvaluation = {
      id: newEvalId,
      staffId: targetTrack.staffId,
      staffCode: targetTrack.staffCode,
      staffName: targetTrack.staffName,
      department: targetTrack.department,
      position: targetTrack.position,
      targetType: targetTrack.targetType,
      schoolYear: targetTrack.schoolYear,
      month: targetTrack.month,
      year: targetTrack.year,
      
      ttcmEvaluatorId: targetTrack.ttcmEvaluatorId || targetTrack.ttcm_evaluator_id,
      ttcmEvaluatorName: targetTrack.ttcmEvaluatorName || targetTrack.ttcm_evaluator_name,
      ttcmEvaluatorRole: targetTrack.ttcmEvaluatorRole || targetTrack.ttcm_evaluator_role,
      ttcmEvaluatorDepartment: targetTrack.ttcmEvaluatorDepartment || targetTrack.ttcm_evaluator_department,
      
      bghEvaluatorId: targetTrack.bghEvaluatorId || targetTrack.bgh_evaluator_id,
      bghEvaluatorName: targetTrack.bghEvaluatorName || targetTrack.bgh_evaluator_name,
      bghEvaluatorRole: targetTrack.bghEvaluatorRole || targetTrack.bgh_evaluator_role,

      ttcm_evaluator_id: targetTrack.ttcmEvaluatorId || targetTrack.ttcm_evaluator_id,
      ttcm_evaluator_name: targetTrack.ttcmEvaluatorName || targetTrack.ttcm_evaluator_name,
      ttcm_evaluator_role: targetTrack.ttcmEvaluatorRole || targetTrack.ttcm_evaluator_role,
      ttcm_evaluator_department: targetTrack.ttcmEvaluatorDepartment || targetTrack.ttcm_evaluator_department,
      
      bgh_evaluator_id: targetTrack.bghEvaluatorId || targetTrack.bgh_evaluator_id,
      bgh_evaluator_name: targetTrack.bghEvaluatorName || targetTrack.bgh_evaluator_name,
      bgh_evaluator_role: targetTrack.bghEvaluatorRole || targetTrack.bgh_evaluator_role,

      tracking_period_id: targetTrack.id,
      tracking_evaluation_id: targetTrack.id,
      trackingPeriodId: targetTrack.id,
      trackingEvaluationId: targetTrack.id,

      scores,
      selfTotalScore: selfTotal,
      deptTotalScore: deptTotal,
      bghTotalScore: bghTotal,
      selfRank: calculateKpiRank(selfTotal),
      deptRank: calculateKpiRank(deptTotal),
      bghRank: calculateKpiRank(bghTotal),
      status: 'completed',
      selfDate: new Date().toISOString().split('T')[0],
      deptDate: new Date().toISOString().split('T')[0],
      bghDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    const updatedTrack: TaskTrackingRecord = {
      ...targetTrack,
      status: 'Đã tạo Phiếu KPI',
      generatedKpiId: newEval.id,
      kpiGeneratedAt: new Date().toISOString(),
      kpiGeneratedBy: currentUser?.name || 'Admin',
      updatedAt: new Date().toISOString(),
      historyLogs: [
        ...(targetTrack.historyLogs || []),
        {
          timestamp: new Date().toISOString(),
          action: 'Tạo Phiếu KPI từ kết quả theo dõi',
          actorName: currentUser?.name || 'Admin',
          details: `Đã khởi tạo Phiếu KPI thành công (ID: ${newEval.id}).`,
        },
      ],
    };

    await saveEvaluation(newEval);
    setTrackingList((prev) => prev.map((r) => (r.id === trackingId ? updatedTrack : r)));
    await dbSaveTrackingRecord(updatedTrack);

    showToast(`Đã tạo thành công Phiếu KPI từ kết quả theo dõi cho ${targetTrack.staffName}!`, 'success');
    return newEval;
  };

  const saveEvaluation = async (evalData: TeacherKpiEvaluation) => {
    let sanitizedEval = { ...evalData };

    // Strict Backend / Service validation for CBQL evaluations
    const staff = staffList.find((s) => s.id === evalData.staffId || s.code === evalData.staffCode);
    const isCbql = evalData.targetType === 'bgh' || (staff && isCbqlStaff(staff)) || isCbqlEvaluation(evalData, staffList);

    if (isCbql) {
      const isBgh = staff ? isBghLeader(staff) : (evalData.position || '').toLowerCase().includes('hiệu trưởng');
      if (isBgh) {
        // Hiệu trưởng / Phó Hiệu trưởng MUST be evaluated by COUNCIL
        sanitizedEval = {
          ...sanitizedEval,
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
        // TTCM / TPCM MUST be evaluated by BGH (Hiệu trưởng / Phó Hiệu trưởng)
        const bghStaffId = sanitizedEval.bghEvaluatorId || sanitizedEval.bgh_evaluator_id || sanitizedEval.evaluatorId || sanitizedEval.evaluator_id;
        const bghStaff = staffList.find((s) => s.id === bghStaffId && isBghLeader(s)) || staffList.find((s) => isBghLeader(s));
        const bghName = bghStaff?.name || sanitizedEval.bghEvaluatorName || sanitizedEval.evaluatorName || 'Hiệu trưởng';
        const bghRole = bghStaff?.position || sanitizedEval.bghEvaluatorRole || sanitizedEval.evaluatorRole || 'Ban Giám hiệu';

        sanitizedEval = {
          ...sanitizedEval,
          evaluatorId: bghStaff?.id || bghStaffId || '',
          evaluator_id: bghStaff?.id || bghStaffId || '',
          evaluatorType: 'BGH',
          evaluator_type: 'BGH',
          evaluatorName: bghName,
          evaluator_name: bghName,
          evaluatorRole: bghRole,
          evaluator_role: bghRole,
          evaluationLevel: 'CAP_BGH',
          evaluation_level: 'CAP_BGH',
          bghEvaluatorId: bghStaff?.id || bghStaffId || '',
          bghEvaluatorName: bghName,
          bghEvaluatorRole: bghRole,
          bgh_evaluator_id: bghStaff?.id || bghStaffId || '',
          bgh_evaluator_name: bghName,
          bgh_evaluator_role: bghRole,
        };
      }
    }

    const updatedEval: TeacherKpiEvaluation = {
      ...sanitizedEval,
      id: sanitizedEval.id || `eval-${sanitizedEval.staffId}-${sanitizedEval.targetType || 'gv'}-${sanitizedEval.month || 9}-${sanitizedEval.year || 2026}`,
      updatedAt: new Date().toISOString(),
    };

    let finalEvalList: TeacherKpiEvaluation[] = [];
    setEvaluationsList((prev) => {
      // 1. Try matching by exact ID first
      let idx = prev.findIndex((e) => e.id === updatedEval.id);

      // 2. Fallback matching by staffId + targetType + month + year
      if (idx < 0) {
        idx = prev.findIndex(
          (e) =>
            e.staffId === updatedEval.staffId &&
            e.targetType === updatedEval.targetType &&
            e.month === updatedEval.month &&
            e.year === updatedEval.year
        );
      }

      // 3. Fallback matching by staffId + schoolYear (only if targetType matches)
      if (idx < 0) {
        idx = prev.findIndex(
          (e) => e.staffId === updatedEval.staffId && e.targetType === updatedEval.targetType && e.schoolYear === updatedEval.schoolYear
        );
      }

      if (idx >= 0) {
        finalEvalList = [...prev];
        finalEvalList[idx] = {
          ...finalEvalList[idx],
          ...updatedEval,
        };
      } else {
        finalEvalList = [updatedEval, ...prev];
      }

      try {
        localStorage.setItem('thpt_phuong_xa_evaluations_v2', JSON.stringify(finalEvalList));
      } catch (localErr) {
        console.warn('LocalStorage save error:', localErr);
      }

      return finalEvalList;
    });

    try {
      await dbSaveEvaluation(updatedEval);
      showToast(`Đã lưu thành công điểm KPI của ${evalData.staffName}!`, 'success');
    } catch (err: any) {
      console.error('Error saving evaluation to database:', err);
      showToast(`Lỗi khi lưu phiếu KPI vào Database: ${err?.message || err}`, 'warning');
      throw err;
    }
  };

  const getEvaluation = (
    staffId: string,
    targetYear?: string,
    month?: number,
    targetType?: PersonType
  ): TeacherKpiEvaluation | undefined => {
    return evaluationsList.find((e) => {
      if (e.staffId !== staffId) return false;
      if (targetType && e.targetType && e.targetType !== targetType) return false;
      if (month && e.month && e.month !== month) return false;
      if (targetYear && e.schoolYear && e.schoolYear !== targetYear) return false;
      return true;
    });
  };

  const deleteEvaluation = async (id: string) => {
    setEvaluationsList((prev) => prev.filter((e) => e.id !== id));
    try {
      await dbDeleteEvaluation(id);
      showToast('Đã xóa phiếu đánh giá KPI khỏi Database', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllEvaluations = async (targetType?: PersonType | 'all') => {
    let toDelete: TeacherKpiEvaluation[] = [];

    if (!targetType || targetType === 'all') {
      toDelete = [...evaluationsList];
      setEvaluationsList([]);
    } else {
      toDelete = evaluationsList.filter(
        (e) =>
          e.targetType === targetType ||
          (!e.targetType && targetType === 'giaovien' && e.department !== 'Tổ Văn phòng') ||
          (!e.targetType && targetType === 'nhanvien' && e.department === 'Tổ Văn phòng')
      );
      setEvaluationsList((prev) => prev.filter((e) => !toDelete.some((d) => d.id === e.id)));
    }

    if (toDelete.length > 0) {
      try {
        await dbBulkDeleteEvaluations(toDelete.map((e) => e.id));
        showToast(`Đã xóa toàn bộ ${toDelete.length} phiếu đánh giá KPI khỏi Database!`, 'warning');
      } catch (err) {
        console.error('Error clearing evaluations:', err);
        showToast('Lỗi khi xóa phiếu khỏi Database', 'error');
      }
    } else {
      showToast('Không có phiếu đánh giá nào để xóa', 'info');
    }
  };

  // KPI Calculations (Isolated and dynamic)
  const getPersonKpiSummary = (personId: string, options?: FilterOptions): PersonKpiSummary | null => {
    const person = staffList.find((s) => s.id === personId);
    if (!person) return null;

    const baseScore = person.baseScore || 100;

    const filteredIncidents = incidentsList.filter((inc) => {
      if (inc.personId !== personId) return false;
      if (options?.schoolYear && inc.schoolYear !== options.schoolYear) return false;
      if (options?.semester && inc.semester !== options.semester) return false;
      if (options?.month && inc.month !== options.month) return false;
      return true;
    });

    let totalPlus = 0;
    let totalMinus = 0;

    filteredIncidents.forEach((inc) => {
      if (inc.type === 'plus') {
        totalPlus += inc.totalPoints;
      } else {
        totalMinus += inc.totalPoints;
      }
    });

    const finalScore = baseScore + totalPlus - totalMinus;

    let rank: PersonKpiSummary['rank'] = 'Hoàn thành';
    if (finalScore >= 110) rank = 'Xuất sắc';
    else if (finalScore >= 95) rank = 'Tốt';
    else if (finalScore >= 80) rank = 'Hoàn thành';
    else rank = 'Cần cố gắng';

    return {
      person,
      baseScore,
      totalPlus,
      totalMinus,
      finalScore,
      rank,
      incidentsCount: filteredIncidents.length,
    };
  };

  const getAllSummaries = (options?: FilterOptions): PersonKpiSummary[] => {
    return staffList
      .filter((member) => {
        if (options?.type && member.type !== options.type) return false;
        if (options?.department && options.department !== 'all' && member.department !== options.department) return false;
        return true;
      })
      .map((member) => getPersonKpiSummary(member.id, options))
      .filter((s): s is PersonKpiSummary => s !== null);
  };

  const resetToDemoData = async () => {
    setStaffList(INITIAL_STAFF);
    setCriteriaList(INITIAL_CRITERIA);
    setIncidentsList(INITIAL_INCIDENTS);
    setEvaluationsList(INITIAL_EVALUATIONS);
    setSchoolYear(CURRENT_SCHOOL_YEAR);
    setSemester(CURRENT_SEMESTER);
    setMonth(CURRENT_MONTH);
    setCurrentUser(INITIAL_USERS[0]);

    try {
      await dbBulkAddStaff(INITIAL_STAFF);
      showToast(`Đã khôi phục dữ liệu mẫu ban đầu của ${SCHOOL_CONFIG.normalName} trên Database!`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const exportDataJson = (): string => {
    const data = {
      staffList,
      criteriaList,
      incidentsList,
      evaluationsList,
      schoolYear,
      exportedAt: new Date().toISOString(),
      school: SCHOOL_CONFIG.fullName,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (data.staffList && Array.isArray(data.staffList)) {
        setStaffList(data.staffList);
        await dbBulkAddStaff(data.staffList);
      }
      if (data.criteriaList && Array.isArray(data.criteriaList)) {
        setCriteriaList(data.criteriaList);
      }
      if (data.incidentsList && Array.isArray(data.incidentsList)) {
        setIncidentsList(data.incidentsList);
      }
      if (data.evaluationsList && Array.isArray(data.evaluationsList)) {
        setEvaluationsList(data.evaluationsList);
      }
      if (data.schoolYear) {
        setSchoolYear(data.schoolYear);
      }
      showToast('Đã nhập thành công và đồng bộ dữ liệu vào Database!', 'success');
      return true;
    } catch (e) {
      console.error(e);
      showToast('File dữ liệu không đúng định dạng JSON chuẩn!', 'error');
      return false;
    }
  };

  const openPrintModal = (title: string, subtitle: string, content?: ReactNode) => {
    setPrintData({ title, subtitle, content });
    setIsPrintModalOpen(true);
  };

  // Background operations
  const saveBackground = async (
    bgData: Omit<HomepageBackground, 'id' | 'created_at'>,
    customId?: string
  ): Promise<HomepageBackground> => {
    if (currentUser?.role !== 'bgh') {
      showToast('Chỉ Quản trị viên / BGH mới có quyền quản lý ảnh nền!', 'error');
      throw new Error('Unauthorized');
    }

    setIsBackgroundLoading(true);
    try {
      const id = customId || `bg-${Date.now()}`;
      const newBg: HomepageBackground = {
        ...bgData,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await dbSaveBackground(newBg);

      // Refresh list from DB
      const updated = await dbFetchAllBackgrounds();
      setBackgroundsList(updated);
      showToast('Lưu ảnh nền trang chủ thành công!', 'success');
      return newBg;
    } catch (error) {
      console.error('Error saving background to database:', error);
      showToast('Ảnh đã tải lên nhưng chưa được kích hoạt. Vui lòng thử lại.', 'error');
      throw error;
    } finally {
      setIsBackgroundLoading(false);
    }
  };

  const activateBackground = async (id: string): Promise<void> => {
    if (currentUser?.role !== 'bgh') {
      showToast('Chỉ Quản trị viên / BGH mới có quyền quản lý ảnh nền!', 'error');
      return;
    }

    setIsBackgroundLoading(true);
    try {
      await dbSetActiveBackground(id);
      const updated = await dbFetchAllBackgrounds();
      setBackgroundsList(updated);
      showToast('Đã kích hoạt ảnh nền trang chủ!', 'success');
    } catch (error) {
      console.error('Error activating background:', error);
      showToast('Không thể kích hoạt ảnh nền. Vui lòng thử lại.', 'error');
    } finally {
      setIsBackgroundLoading(false);
    }
  };

  const updateBackgroundConfig = async (
    id: string,
    updates: { position?: BackgroundPosition; overlay_opacity?: number }
  ): Promise<void> => {
    if (currentUser?.role !== 'bgh') {
      showToast('Chỉ Quản trị viên / BGH mới có quyền chỉnh sửa ảnh nền!', 'error');
      return;
    }

    try {
      await dbUpdateBackgroundConfig(id, updates);
      setBackgroundsList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item))
      );
      showToast('Đã cập nhật vị trí và độ tối ảnh nền!', 'success');
    } catch (error) {
      console.error('Error updating background config:', error);
      showToast('Không thể cập nhật cấu hình ảnh nền. Vui lòng thử lại.', 'error');
    }
  };

  const deleteBackground = async (id: string): Promise<boolean> => {
    if (currentUser?.role !== 'bgh') {
      showToast('Chỉ Quản trị viên / BGH mới có quyền xóa ảnh nền!', 'error');
      return false;
    }

    try {
      await dbDeleteBackground(id);
      const updated = await dbFetchAllBackgrounds();
      setBackgroundsList(updated);
      showToast('Đã xóa ảnh nền thành công!', 'success');
      return true;
    } catch (error) {
      console.error('Error deleting background:', error);
      showToast('Không thể xóa ảnh nền. Vui lòng thử lại.', 'error');
      return false;
    }
  };

  // ==================== LEAVE REQUEST & QUOTA OPERATIONS ====================

  const saveLeaveRequest = async (request: LeaveRequest): Promise<void> => {
    try {
      await dbSaveLeaveRequest(request);
      setLeaveRequestsList((prev) => {
        const index = prev.findIndex((r) => r.id === request.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = request;
          return next;
        }
        return [request, ...prev];
      });
      showToast('Đã lưu đơn xin nghỉ phép thành công!', 'success');
    } catch (err) {
      console.error('Error saving leave request:', err);
      setLeaveRequestsList((prev) => {
        const index = prev.findIndex((r) => r.id === request.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = request;
          return next;
        }
        return [request, ...prev];
      });
      showToast('Đã lưu đơn xin nghỉ phép vào bộ nhớ máy!', 'info');
    }
  };

  const deleteLeaveRequest = async (id: string): Promise<void> => {
    try {
      await dbDeleteLeaveRequest(id);
      setLeaveRequestsList((prev) => prev.filter((r) => r.id !== id));
      showToast('Đã xóa đơn xin nghỉ phép!', 'success');
    } catch (err) {
      console.error('Error deleting leave request:', err);
      setLeaveRequestsList((prev) => prev.filter((r) => r.id !== id));
      showToast('Đã xóa đơn khỏi danh sách!', 'info');
    }
  };

  const bulkDeleteLeaveRequests = async (ids: string[]): Promise<void> => {
    if (!ids || ids.length === 0) return;
    setLeaveRequestsList((prev) => prev.filter((r) => !ids.includes(r.id)));
    try {
      await dbBulkDeleteLeaveRequests(ids);
      showToast(`Đã xóa ${ids.length} đơn xin nghỉ phép thành công!`, 'success');
    } catch (err) {
      console.error('Error bulk deleting leave requests:', err);
      showToast(`Đã xóa ${ids.length} đơn xin nghỉ phép khỏi danh sách!`, 'info');
    }
  };

  const clearAllLeaveRequests = async (): Promise<void> => {
    setLeaveRequestsList([]);
    try {
      await dbClearAllLeaveRequests();
      showToast('Đã xóa toàn bộ danh sách đơn xin nghỉ phép và lý do nghỉ trên hệ thống!', 'success');
    } catch (err) {
      console.error('Error clearing all leave requests:', err);
      showToast('Đã xóa toàn bộ danh sách đơn xin nghỉ phép!', 'info');
    }
  };

  const restoreInitialLeaveRequests = async (): Promise<void> => {
    setLeaveRequestsList(INITIAL_LEAVE_REQUESTS);
    try {
      await dbBulkAddLeaveRequests(INITIAL_LEAVE_REQUESTS);
      showToast('Đã khôi phục dữ liệu mẫu đơn xin nghỉ phép ban đầu!', 'success');
    } catch (err) {
      console.error('Error restoring initial leave requests:', err);
      showToast('Đã khôi phục danh sách đơn mẫu!', 'info');
    }
  };

  const approveLeaveRequest = async (
    id: string,
    reviewerRole: 'dept' | 'bgh',
    note?: string
  ): Promise<void> => {
    const existing = leaveRequestsList.find((r) => r.id === id);
    if (!existing) return;

    const nowStr = new Date().toLocaleString('vi-VN');
    let updated: LeaveRequest;

    if (reviewerRole === 'dept') {
      // TTCM / Tổ trưởng duyệt -> chuyển sang chờ BGH duyệt
      updated = {
        ...existing,
        deptReviewerId: currentUser?.personId || 'dept-rev',
        deptReviewerName: currentUser?.name || 'Tổ trưởng',
        deptReviewStatus: 'approved',
        deptReviewNote: note || 'Tổ chuyên môn/bộ phận nhất trí phê duyệt',
        deptReviewedAt: nowStr,
        status: 'pending_bgh',
        updatedAt: nowStr,
      };
    } else {
      // BGH duyệt -> Phê duyệt hoàn tất
      updated = {
        ...existing,
        bghReviewerId: currentUser?.personId || 'bgh-rev',
        bghReviewerName: currentUser?.name || 'Ban Giám hiệu',
        bghReviewStatus: 'approved',
        bghReviewNote: note || 'Ban Giám hiệu đồng ý phê duyệt đơn xin nghỉ phép',
        bghReviewedAt: nowStr,
        status: 'approved',
        updatedAt: nowStr,
      };
    }

    await saveLeaveRequest(updated);
    showToast(
      reviewerRole === 'dept'
        ? 'Tổ trưởng đã duyệt đơn! Đơn đã được chuyển lên Ban Giám hiệu.'
        : 'Ban Giám hiệu đã phê duyệt đơn xin nghỉ phép hoàn tất!',
      'success'
    );
  };

  const rejectLeaveRequest = async (
    id: string,
    reviewerRole: 'dept' | 'bgh',
    reason: string
  ): Promise<void> => {
    const existing = leaveRequestsList.find((r) => r.id === id);
    if (!existing) return;

    const nowStr = new Date().toLocaleString('vi-VN');
    const updated: LeaveRequest = {
      ...existing,
      status: 'rejected',
      rejectionReason: reason,
      rejectedByRole: reviewerRole,
      rejectedByName: currentUser?.name || (reviewerRole === 'dept' ? 'Tổ trưởng' : 'Ban Giám hiệu'),
      rejectedAt: nowStr,
      updatedAt: nowStr,
      ...(reviewerRole === 'dept'
        ? { deptReviewStatus: 'rejected', deptReviewNote: reason, deptReviewedAt: nowStr }
        : { bghReviewStatus: 'rejected', bghReviewNote: reason, bghReviewedAt: nowStr }),
    };

    await saveLeaveRequest(updated);
    showToast('Đã từ chối đơn xin nghỉ phép!', 'warning');
  };

  const cancelLeaveRequest = async (id: string): Promise<void> => {
    const existing = leaveRequestsList.find((r) => r.id === id);
    if (!existing) return;

    const nowStr = new Date().toLocaleString('vi-VN');
    const updated: LeaveRequest = {
      ...existing,
      status: 'cancelled',
      updatedAt: nowStr,
    };

    await saveLeaveRequest(updated);
    showToast('Đã hủy đơn xin nghỉ phép!', 'info');
  };

  const getStaffLeaveQuota = (staffId: string, year: number = 2026): StaffLeaveQuotaSummary => {
    const staff = staffList.find((s) => s.id === staffId);
    const staffRequests = leaveRequestsList.filter(
      (r) => r.staffId === staffId && r.status !== 'cancelled' && r.status !== 'rejected'
    );

    const approvedRequests = staffRequests.filter((r) => r.status === 'approved');
    const pendingRequests = staffRequests.filter((r) => r.status === 'pending_dept' || r.status === 'pending_bgh');

    const usedAnnualDays = approvedRequests
      .filter((r) => r.leaveType === 'phep_nam')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const usedPaidPersonalDays = approvedRequests
      .filter((r) => r.leaveType === 'viec_rieng_co_luong')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const usedUnpaidDays = approvedRequests
      .filter((r) => r.leaveType === 'viec_rieng_khong_luong' || r.leaveType === 'khac')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const usedSickDays = approvedRequests
      .filter((r) => r.leaveType === 'om_dau_bhxh')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const usedMaternityDays = approvedRequests
      .filter((r) => r.leaveType === 'thai_san')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const usedBusinessTripDays = approvedRequests
      .filter((r) => r.leaveType === 'cong_tac')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const pendingDays = pendingRequests.reduce((sum, r) => sum + (r.totalDays || 0), 0);

    const totalAnnualQuota = 12; // 12 days standard annual quota
    const remainingAnnualDays = Math.max(0, totalAnnualQuota - usedAnnualDays);

    return {
      staffId,
      staffCode: staff?.code || '',
      staffName: staff?.name || '',
      department: staff?.department || '',
      position: staff?.position || '',
      targetType: staff?.type || 'giaovien',
      year,
      totalAnnualQuota,
      usedAnnualDays,
      remainingAnnualDays,
      usedPaidPersonalDays,
      usedUnpaidDays,
      usedSickDays,
      usedMaternityDays,
      usedBusinessTripDays,
      pendingDays,
      totalLeavesCount: staffRequests.length,
    };
  };

  return (
    <KpiContext.Provider
      value={{
        currentUser,
        users,
        switchUserById,
        updateBghName,
        updateUser,
        staffList,
        criteriaList,
        incidentsList,
        activeTab,
        setActiveTab,
        selectedPersonId,
        setSelectedPersonId,
        schoolYear,
        setSchoolYear,
        semester,
        setSemester,
        month,
        setMonth,
        login,
        logout,
        addStaff,
        updateStaff,
        deleteStaff,
        bulkAddStaff,
        clearAllStaff,
        restoreInitialStaff,
        addCriterion,
        updateCriterion,
        deleteCriterion,
        toggleCriterionStatus,
        addIncident,
        deleteIncident,
        getPersonKpiSummary,
        getAllSummaries,
        resetToDemoData,
        exportDataJson,
        importDataJson,
        evaluationsList,
        saveEvaluation,
        getEvaluation,
        deleteEvaluation,
        clearAllEvaluations,
        activeEvaluationStaffId,
        setActiveEvaluationStaffId,
        trackingList,
        saveTrackingRecord,
        deleteTrackingRecord,
        lockTrackingRecord,
        generateKpiFromTrackingRecord,
        // Leave Management
        leaveRequestsList,
        saveLeaveRequest,
        deleteLeaveRequest,
        bulkDeleteLeaveRequests,
        clearAllLeaveRequests,
        restoreInitialLeaveRequests,
        approveLeaveRequest,
        rejectLeaveRequest,
        cancelLeaveRequest,
        getStaffLeaveQuota,
        toast,
        showToast,
        isQuickIncidentOpen,
        setIsQuickIncidentOpen,
        isPrintModalOpen,
        setIsPrintModalOpen,
        printData,
        openPrintModal,
        schoolConfig: dynamicSchoolConfig,
        isDbLoading,
        uiSettings,
        updateUiSettings,
        resetUiSettings,
        activeBackground,
        backgroundsList,
        isBackgroundLoading,
        saveBackground,
        activateBackground,
        updateBackgroundConfig,
        deleteBackground,
        getCriteriaListForTarget,
        updateCriteriaSetForTarget,
        getCriteriaVersion,
        isCriteriaEditorOpen,
        setIsCriteriaEditorOpen,
        criteriaEditorTarget,
        openCriteriaEditor,
      }}
    >
      {children}
      <CriteriaEditorModal
        isOpen={isCriteriaEditorOpen}
        onClose={() => setIsCriteriaEditorOpen(false)}
        initialTargetType={criteriaEditorTarget}
      />
    </KpiContext.Provider>
  );
};

export const useKpi = (): KpiContextType => {
  const context = useContext(KpiContext);
  if (!context) {
    throw new Error('useKpi must be used within a KpiProvider');
  }
  return context;
};
