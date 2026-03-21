import type { AppUser, NSP, Submission, DashboardStats, SubmissionWithNSP, StaffSubmissionStat, AuditLog } from './definitions';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  addDoc,
  type Firestore,
  collectionGroup,
  Timestamp,
  deleteDoc,
  orderBy,
  updateDoc,
} from 'firebase/firestore';

// Assume a default district for now
const DISTRICT_ID = 'district1';
const ITEMS_PER_PAGE = 30;

export async function fetchNsps(db: Firestore, options: { queryString?: string; page?: number; month?: number; year?: number }): Promise<{nsps: NSP[], totalPages: number}> {
  const { queryString, page = 1, month, year } = options;
  const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');

  const nspSnapshot = await getDocs(personnelCol);
  let allNSPs = nspSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NSP));

  if (month && year) {
    const submissionsQuery = query(collectionGroup(db, 'submissions'), 
      where('month', '==', month),
      where('year', '==', year)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submittedNspIds = new Set(submissionsSnapshot.docs.map(doc => doc.data().nspId));
    
    allNSPs = allNSPs.map(nsp => ({
      ...nsp,
      hasSubmittedThisMonth: submittedNspIds.has(nsp.id),
    }));
  }
  
  let filteredNSPs = allNSPs;

  if (queryString) {
    const lowercasedQuery = queryString.toLowerCase();
    filteredNSPs = allNSPs.filter(nsp => 
      (nsp.fullName && nsp.fullName.toLowerCase().includes(lowercasedQuery)) ||
      (nsp.id && nsp.id.toLowerCase().includes(lowercasedQuery)) ||
      (nsp.nssNumber && nsp.nssNumber.toLowerCase().includes(lowercasedQuery)) ||
      (nsp.email && nsp.email.toLowerCase().includes(lowercasedQuery))
    );
  }
  
  if (!month && !year) {
    // Default sort for registry page: inactive last
    filteredNSPs.sort((a, b) => (a.isDisabled === b.isDisabled) ? 0 : a.isDisabled ? 1 : -1);
  } else {
    // For submission/report views, only show active personnel
    filteredNSPs = filteredNSPs.filter(nsp => !nsp.isDisabled);
  }

  const totalPages = Math.ceil(filteredNSPs.length / ITEMS_PER_PAGE);
  const paginatedNSPs = filteredNSPs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return { nsps: paginatedNSPs, totalPages: totalPages };
}


export async function fetchNspById(db: Firestore, id: string): Promise<NSP | undefined> {
    const docRef = doc(db, 'districts', DISTRICT_ID, 'personnel', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NSP;
    } else {
        return undefined;
    }
}

export async function getDashboardStats(db: Firestore): Promise<DashboardStats> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const allPersonnelQuery = getDocs(personnelCol);
    const activePersonnelQuery = getDocs(query(personnelCol, where('isDisabled', '==', false)));
    const submissionsQuery = getDocs(query(
        collectionGroup(db, 'submissions'),
        where('month', '==', currentMonth),
        where('year', '==', currentYear)
    ));

    const [allPersonnelSnapshot, activePersonnelSnapshot, submissionsSnapshot] = await Promise.all([
        allPersonnelQuery,
        activePersonnelQuery,
        submissionsQuery
    ]);

    const totalNsps = allPersonnelSnapshot.size;
    const activeNsps = activePersonnelSnapshot.size;
    const submittedThisMonth = submissionsSnapshot.size;

    return {
        totalNsps,
        activeNsps,
        submittedThisMonth,
        pendingThisMonth: activeNsps - submittedThisMonth,
    };
}


export async function createNewNSP(db: Firestore, data: Omit<NSP, 'id' | 'createdDate' | 'lastUpdatedDate' | 'serviceYear' | 'isDisabled' | 'fullName'>) {
    const newId = generateNspId();
    const personnelRef = doc(db, 'districts', data.districtId, 'personnel', newId);

    const fullName = `${data.surname} ${data.otherNames}`;
    
    const newNspData = {
        ...data,
        id: newId,
        fullName,
        isDisabled: false,
        serviceYear: new Date().getFullYear(),
        createdDate: serverTimestamp(),
        lastUpdatedDate: serverTimestamp(),
    };
    
    await setDoc(personnelRef, newNspData);
    return { ...newNspData, id: newId, createdDate: Timestamp.now(), lastUpdatedDate: Timestamp.now() } as NSP;
}

function generateNspId() {
  const prefix = 'LDM';
  const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${randomNumber}`;
}

export async function updateNSP(db: Firestore, id: string, data: Partial<Omit<NSP, 'id'>>) {
    if (!data.districtId) {
        throw new Error("District ID is required to update NSP record.");
    }
    const docRef = doc(db, 'districts', data.districtId, 'personnel', id);
    
    const updateData: Partial<NSP> = { ...data };
    if (data.surname || data.otherNames) {
        const currentDoc = await getDoc(docRef);
        const currentData = currentDoc.data() as NSP;
        const surname = data.surname ?? currentData.surname;
        const otherNames = data.otherNames ?? currentData.otherNames;
        updateData.fullName = `${surname} ${otherNames}`;
    }

    updateData.lastUpdatedDate = serverTimestamp() as any;

    await setDoc(docRef, updateData, { merge: true });
}

export async function createSubmission(db: Firestore, districtId: string, nspId: string, month: number, year: number, officerName: string) {
    const submissionPath = `/districts/${districtId}/personnel/${nspId}/submissions`;
    
    const submissionId = `${year}-${month}`;
    const submissionRef = doc(db, submissionPath, submissionId);

    const docSnap = await getDoc(submissionRef);

    if (docSnap.exists()) {
        throw new Error('Submission for this month already exists.');
    }

    const newSubmission = {
        id: submissionId,
        nspId,
        month,
        year,
        timestamp: serverTimestamp(),
        deskOfficerName: officerName,
    };
    await setDoc(submissionRef, newSubmission);
}

export async function checkNssNumberUniqueness(db: Firestore, nssNumber: string, currentNspId?: string): Promise<boolean> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    const q = query(personnelCol, where('nssNumber', '==', nssNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return true; // Unique
    }

    if (currentNspId) {
        const isSelf = querySnapshot.docs.every(doc => doc.id === currentNspId);
        return isSelf;
    }
  
    return false; // Not unique
}

export async function fetchSubmissionsForMonth(db: Firestore, month: number, year: number): Promise<SubmissionWithNSP[]> {
  const submissionsQuery = query(collectionGroup(db, 'submissions'), 
    where('month', '==', month),
    where('year', '==', year)
  );
  const submissionsSnapshot = await getDocs(submissionsQuery);
  const submissions = submissionsSnapshot.docs.map(doc => doc.data() as Submission);
  
  if (submissions.length === 0) return [];

  const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
  const personnelSnap = await getDocs(personnelCol);
  const nspsMap = new Map<string, NSP>();
  personnelSnap.docs.forEach(doc => nspsMap.set(doc.id, { id: doc.id, ...doc.data() } as NSP));
  
  const enrichedSubmissions: SubmissionWithNSP[] = submissions.map(sub => {
    const nsp = nspsMap.get(sub.nspId);
    return {
      ...sub,
      nspFullName: nsp?.fullName ?? 'N/A',
      nspNssNumber: nsp?.nssNumber ?? 'N/A'
    };
  });

  return enrichedSubmissions;
}


export async function getReportStats(db: Firestore, month: number, year: number): Promise<{ active: number, submitted: number, pending: number }> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    
    const activePersonnelQuery = getDocs(query(personnelCol, where('isDisabled', '==', false)));
    const submissionsQuery = getDocs(query(
      collectionGroup(db, 'submissions'),
      where('month', '==', month),
      where('year', '==', year)
    ));
    
    const [activePersonnelSnapshot, submissionsSnapshot] = await Promise.all([
      activePersonnelQuery,
      submissionsQuery
    ]);
    
    const totalActive = activePersonnelSnapshot.size;
    const submittedCount = submissionsSnapshot.size;
    
    return {
        active: totalActive,
        submitted: submittedCount,
        pending: totalActive - submittedCount,
    };
}


export async function isUserAdmin(db: Firestore, userId: string): Promise<boolean> {
  if (!userId) return false;
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    return userData.role === 'Admin' && userData.status === 'Active';
  }
  return false;
}

export async function exportNspRegistry(db: Firestore): Promise<NSP[]> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    const snapshot = await getDocs(personnelCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NSP));
}

export async function exportSubmittedOrPending(db: Firestore, month: number, year: number, submitted: boolean | undefined): Promise<NSP[]> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    const activePersonnelQuery = query(personnelCol, where('isDisabled', '==', false));
    const nspsSnap = await getDocs(activePersonnelQuery);
    const activeNsps = nspsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NSP));

    const submissionsQuery = query(collectionGroup(db, 'submissions'), 
      where('month', '==', month),
      where('year', '==', year)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submittedNspIds = new Set(submissionsSnapshot.docs.map(doc => doc.data().nspId));
    
    if (submitted === undefined) { // For monthly report, return all with status
        return activeNsps.map(nsp => ({
            ...nsp,
            hasSubmittedThisMonth: submittedNspIds.has(nsp.id),
        }));
    }

    if (submitted) {
        return activeNsps.filter(nsp => submittedNspIds.has(nsp.id));
    } else {
        return activeNsps.filter(nsp => !submittedNspIds.has(nsp.id));
    }
}

export async function getStaffSubmissionStats(db: Firestore, month: number, year: number): Promise<StaffSubmissionStat[]> {
    const submissionsQuery = query(collectionGroup(db, 'submissions'),
        where('month', '==', month),
        where('year', '==', year)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);
    
    const statsMap = new Map<string, number>();

    submissionsSnapshot.docs.forEach(doc => {
        const data = doc.data() as Submission;
        const officerName = data.deskOfficerName || 'Unknown';
        statsMap.set(officerName, (statsMap.get(officerName) || 0) + 1);
    });

    return Array.from(statsMap, ([officerName, submissionCount]) => ({
        officerName,
        submissionCount,
    })).sort((a, b) => b.submissionCount - a.submissionCount);
}

// --- Admin Data Functions ---

export async function createAuditLog(db: Firestore, admin: { uid: string; email?: string | null }, action: string, details: Record<string, any>) {
  const auditCol = collection(db, 'auditLogs');
  await addDoc(auditCol, {
    adminId: admin.uid,
    adminEmail: admin.email || 'Unknown',
    action,
    details,
    timestamp: serverTimestamp(),
  });
}

export async function deleteNspPermanently(db: Firestore, districtId: string, nspId: string, adminUser: {uid: string, email?: string | null}) {
  if (!adminUser) throw new Error("Admin user is required for this action.");

  const nspDocRef = doc(db, 'districts', districtId, 'personnel', nspId);
  
  const nspDoc = await getDoc(nspDocRef);
  if (!nspDoc.exists()) {
      console.warn(`Attempted to delete non-existent NSP record: ${nspId}`);
      return;
  }
  const nspData = nspDoc.data() as NSP;

  const submissionsColRef = collection(db, 'districts', districtId, 'personnel', nspId, 'submissions');

  // Delete all submissions in the subcollection
  const submissionsSnapshot = await getDocs(submissionsColRef);
  const deletePromises = submissionsSnapshot.docs.map(subDoc => deleteDoc(subDoc.ref));
  await Promise.all(deletePromises);
  
  // Delete the main NSP document
  await deleteDoc(nspDocRef);

  // Create an audit log
  await createAuditLog(db, adminUser, 'PERMANENTLY_DELETED_NSP', { 
    nspId: nspId,
    nspName: nspData.fullName,
    nssNumber: nspData.nssNumber,
  });
}

export async function fetchAuditLogs(db: Firestore): Promise<AuditLog[]> {
    const logsCol = collection(db, 'auditLogs');
    const q = query(logsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
}

export async function deleteAuditLog(db: Firestore, logId: string) {
    const logDocRef = doc(db, 'auditLogs', logId);
    await deleteDoc(logDocRef);
}

export async function deleteAllPersonnel(db: Firestore, adminUser: {uid: string, email?: string | null}) {
    if (!adminUser) throw new Error("Admin user is required for this action.");
    
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    const nspsSnapshot = await getDocs(personnelCol);

    for (const nspDoc of nspsSnapshot.docs) {
        // For each NSP, delete their submissions subcollection, then the NSP doc itself.
        const submissionsColRef = collection(nspDoc.ref, 'submissions');
        const submissionsSnapshot = await getDocs(submissionsColRef);
        const deleteSubmissionsPromises = submissionsSnapshot.docs.map(subDoc => deleteDoc(subDoc.ref));
        await Promise.all(deleteSubmissionsPromises);
        await deleteDoc(nspDoc.ref);
    }

    await createAuditLog(db, adminUser, 'CLEARED_ALL_NSP_RECORDS', { deletedCount: nspsSnapshot.size });
}

export async function updateUserProfile(db: Firestore, uid: string, data: { fullName: string }) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
}

export async function fetchPendingUsers(db: Firestore): Promise<AppUser[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('status', '==', 'Pending'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AppUser));
}

export async function updateUserStatus(db: Firestore, userId: string, newStatus: 'Active' | 'Rejected', adminUser: {uid: string, email?: string | null}) {
    if (!adminUser) throw new Error("Admin user is required for this action.");

    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
        throw new Error("User not found.");
    }

    const userData = userDocSnap.data() as AppUser;

    await updateDoc(userDocRef, { status: newStatus });
    
    await createAuditLog(db, adminUser, `USER_${newStatus.toUpperCase()}`, {
        targetUserId: userId,
        targetUserEmail: userData.email,
        targetUserName: userData.fullName || 'Not Provided',
        targetUserRole: userData.role || 'User',
    });
}

export async function fetchAllUsers(db: Firestore): Promise<AppUser[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy('email', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AppUser));
}

export async function deleteUserAccount(db: Firestore, userId: string, adminUser: {uid: string, email?: string | null}) {
    if (!adminUser) throw new Error("Admin user is required for this action.");

    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
        throw new Error("User not found.");
    }

    const userData = userDocSnap.data() as AppUser;

    await deleteDoc(userDocRef);
    await createAuditLog(db, adminUser, `USER_DELETED`, {
        targetUserId: userId,
        targetUserEmail: userData.email,
        targetUserName: userData.fullName || 'Not Provided',
        targetUserRole: userData.role || 'User',
    });
}
