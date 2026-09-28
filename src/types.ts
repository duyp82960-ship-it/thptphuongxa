export type UserRole = 'bgh' | 'giaovien' | 'nhanvien';

export type DepartmentType =
  | 'Ban Giám hiệu'
  | 'Tổ Hóa - Sinh - CN'
  | 'Tổ Toán - Lí - Tin'
  | 'Tổ Văn - Ngoại ngữ'
  | 'Tổ Sử - Địa - KT&PL - TD - AN'
  | 'Tổ Sử - Địa - KT&PL - TD - QPAN'
  | 'Tổ Văn phòng'
  // Backward compatibility:
  | 'Tổ Toán - Tin'
  | 'Tổ Ngữ Văn'
  | 'Tổ Ngoại Ngữ'
  | 'Tổ Khoa học Tự nhiên'
  | 'Tổ Khoa học Xã hội'
  | 'Tổ Thể dục - GDQP';

export interface DepartmentDefinition {
  id: string;
  name: DepartmentType | string;
  shortName: string;
  type: 'BAN_GIAM_HIEU' | 'CHUYEN_MON' | 'VAN_PHONG';
  employeeType: 'bgh' | 'giaovien' | 'nhanvien';
  description?: string;
}

export const CANONICAL_DEPARTMENTS: DepartmentDefinition[] = [
  {
    id: 'to-hoa-sinh-cn',
    name: 'Tổ Hóa - Sinh - CN',
    shortName: 'Tổ Hóa - Sinh - CN',
    type: 'CHUYEN_MON',
    employeeType: 'giaovien',
    description: 'Bộ môn Hóa học, Sinh học và Công nghệ',
  },
  {
    id: 'to-su-dia',
    name: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
    shortName: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
    type: 'CHUYEN_MON',
    employeeType: 'giaovien',
    description: 'Bộ môn Lịch sử, Địa lý, KT&PL, Thể dục và Giáo dục Quốc phòng An ninh',
  },
  {
    id: 'to-van-nn',
    name: 'Tổ Văn - Ngoại ngữ',
    shortName: 'Tổ Văn - Ngoại ngữ',
    type: 'CHUYEN_MON',
    employeeType: 'giaovien',
    description: 'Bộ môn Ngữ văn và Ngoại ngữ',
  },
  {
    id: 'to-toan-li-tin',
    name: 'Tổ Toán - Lí - Tin',
    shortName: 'Tổ Toán - Lí - Tin',
    type: 'CHUYEN_MON',
    employeeType: 'giaovien',
    description: 'Bộ môn Toán học, Vật lý và Tin học',
  },
  {
    id: 'to-van-phong',
    name: 'Tổ Văn phòng',
    shortName: 'Tổ Văn phòng',
    type: 'VAN_PHONG',
    employeeType: 'nhanvien',
    description: 'Bộ phận Kế toán, Văn thư, Thủ quỹ, Y tế và Thư viện',
  },
];

export const ALL_SCHOOL_DEPARTMENTS_WITH_BGH: DepartmentDefinition[] = [
  {
    id: 'ban-giam-hieu',
    name: 'Ban Giám hiệu',
    shortName: 'Ban Giám hiệu',
    type: 'BAN_GIAM_HIEU',
    employeeType: 'bgh',
    description: 'Lãnh đạo và Quản lý Nhà trường',
  },
  ...CANONICAL_DEPARTMENTS,
];

/**
 * Returns canonical department ID for any department name or alias
 */
export function getDepartmentId(deptNameOrId?: string, staffType?: string): string {
  if (!deptNameOrId) {
    if (staffType === 'nhanvien') return 'to-van-phong';
    if (staffType === 'bgh') return 'ban-giam-hieu';
    return 'to-toan-li-tin';
  }
  const clean = deptNameOrId.trim().toLowerCase();

  // 1. Direct Canonical ID exact matches (MUST check first!)
  if (clean === 'to-van-phong' || clean === 'van-phong' || clean === 'van_phong') return 'to-van-phong';
  if (clean === 'ban-giam-hieu' || clean === 'bgh' || clean === 'ban_giam_hieu') return 'ban-giam-hieu';
  if (clean === 'to-hoa-sinh-cn' || clean === 'hoa-sinh-cn' || clean === 'to-hoa-sinh') return 'to-hoa-sinh-cn';
  if (clean === 'to-toan-li-tin' || clean === 'to-toan-tin' || clean === 'toan-li-tin' || clean === 'toan-tin') return 'to-toan-li-tin';
  if (clean === 'to-van-nn' || clean === 'to-van-ngoai-ngu' || clean === 'van-nn' || clean === 'van-ngoai-ngu') return 'to-van-nn';
  if (clean === 'to-su-dia' || clean === 'su-dia' || clean === 'to-su-dia-ktpl') return 'to-su-dia';

  // 2. Exact or specific name matches: Office / Hành chính / Văn phòng
  if (
    clean.includes('văn phòng') ||
    clean.includes('van phong') ||
    clean.includes('hành chính') ||
    clean.includes('phục vụ') ||
    clean.includes('kế toán') ||
    clean.includes('thủ quỹ') ||
    clean.includes('văn thư') ||
    clean.includes('y tế') ||
    clean.includes('thư viện') ||
    clean.includes('thiết bị') ||
    clean.includes('bảo vệ') ||
    clean.includes('tạp vụ') ||
    staffType === 'nhanvien'
  ) {
    return 'to-van-phong';
  }

  // 3. Ban Giám hiệu
  if (
    clean.includes('giám hiệu') ||
    clean.includes('ban giám hiệu') ||
    clean === 'bgh' ||
    clean.includes('hiệu trưởng') ||
    staffType === 'bgh'
  ) {
    return 'ban-giam-hieu';
  }

  // 4. Tổ Hóa - Sinh - CN
  if (
    clean.includes('hóa') ||
    clean.includes('sinh') ||
    clean.includes('hoa - sinh') ||
    clean.includes('hóa học') ||
    clean.includes('sinh học')
  ) {
    return 'to-hoa-sinh-cn';
  }

  // 5. Tổ Toán - Lí - Tin
  if (
    clean.includes('toán') ||
    clean.includes('lí') ||
    clean.includes('lý') ||
    clean.includes('vật lý') ||
    clean.includes('vật lí') ||
    clean.includes('tin học') ||
    clean.includes('tin')
  ) {
    return 'to-toan-li-tin';
  }

  // 6. Tổ Văn - Ngoại ngữ
  if (
    clean.includes('ngoại ngữ') ||
    clean.includes('tiếng anh') ||
    clean.includes('tieng anh') ||
    clean.includes('ngoai ngu') ||
    clean.includes('ngữ văn') ||
    clean.includes('ngu van') ||
    clean === 'văn' ||
    clean === 'tổ văn' ||
    clean === 'van' ||
    clean.includes('văn - ngoại ngữ') ||
    clean.includes('văn-ngoại ngữ') ||
    clean.includes('van - ngoai ngu') ||
    clean.includes('van-ngoai-ngu')
  ) {
    if (!clean.includes('phòng') && !clean.includes('phong') && !clean.includes('thư') && !clean.includes('thu') && staffType !== 'nhanvien') {
      return 'to-van-nn';
    }
  }

  // 7. Tổ Sử - Địa - KT&PL - TD - AN
  if (
    clean.includes('sử') ||
    clean.includes('địa') ||
    clean.includes('kt&pl') ||
    clean.includes('kinh tế') ||
    clean.includes('pháp luật') ||
    clean.includes('qpan') ||
    clean.includes('gdqp') ||
    clean.includes('thể dục') ||
    clean.includes('gdtc') ||
    clean.includes('an ninh') ||
    /\ban\b/i.test(clean)
  ) {
    return 'to-su-dia';
  }

  // Fallback based on staff type
  if (staffType === 'nhanvien') return 'to-van-phong';
  if (staffType === 'bgh') return 'ban-giam-hieu';

  return deptNameOrId;
}

/**
 * Returns canonical department display name given an ID or name
 */
export function getDepartmentDisplayName(deptIdOrName?: string): string {
  const deptId = getDepartmentId(deptIdOrName);
  const found = ALL_SCHOOL_DEPARTMENTS_WITH_BGH.find((d) => d.id === deptId);
  return found ? found.name : deptIdOrName || 'Tổ Chuyên môn';
}

export const OFFICIAL_DEPARTMENTS: DepartmentType[] = [
  'Tổ Hóa - Sinh - CN',
  'Tổ Sử - Địa - KT&PL - TD - QPAN',
  'Tổ Văn - Ngoại ngữ',
  'Tổ Toán - Lí - Tin',
  'Tổ Văn phòng',
];

export const ALL_SCHOOL_DEPARTMENTS: DepartmentType[] = [
  'Ban Giám hiệu',
  'Tổ Hóa - Sinh - CN',
  'Tổ Sử - Địa - KT&PL - TD - QPAN',
  'Tổ Văn - Ngoại ngữ',
  'Tổ Toán - Lí - Tin',
  'Tổ Văn phòng',
];

export type PersonType = 'bgh' | 'giaovien' | 'nhanvien';

export type ScoreType = 'plus' | 'minus';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  personId: string;
  avatar?: string;
  position: string;
}

export interface StaffMember {
  id: string;
  code: string;
  name: string;
  type: PersonType;
  department: DepartmentType | string;
  departmentId?: string;
  department_id?: string;
  employee_id?: string;
  employee_type?: 'BGH' | 'GIAO_VIEN' | 'NHAN_VIEN' | string;
  is_active?: boolean;
  position: string;
  subject?: string;
  classAssigned?: string;
  phone: string;
  email: string;
  status: 'Đang công tác' | 'Nghỉ chế độ' | 'Tạm hoãn';
  baseScore: number;
  gender?: 'Nam' | 'Nữ';
  degree?: string; // Thạc sĩ, Đại học, Cử nhân, Cao đẳng, Trung cấp
  birthYear?: number;
  partyMember?: boolean;
  concurrentPosition?: string;
  hireYear?: number;
}

export interface KpiCriterion {
  id: string;
  code: string;
  group: string;
  name: string;
  targetRole: 'all' | 'bgh' | 'giaovien' | 'nhanvien';
  type: ScoreType;
  points: number;
  description: string;
  status: 'active' | 'inactive';
}

export interface KpiIncident {
  id: string;
  personId: string;
  personName: string;
  personType: PersonType;
  department: DepartmentType | string;
  department_id?: string;
  criterionId: string;
  criterionCode: string;
  criterionName: string;
  type: ScoreType;
  quantity: number;
  unitPoints: number;
  totalPoints: number;
  date: string; // YYYY-MM-DD
  month: number; // 1 - 12
  semester: 1 | 2;
  schoolYear: string;
  notes?: string;
  evidenceRef?: string;
  createdBy: string;
  createdAt: string;
}

export interface PersonKpiSummary {
  person: StaffMember;
  baseScore: number;
  totalPlus: number;
  totalMinus: number;
  finalScore: number;
  rank: 'Xuất sắc' | 'Tốt' | 'Hoàn thành' | 'Cần cố gắng';
  incidentsCount: number;
}

export type KpiRankLevel = 'Chưa hoàn thành' | 'Hoàn thành' | 'Hoàn thành tốt' | 'Hoàn thành xuất sắc';

export type TaskTrackingStatus =
  | 'Chưa thực hiện'
  | 'Đang thực hiện'
  | 'Đã hoàn thành'
  | 'Chờ kiểm tra'
  | 'Đã xác nhận'
  | 'Chưa đạt'
  | 'Quá hạn';

export interface CriterionScoreItem {
  criterionId: string;
  selfScore: number;
  deptScore?: number;
  bghScore?: number;
  isNa?: boolean;
  evidence?: string;
  progress?: number;
  status?: TaskTrackingStatus;
  result?: string;
  notes?: string;
  updatedAt?: string;
}

export type CompletionLevel =
  | 'Hoàn thành xuất sắc'
  | 'Hoàn thành tốt'
  | 'Hoàn thành'
  | 'Chưa hoàn thành'
  | 'Không thực hiện';

export type TrackingRecordStatus =
  | 'Đang theo dõi'
  | 'Chờ đánh giá'
  | 'Đã đánh giá'
  | 'Chờ xác nhận'
  | 'Đã chốt'
  | 'Đã tạo Phiếu KPI';

export interface TrackingItemDetail {
  criterionId: string;
  criterionCode?: string;
  criterionName: string;
  groupTitle: string;
  section: string;
  order: number;
  maxPoints: number;
  
  // Progress & Execution by Person
  progress: number; // 0 - 100
  completionLevel?: CompletionLevel;
  actualResult?: string;
  evidence?: string;
  selfNotes?: string;
  selfProposedScore?: number;
  
  // Level 1 TTCM Evaluation
  ttcmCompletionLevel?: CompletionLevel;
  ttcmProposedScore?: number;
  ttcmNotes?: string;
  ttcmEvaluatedAt?: string;
  
  // Level 2 BGH Evaluation
  bghCompletionLevel?: CompletionLevel;
  bghProposedScore?: number;
  bghNotes?: string;
  bghEvaluatedAt?: string;

  // Status for criterion
  status: TaskTrackingStatus;
}

export interface TaskTrackingRecord {
  id: string; // e.g. track-GV007-m09-2026
  staffId: string;
  staffCode: string;
  staffName: string;
  department: string;
  position: string;
  targetType: PersonType; // 'bgh' | 'giaovien' | 'nhanvien'
  
  month: number;
  year: number;
  schoolYear: string;
  
  // Evaluators selected when creating tracking period
  ttcmEvaluatorId?: string;
  ttcmEvaluatorName?: string;
  ttcmEvaluatorRole?: string;
  ttcmEvaluatorDepartment?: string;
  
  bghEvaluatorId?: string;
  bghEvaluatorName?: string;
  bghEvaluatorRole?: string;
  
  // snake_case aliases
  ttcm_evaluator_id?: string;
  ttcm_evaluator_name?: string;
  ttcm_evaluator_role?: string;
  ttcm_evaluator_department?: string;
  bgh_evaluator_id?: string;
  bgh_evaluator_name?: string;
  bgh_evaluator_role?: string;
  
  // Items detail per criterion
  items: Record<string, TrackingItemDetail>;
  
  status: TrackingRecordStatus;
  
  // Totals & stats
  totalCriteriaCount: number;
  completedCount: number;
  uncompletedCount: number;
  overallProgress: number; // 0 - 100
  
  // Lock information
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  
  // Generated KPI sheet link
  generatedKpiId?: string;
  kpiGeneratedAt?: string;
  kpiGeneratedBy?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // History audit log
  historyLogs?: Array<{
    timestamp: string;
    action: string;
    actorName: string;
    details?: string;
  }>;
}

export type EvaluationPeriod = 'ki1' | 'ki2' | 'canam' | 'thang';

export interface TeacherKpiEvaluation {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  department: string;
  department_id?: string;
  departmentId?: string;
  position: string;
  subject?: string;
  targetType: 'bgh' | 'giaovien' | 'nhanvien';
  schoolYear: string;
  semester?: 1 | 2;
  month?: number;
  year?: number;
  evaluationPeriod?: EvaluationPeriod;
  periodName?: string;
  evaluatorName?: string;
  evaluatorId?: string;
  evaluator_id?: string;
  evaluator_name?: string;
  evaluatorType?: 'BGH' | 'COUNCIL' | 'TTCM' | string;
  evaluator_type?: 'BGH' | 'COUNCIL' | 'TTCM' | string;
  evaluatorRole?: string;
  evaluator_role?: string;
  evaluationLevel?: 'CAP_BGH' | 'CAP_HOI_DONG' | 'CAP_TO' | string;
  evaluation_level?: 'CAP_BGH' | 'CAP_HOI_DONG' | 'CAP_TO' | string;
  
  // Tracking source linkage
  tracking_period_id?: string;
  tracking_evaluation_id?: string;
  trackingPeriodId?: string;
  trackingEvaluationId?: string;
  
  // 2-tier evaluators
  ttcmEvaluatorId?: string;
  ttcmEvaluatorName?: string;
  ttcmEvaluatorRole?: string;
  ttcmEvaluatorDepartment?: string;
  
  bghEvaluatorId?: string;
  bghEvaluatorName?: string;
  bghEvaluatorRole?: string;

  // 3-Tier Professional Evaluation Fields (THPT PHƯƠNG XÁ)
  // Tier 1: Cá nhân tự đánh giá
  personal_score?: number;
  personal_comment?: string;
  personal_evaluator_id?: string;
  personal_evaluator_name?: string;
  personal_evaluated_at?: string;
  personal_status?: 'not_started' | 'in_progress' | 'completed';
  selfComment?: string;

  // Tier 2: TTCM / Người phụ trách bộ phận đánh giá
  ttcm_score?: number;
  ttcm_comment?: string;
  ttcm_evaluator_id?: string;
  ttcm_evaluator_name?: string;
  ttcm_evaluator_role?: string;
  ttcm_evaluator_department?: string;
  ttcm_evaluated_at?: string;
  ttcm_status?: 'pending' | 'in_progress' | 'completed';
  deptComment?: string;
  department_score?: number;
  department_comment?: string;
  department_evaluator_id?: string;
  department_evaluator_name?: string;
  department_status?: 'pending' | 'in_progress' | 'completed';
  department_evaluated_at?: string;

  // Tier 3: Hiệu trưởng / Phó Hiệu trưởng Đánh giá & Duyệt
  bgh_score?: number;
  bgh_comment?: string;
  bgh_evaluator_id?: string;
  bgh_evaluator_name?: string;
  bgh_evaluator_role?: string;
  bgh_evaluated_at?: string;
  bgh_status?: 'pending' | 'in_progress' | 'completed';
  bghComment?: string;

  final_score?: number;
  evaluation_result?: string;

  // Audit evaluation history
  evaluation_history?: Array<{
    tier: 'Cá nhân' | 'TTCM' | 'Người phụ trách' | 'BGH' | 'Hội đồng';
    evaluatorId: string;
    evaluatorName: string;
    evaluatorRole?: string;
    score: number;
    comment?: string;
    timestamp: string;
    status: string;
  }>;

  final_rank?: string;

  scores: Record<string, CriterionScoreItem>;
  selfTotalScore: number;
  deptTotalScore?: number;
  bghTotalScore?: number;
  self_total_score?: number;
  dept_total_score?: number;
  ttcm_total_score?: number;
  bgh_total_score?: number;
  selfRank: KpiRankLevel | string;
  deptRank?: KpiRankLevel | string;
  bghRank?: KpiRankLevel | string;
  selfRankNote?: string;
  status: 'draft' | 'evaluating' | 'self_submitted' | 'dept_reviewed' | 'bgh_approved' | 'completed' | 'locked' | 'need_revision' | 'waiting_bgh';
  selfDate?: string;
  deptDate?: string;
  bghDate?: string;
  updatedAt: string;
  
  // Data Linkage & Snapshot fields (THPT Phương Xá KPI Requirement 6 & XIII)
  employee_id?: string;
  employee_code?: string;
  employee_name?: string;
  full_name?: string;
  job_position_id?: string;
  job_position_name?: string;
  department_name?: string;
  evaluator_department_id?: string;
  evaluator_department_name?: string;
  evaluation_period?: EvaluationPeriod;
  evaluation_month?: number;
  evaluation_year?: number;
  kpi_template_id?: string;
  kpi_template_version?: string;
  evaluation_id?: string;
  criteria_snapshot?: Array<{
    id: string;
    section: string;
    sectionTitle: string;
    order: number;
    content: string;
    maxPoints: number;
    groupTitle?: string;
  }>;
}

export type BackgroundPosition =
  | 'center center'
  | 'center top'
  | 'center bottom'
  | 'left center'
  | 'right center';

export interface HomepageBackground {
  id: string;
  file_name: string;
  file_path: string;
  image_url: string;
  position: BackgroundPosition;
  overlay_opacity: number; // 0 to 80 (default 30)
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at?: string;
}

export type SchoolUiElementId =
  | 'logo'
  | 'department_name'
  | 'school_name'
  | 'system_name'
  | 'slogan'
  | 'school_image';

export interface SchoolUiSettings {
  id: string; // 'active_settings'
  school_name: string;
  department_name: string;
  system_name: string;
  slogan: string;

  logo_url: string;
  school_image_url: string;
  header_background_url: string;

  // Header background options
  header_bg_type: 'solid' | 'gradient' | 'image';
  header_gradient_from: string;
  header_gradient_to: string;
  header_bg_opacity: number; // 0 - 100
  header_bg_brightness: number; // 50 - 150
  header_bg_blur: number; // 0 - 20

  // Theme colors
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_color: string;
  sidebar_color: string;
  button_color: string;

  // Dimensions & typography sizes (px)
  header_height: number;
  logo_size: number;
  school_image_size: number;
  school_name_font_size: number;
  department_font_size: number;
  slogan_font_size: number;

  // Reorderable layout
  elements_order: SchoolUiElementId[];

  // Visibility flags
  show_logo: boolean;
  show_department_name: boolean;
  show_school_name: boolean;
  show_system_name: boolean;
  show_slogan: boolean;
  show_school_image: boolean;
  show_header_background: boolean;

  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

// ==================== LEAVE REQUEST & MANAGEMENT TYPES ====================

export type LeaveTypeCode =
  | 'phep_nam'
  | 'viec_rieng_co_luong'
  | 'viec_rieng_khong_luong'
  | 'om_dau_bhxh'
  | 'thai_san'
  | 'cong_tac'
  | 'khac';

export interface LeaveTypeInfo {
  code: LeaveTypeCode;
  name: string;
  shortDesc: string;
  paidStatus: 'Có hưởng lương' | 'Không hưởng lương' | 'Hưởng chế độ BHXH';
  badgeColor: string;
}

export const LEAVE_TYPES: Record<LeaveTypeCode, LeaveTypeInfo> = {
  phep_nam: {
    code: 'phep_nam',
    name: 'Nghỉ phép năm',
    shortDesc: 'Nghỉ theo tiêu chuẩn ngày phép năm được cấp (12 - 14 ngày/năm)',
    paidStatus: 'Có hưởng lương',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  viec_rieng_co_luong: {
    code: 'viec_rieng_co_luong',
    name: 'Nghỉ việc riêng có hưởng lương',
    shortDesc: 'Kết hôn (3 ngày), con kết hôn (1 ngày), tang chế tứ thân phụ mẫu/vợ/chồng/con (3 ngày)',
    paidStatus: 'Có hưởng lương',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  viec_rieng_khong_luong: {
    code: 'viec_rieng_khong_luong',
    name: 'Nghỉ việc riêng không hưởng lương',
    shortDesc: 'Nghỉ giải quyết việc gia đình theo thỏa thuận với nhà trường',
    paidStatus: 'Không hưởng lương',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  om_dau_bhxh: {
    code: 'om_dau_bhxh',
    name: 'Nghỉ ốm đau / Khám chữa bệnh',
    shortDesc: 'Có giấy chỉ định, giấy ra viện hoặc giấy chứng nhận nghỉ việc hưởng BHXH',
    paidStatus: 'Hưởng chế độ BHXH',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  thai_san: {
    code: 'thai_san',
    name: 'Nghỉ thai sản / Chăm sóc con',
    shortDesc: 'Khám thai, sinh con, dưỡng sức sau sinh, hoặc nam CBGVNV có vợ sinh con',
    paidStatus: 'Hưởng chế độ BHXH',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  cong_tac: {
    code: 'cong_tac',
    name: 'Đi công tác / Tập huấn / Nhiệm vụ điều động',
    shortDesc: 'Tham gia hội nghị, tập huấn SGD, chấm thi, coi thi hoặc các hoạt động theo quyết định',
    paidStatus: 'Có hưởng lương',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  khac: {
    code: 'khac',
    name: 'Nghỉ vì lý do khác / Đột xuất',
    shortDesc: 'Các trường hợp đặc biệt khác có đơn giải trình cụ thể',
    paidStatus: 'Không hưởng lương',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export type LeaveSession = 'full' | 'morning' | 'afternoon';

export type LeaveRequestStatus =
  | 'draft'
  | 'pending_dept' // Chờ Tổ trưởng duyệt
  | 'pending_bgh'  // Chờ Ban Giám hiệu duyệt
  | 'approved'     // Đã phê duyệt hoàn tất
  | 'rejected'     // Bị từ chối
  | 'cancelled';   // Đã hủy bởi người làm đơn

export interface TeachingSubstitutePlan {
  id: string;
  date: string; // YYYY-MM-DD
  period: string; // Tiết 1, Tiết 2, Tiết 3, Tiết 4, Tiết 5...
  className: string; // 12A1, 10A3...
  subject: string; // Toán, Ngữ văn, Hóa học...
  substituteStaffId: string;
  substituteStaffName: string;
  lessonContent: string; // Nội dung bài dạy / Tiết PPCT
  status: 'pending' | 'accepted' | 'declined';
  notes?: string;
}

export interface LeaveRequest {
  id: string; // LEAVE-YYYYMMDD-XXX
  code: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  department: DepartmentType | string;
  position: string;
  targetType: PersonType; // 'bgh' | 'giaovien' | 'nhanvien'
  phone: string;
  email?: string;

  // Leave Details
  leaveType: LeaveTypeCode;
  leaveTypeLabel: string;
  startDate: string; // YYYY-MM-DD
  startSession: LeaveSession; // 'full' | 'morning' | 'afternoon'
  endDate: string; // YYYY-MM-DD
  endSession: LeaveSession;
  totalDays: number; // e.g. 0.5, 1, 2, 3...
  reason: string;
  addressDuringLeave?: string;
  emergencyPhone?: string;

  // Work handover & teaching substitute plans
  handoverStaffId?: string;
  handoverStaffName?: string;
  handoverContent?: string;
  substitutePlans?: TeachingSubstitutePlan[];

  // Attachments
  attachmentName?: string;
  attachmentUrl?: string;

  // Status & Multi-level Approvals
  status: LeaveRequestStatus;

  // Level 1: Tổ trưởng Chuyên môn / Tổ trưởng Văn phòng
  deptReviewerId?: string;
  deptReviewerName?: string;
  deptReviewStatus?: 'approved' | 'rejected' | 'pending';
  deptReviewNote?: string;
  deptReviewedAt?: string;

  // Level 2: Ban Giám hiệu (Hiệu trưởng / Phó Hiệu trưởng)
  bghReviewerId?: string;
  bghReviewerName?: string;
  bghReviewStatus?: 'approved' | 'rejected' | 'pending';
  bghReviewNote?: string;
  bghReviewedAt?: string;

  // Rejection reason
  rejectionReason?: string;
  rejectedByRole?: 'dept' | 'bgh';
  rejectedByName?: string;
  rejectedAt?: string;

  // Metadata
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface StaffLeaveQuotaSummary {
  staffId: string;
  staffCode: string;
  staffName: string;
  department: string;
  position: string;
  targetType: PersonType;
  year: number;
  totalAnnualQuota: number; // Tiêu chuẩn phép năm (12 ngày đối với GV/NV thông thường)
  usedAnnualDays: number; // Đã nghỉ phép năm
  remainingAnnualDays: number; // Còn lại
  usedPaidPersonalDays: number; // Việc riêng có lương
  usedUnpaidDays: number; // Việc riêng không lương
  usedSickDays: number; // Ốm đau BHXH
  usedMaternityDays: number; // Thai sản
  usedBusinessTripDays: number; // Công tác
  pendingDays: number; // Đang chờ duyệt
  totalLeavesCount: number; // Tổng số đơn
}

export interface DailySchedule {
  dayOfWeek: string; // 'HAI', 'BA', 'TƯ', 'NĂM', 'SÁU', 'BẢY', 'CN'
  date: string; // '28/9/2026'
  morningContent: string;
  afternoonContent: string;
  leadership: string;
}

export interface WeeklyWorkSchedule {
  id: string;
  weekNumber: number; // e.g. 4
  schoolYear: string; // e.g. "2026 - 2027"
  fromDate: string; // e.g. "28/9/2026"
  toDate: string; // e.g. "04/10/2026"
  dutyClass: string; // e.g. "10A4"
  dutyTeacher: string; // e.g. "Trần Quang Vinh"
  principalName: string; // e.g. "Tạ Duy Kiên"
  issueDate: string; // e.g. "Cẩm Khê, ngày 28 tháng 9 năm 2026"
  notes: string[];
  days: DailySchedule[];
  updatedAt?: string;
}

export interface DepartmentTaskDay {
  dayOfWeek: string; // 'Thứ Hai', 'Thứ Ba', ...
  date: string; // '28/9/2026'
  morningContent: string;
  afternoonContent: string;
  completionDate: string; // 'Ngày hoàn thành'
  leadershipReview: string;
  note: string;
}

export interface DepartmentWorkSchedule {
  id: string;
  schoolName: string; // 'TRƯỜNG THPT SƠN LƯƠNG'
  departmentName: string; // 'Tổ Toán - Lí - Tin'
  weekNumber: number; // e.g. 4
  fromDate: string; // '28/9/2026'
  toDate: string; // '04/10/2026'
  month: number; // 9
  year: number; // 2026
  days: DepartmentTaskDay[];
  updatedAt?: string;
}

export interface SchoolTaskDay {
  dayOfWeek: string; // 'Thứ Hai', 'Thứ Ba', ...
  date: string; // '28/9/2026'
  morningContent: string;
  afternoonContent: string;
  completionDate: string; // 'Ngày hoàn thành'
  leadershipReview: string;
  note: string;
}

export interface SchoolWorkSchedule {
  id: string;
  schoolName: string; // 'TRƯỜNG THPT SƠN LƯƠNG'
  titleName: string; // 'BGH GIAO VIỆC TOÀN TRƯỜNG' or target department/unit
  weekNumber: number; // e.g. 4
  fromDate: string; // '28/9/2026'
  toDate: string; // '04/10/2026'
  month: number; // 9
  year: number; // 2026
  days: SchoolTaskDay[];
  updatedAt?: string;
}



