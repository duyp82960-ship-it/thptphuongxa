import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { StaffMember, KpiCriterion, KpiIncident, TeacherKpiEvaluation, UserAccount, TaskTrackingRecord, SchoolUiSettings, LeaveRequest, getDepartmentId } from '../types';
import { INITIAL_STAFF, INITIAL_CRITERIA, INITIAL_INCIDENTS, INITIAL_USERS, DEFAULT_SCHOOL_UI_SETTINGS } from '../mockData';
import { INITIAL_EVALUATIONS } from '../data/initialEvaluations';
import { INITIAL_LEAVE_REQUESTS } from '../data/initialLeaveRequests';

// Collection references
const STAFF_COLLECTION = 'staff';
const CRITERIA_COLLECTION = 'criteria';
const INCIDENTS_COLLECTION = 'incidents';
const EVALUATIONS_COLLECTION = 'evaluations';
const USERS_COLLECTION = 'users';
const CRITERIA_TEMPLATES_COLLECTION = 'criteria_templates';
const TRACKING_RECORDS_COLLECTION = 'tracking_records';
export const LEAVE_REQUESTS_COLLECTION = 'leave_requests';
export const SCHOOL_UI_SETTINGS_COLLECTION = 'school_ui_settings';
export const ACTIVE_UI_SETTINGS_ID = 'active_settings';


export interface DatabaseState {
  staffList: StaffMember[];
  criteriaList: KpiCriterion[];
  incidentsList: KpiIncident[];
  evaluationsList: TeacherKpiEvaluation[];
  trackingList: TaskTrackingRecord[];
  leaveRequestsList: LeaveRequest[];
  usersList: UserAccount[];
  isInitialized: boolean;
}

/**
 * Recursively remove/sanitize undefined values so Firestore doesn't reject writes
 */
export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForFirestore(item)) as any;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(val as Record<string, any>)) {
    const propVal = (val as Record<string, any>)[key];
    if (propVal !== undefined) {
      result[key] = sanitizeForFirestore(propVal);
    } else {
      result[key] = null;
    }
  }
  return result as T;
}

/**
 * Initializes Firestore on first run only if collections are completely empty.
 * Never overwrites or resets if any data exists.
 */
export async function initializeDatabaseIfNeeded(): Promise<DatabaseState> {
  try {
    // 1. Fetch existing Staff from Firestore
    const staffSnapshot = await getDocs(collection(db, STAFF_COLLECTION));
    let staffList: StaffMember[] = [];
    const staffToUpdateInDb: StaffMember[] = [];

    if (!staffSnapshot.empty) {
      staffList = staffSnapshot.docs.map((docSnap) => {
        const data = docSnap.data() as StaffMember;
        const isOfficeStaff =
          data.id?.startsWith('nv-') ||
          data.code?.startsWith('NV') ||
          data.type === 'nhanvien' ||
          data.employee_type === 'NHAN_VIEN' ||
          data.position?.toLowerCase().includes('kế toán') ||
          data.position?.toLowerCase().includes('văn thư') ||
          data.position?.toLowerCase().includes('y tế') ||
          data.position?.toLowerCase().includes('thư viện') ||
          data.position?.toLowerCase().includes('thủ quỹ');

        const deptId = isOfficeStaff
          ? 'to-van-phong'
          : getDepartmentId(data.department_id || data.departmentId || data.department, data.type);
        const deptName = isOfficeStaff ? 'Tổ Văn phòng' : data.department || 'Tổ Toán - Lí - Tin';
        const staffType = isOfficeStaff ? 'nhanvien' : data.type;
        const employeeType = isOfficeStaff ? 'NHAN_VIEN' : (data.employee_type || (data.type === 'bgh' ? 'BGH' : 'GIAO_VIEN'));

        const normalized: StaffMember = {
          ...data,
          department: deptName,
          department_id: deptId,
          departmentId: deptId,
          type: staffType,
          employee_type: employeeType,
          is_active: data.is_active !== undefined ? data.is_active : (data.status === 'Đang công tác'),
        };

        // If department was previously misassigned (e.g. to Tổ Văn - Ngoại ngữ), queue for database update
        if (isOfficeStaff && (data.department !== 'Tổ Văn phòng' || data.department_id !== 'to-van-phong')) {
          staffToUpdateInDb.push(normalized);
        }

        return normalized;
      });
    }

    // Persist any corrected staff back to Firestore
    if (staffToUpdateInDb.length > 0) {
      try {
        const batch = writeBatch(db);
        for (const s of staffToUpdateInDb) {
          batch.set(doc(db, STAFF_COLLECTION, s.id), sanitizeForFirestore(s), { merge: true });
        }
        await batch.commit();
        console.log(`Successfully migrated ${staffToUpdateInDb.length} office staff to Tổ Văn phòng in Firestore.`);
      } catch (err) {
        console.warn('Failed to commit office staff migration to Firestore:', err);
      }
    }

    // 2. Fetch existing Criteria from Firestore
    const criteriaSnapshot = await getDocs(collection(db, CRITERIA_COLLECTION));
    let criteriaList: KpiCriterion[] = [];
    if (!criteriaSnapshot.empty) {
      criteriaList = criteriaSnapshot.docs.map((docSnap) => docSnap.data() as KpiCriterion);
    }

    // 3. Fetch existing Incidents from Firestore
    const incidentsSnapshot = await getDocs(collection(db, INCIDENTS_COLLECTION));
    let incidentsList: KpiIncident[] = [];
    if (!incidentsSnapshot.empty) {
      incidentsList = incidentsSnapshot.docs.map((docSnap) => docSnap.data() as KpiIncident);
    }

    // 4. Fetch existing Evaluations from Firestore
    let evaluationsList: TeacherKpiEvaluation[] = [];
    try {
      const evalSnapshot = await getDocs(collection(db, EVALUATIONS_COLLECTION));
      if (!evalSnapshot.empty) {
        evaluationsList = evalSnapshot.docs.map((docSnap) => {
          const raw = docSnap.data();
          const data = { id: docSnap.id, ...raw } as TeacherKpiEvaluation;
          const matchingStaff = staffList.find((s) => s.id === data.staffId || s.code === data.staffCode);
          if (matchingStaff) {
            return {
              ...data,
              department: matchingStaff.department,
              position: data.position || matchingStaff.position,
              targetType: data.targetType || matchingStaff.type,
            };
          }
          return data;
        });
      }
    } catch (err) {
      console.warn('Error fetching evaluations from Firestore:', err);
    }

    // Merge with localStorage evaluations so recent evaluations are preserved
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_EVALUATIONS_KEY);
      if (cached) {
        const localList: TeacherKpiEvaluation[] = JSON.parse(cached);
        localList.forEach((localItem) => {
          const idx = evaluationsList.findIndex((e) => e.id === localItem.id);
          if (idx >= 0) {
            evaluationsList[idx] = { ...evaluationsList[idx], ...localItem };
          } else {
            evaluationsList.push(localItem);
          }
        });
      }
    } catch (cacheErr) {
      console.warn('Error reading evaluations cache:', cacheErr);
    }

    // 5. Fetch existing Users from Firestore
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    let usersList: UserAccount[] = [];
    if (!usersSnapshot.empty) {
      usersList = usersSnapshot.docs.map((docSnap) => docSnap.data() as UserAccount);
    }

    // 6. Fetch existing Tracking Records from Firestore
    const trackingSnapshot = await getDocs(collection(db, TRACKING_RECORDS_COLLECTION));
    let trackingList: TaskTrackingRecord[] = [];
    if (!trackingSnapshot.empty) {
      trackingList = trackingSnapshot.docs.map((docSnap) => docSnap.data() as TaskTrackingRecord);
    }

    // 7. Fetch existing Leave Requests from Firestore
    const leaveSnapshot = await getDocs(collection(db, LEAVE_REQUESTS_COLLECTION));
    let leaveRequestsList: LeaveRequest[] = [];
    if (!leaveSnapshot.empty) {
      leaveRequestsList = leaveSnapshot.docs.map((docSnap) => docSnap.data() as LeaveRequest);
    }

    // Check if initial seeding is needed (ONLY when database is completely empty on first launch)
    const isBrandNew = staffList.length === 0 && criteriaList.length === 0;

    if (isBrandNew) {
      console.log('Database is empty. Performing initial bootstrap once...');
      const batch = writeBatch(db);

      // Seed initial staff
      for (const s of INITIAL_STAFF) {
        batch.set(doc(db, STAFF_COLLECTION, s.id), sanitizeForFirestore(s));
      }
      // Seed initial criteria
      for (const c of INITIAL_CRITERIA) {
        batch.set(doc(db, CRITERIA_COLLECTION, c.id), sanitizeForFirestore(c));
      }
      // Seed initial incidents
      for (const inc of INITIAL_INCIDENTS) {
        batch.set(doc(db, INCIDENTS_COLLECTION, inc.id), sanitizeForFirestore(inc));
      }
      // Seed initial evaluations
      for (const ev of INITIAL_EVALUATIONS) {
        batch.set(doc(db, EVALUATIONS_COLLECTION, ev.id), sanitizeForFirestore(ev));
      }
      // Seed initial users
      for (const u of INITIAL_USERS) {
        batch.set(doc(db, USERS_COLLECTION, u.id), sanitizeForFirestore(u));
      }
      // Seed initial leave requests
      for (const lv of INITIAL_LEAVE_REQUESTS) {
        batch.set(doc(db, LEAVE_REQUESTS_COLLECTION, lv.id), sanitizeForFirestore(lv));
      }

      await batch.commit();

      staffList = INITIAL_STAFF;
      criteriaList = INITIAL_CRITERIA;
      incidentsList = INITIAL_INCIDENTS;
      evaluationsList = INITIAL_EVALUATIONS;
      usersList = INITIAL_USERS;
      leaveRequestsList = INITIAL_LEAVE_REQUESTS;
    } else {
      if (usersList.length === 0) {
        // If other collections existed but users collection was not created yet
        const batch = writeBatch(db);
        for (const u of INITIAL_USERS) {
          batch.set(doc(db, USERS_COLLECTION, u.id), sanitizeForFirestore(u));
        }
        await batch.commit();
        usersList = INITIAL_USERS;
      }
      if (leaveRequestsList.length === 0) {
        // If leave requests collection is not seeded yet, seed initial leave requests
        const batch = writeBatch(db);
        for (const lv of INITIAL_LEAVE_REQUESTS) {
          batch.set(doc(db, LEAVE_REQUESTS_COLLECTION, lv.id), sanitizeForFirestore(lv));
        }
        await batch.commit();
        leaveRequestsList = INITIAL_LEAVE_REQUESTS;
      }
    }

    return {
      staffList,
      criteriaList,
      incidentsList,
      evaluationsList,
      trackingList,
      leaveRequestsList,
      usersList,
      isInitialized: true,
    };
  } catch (error) {
    console.error('Error connecting to Firestore database:', error);
    return {
      staffList: INITIAL_STAFF,
      criteriaList: INITIAL_CRITERIA,
      incidentsList: INITIAL_INCIDENTS,
      evaluationsList: INITIAL_EVALUATIONS,
      trackingList: [],
      leaveRequestsList: INITIAL_LEAVE_REQUESTS,
      usersList: INITIAL_USERS,
      isInitialized: false,
    };
  }
}

// ==================== USERS CRUD OPERATIONS ====================

export async function dbUpdateUser(user: UserAccount): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.id);
  await setDoc(userRef, sanitizeForFirestore(user), { merge: true });
}

export async function dbSaveUser(user: UserAccount): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.id);
  await setDoc(userRef, sanitizeForFirestore(user));
}

// ==================== STAFF CRUD OPERATIONS ====================

export async function dbAddStaff(staff: StaffMember): Promise<void> {
  const staffRef = doc(db, STAFF_COLLECTION, staff.id);
  await setDoc(staffRef, sanitizeForFirestore(staff));
}

export async function dbUpdateStaff(staff: StaffMember): Promise<void> {
  const staffRef = doc(db, STAFF_COLLECTION, staff.id);
  await setDoc(staffRef, sanitizeForFirestore(staff), { merge: true });
}

export async function dbDeleteStaff(id: string): Promise<void> {
  const staffRef = doc(db, STAFF_COLLECTION, id);
  await deleteDoc(staffRef);
}

/**
 * Bulk writes with automatic chunking of 400 operations to never exceed Firestore's 500-op limit
 */
export async function dbBulkAddStaff(members: StaffMember[]): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < members.length; i += CHUNK_SIZE) {
    const chunk = members.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const m of chunk) {
      batch.set(doc(db, STAFF_COLLECTION, m.id), sanitizeForFirestore(m));
    }
    await batch.commit();
  }
}

// ==================== CRITERIA CRUD OPERATIONS ====================

export async function dbAddCriterion(criterion: KpiCriterion): Promise<void> {
  const critRef = doc(db, CRITERIA_COLLECTION, criterion.id);
  await setDoc(critRef, sanitizeForFirestore(criterion));
}

export async function dbUpdateCriterion(criterion: KpiCriterion): Promise<void> {
  const critRef = doc(db, CRITERIA_COLLECTION, criterion.id);
  await setDoc(critRef, sanitizeForFirestore(criterion), { merge: true });
}

export async function dbDeleteCriterion(id: string): Promise<void> {
  const critRef = doc(db, CRITERIA_COLLECTION, id);
  await deleteDoc(critRef);
}

// ==================== INCIDENTS CRUD OPERATIONS ====================

export async function dbAddIncident(incident: KpiIncident): Promise<void> {
  const incRef = doc(db, INCIDENTS_COLLECTION, incident.id);
  await setDoc(incRef, sanitizeForFirestore(incident));
}

export async function dbDeleteIncident(id: string): Promise<void> {
  const incRef = doc(db, INCIDENTS_COLLECTION, id);
  await deleteDoc(incRef);
}

// ==================== EVALUATIONS CRUD OPERATIONS ====================

export const LOCAL_STORAGE_EVALUATIONS_KEY = 'thpt_phuong_xa_evaluations_v2';

export async function dbSaveEvaluation(evalData: TeacherKpiEvaluation): Promise<void> {
  // 1. Immediately cache in localStorage for instant offline & reload resilience
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_EVALUATIONS_KEY);
    let list: TeacherKpiEvaluation[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex((e) => e.id === evalData.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...evalData };
    } else {
      list.unshift(evalData);
    }
    localStorage.setItem(LOCAL_STORAGE_EVALUATIONS_KEY, JSON.stringify(list));
  } catch (localErr) {
    console.warn('LocalStorage save warning:', localErr);
  }

  // 2. Persist to Firestore
  try {
    const evalRef = doc(db, EVALUATIONS_COLLECTION, evalData.id);
    await setDoc(evalRef, sanitizeForFirestore(evalData), { merge: true });
  } catch (firestoreErr) {
    console.error('Firestore saveEvaluation error:', firestoreErr);
    throw firestoreErr;
  }
}

export async function dbDeleteEvaluation(id: string): Promise<void> {
  const evalRef = doc(db, EVALUATIONS_COLLECTION, id);
  await deleteDoc(evalRef);
}

/**
 * Bulk delete evaluations using Firestore write batch with 400-op chunking
 */
export async function dbBulkDeleteEvaluations(ids: string[]): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, EVALUATIONS_COLLECTION, id));
    }
    await batch.commit();
  }
}

// ==================== CRITERIA TEMPLATES OPERATIONS ====================

export async function dbSaveCriteriaTemplate(
  targetType: string,
  criteria: any[],
  version: number
): Promise<void> {
  const tRef = doc(db, CRITERIA_TEMPLATES_COLLECTION, targetType);
  await setDoc(
    tRef,
    sanitizeForFirestore({
      targetType,
      criteria,
      version,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function dbFetchCriteriaTemplates(): Promise<
  Record<string, { targetType: string; criteria: any[]; version: number }>
> {
  try {
    const snap = await getDocs(collection(db, CRITERIA_TEMPLATES_COLLECTION));
    const result: Record<string, any> = {};
    if (!snap.empty) {
      snap.docs.forEach((d) => {
        result[d.id] = d.data();
      });
    }
    return result;
  } catch (err) {
    console.error('Error fetching criteria templates:', err);
    return {};
  }
}

// ==================== TRACKING RECORDS OPERATIONS ====================

export async function dbSaveTrackingRecord(record: TaskTrackingRecord): Promise<void> {
  const docRef = doc(db, TRACKING_RECORDS_COLLECTION, record.id);
  await setDoc(docRef, sanitizeForFirestore(record));
}

export async function dbDeleteTrackingRecord(id: string): Promise<void> {
  const docRef = doc(db, TRACKING_RECORDS_COLLECTION, id);
  await deleteDoc(docRef);
}

// ==================== SCHOOL UI SETTINGS OPERATIONS ====================

export async function dbFetchSchoolUiSettings(): Promise<SchoolUiSettings | null> {
  try {
    const docRef = doc(db, SCHOOL_UI_SETTINGS_COLLECTION, ACTIVE_UI_SETTINGS_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SchoolUiSettings;
    }
    // Also check if any doc exists in school_ui_settings collection
    const allSnap = await getDocs(collection(db, SCHOOL_UI_SETTINGS_COLLECTION));
    if (!allSnap.empty) {
      return allSnap.docs[0].data() as SchoolUiSettings;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching school_ui_settings from Firestore:', err);
    return null;
  }
}

export async function dbSaveSchoolUiSettings(settings: SchoolUiSettings): Promise<void> {
  const docRef = doc(db, SCHOOL_UI_SETTINGS_COLLECTION, ACTIVE_UI_SETTINGS_ID);
  const dataToSave = sanitizeForFirestore({
    ...settings,
    id: ACTIVE_UI_SETTINGS_ID,
    updated_at: new Date().toISOString(),
  });
  await setDoc(docRef, dataToSave, { merge: true });
}

export async function dbResetSchoolUiSettings(): Promise<SchoolUiSettings> {
  const resetConfig: SchoolUiSettings = {
    ...DEFAULT_SCHOOL_UI_SETTINGS,
    id: ACTIVE_UI_SETTINGS_ID,
    updated_at: new Date().toISOString(),
    updated_by: 'BGH',
  };
  await dbSaveSchoolUiSettings(resetConfig);
  return resetConfig;
}

// ==================== LEAVE REQUESTS OPERATIONS ====================

export async function dbSaveLeaveRequest(request: LeaveRequest): Promise<void> {
  const docRef = doc(db, LEAVE_REQUESTS_COLLECTION, request.id);
  await setDoc(docRef, sanitizeForFirestore(request), { merge: true });
}

export async function dbDeleteLeaveRequest(id: string): Promise<void> {
  const docRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function dbBulkDeleteLeaveRequests(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, LEAVE_REQUESTS_COLLECTION, id));
    }
    await batch.commit();
  }
}

export async function dbClearAllLeaveRequests(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, LEAVE_REQUESTS_COLLECTION));
    if (snapshot.empty) return;
    const CHUNK_SIZE = 400;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Error clearing leave_requests collection from Firestore:', err);
  }
}

export async function dbBulkAddLeaveRequests(requests: LeaveRequest[]): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
    const chunk = requests.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const r of chunk) {
      batch.set(doc(db, LEAVE_REQUESTS_COLLECTION, r.id), sanitizeForFirestore(r));
    }
    await batch.commit();
  }
}


