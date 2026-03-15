import type { NSP, Submission, DashboardStats, SubmissionWithNSP } from './definitions';
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
} from 'firebase/firestore';

// Assume a default district for now
const DISTRICT_ID = 'district1';

export async function fetchNsps(db: Firestore, options: { queryString?: string; page?: number; month?: number; year?: number }): Promise<{nsps: NSP[], total: number}> {
  const { queryString, month, year } = options;
  const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');

  // Fetch all personnel. We will filter client-side for simplicity in this function.
  // For a larger dataset, server-side filtering would be better.
  const nspSnapshot = await getDocs(personnelCol);
  let allNSPs = nspSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NSP));

  // If month and year are provided, enrich with submission status.
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

  // Filter if a search query is provided.
  if (queryString) {
    const lowercasedQuery = queryString.toLowerCase();
    filteredNSPs = allNSPs.filter(nsp => 
      nsp.fullName.toLowerCase().includes(lowercasedQuery) ||
      (nsp.id && nsp.id.toLowerCase().includes(lowercasedQuery)) ||
      nsp.serviceNumber.toLowerCase().includes(lowercasedQuery)
    );
  }
  
  // For the main registry view (no month/year), we show all users (active/inactive)
  // And sort them. For other views, we probably only want active ones.
  if (!month && !year) {
    // Show all, sort active first.
    filteredNSPs.sort((a, b) => (a.isDisabled === b.isDisabled) ? 0 : a.isDisabled ? 1 : -1);
  } else {
    // For views with submission status, only show active personnel
    filteredNSPs = filteredNSPs.filter(nsp => !nsp.isDisabled);
  }


  return { nsps: filteredNSPs, total: filteredNSPs.length };
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

    // Queries
    const allPersonnelQuery = getDocs(personnelCol);
    const activePersonnelQuery = getDocs(query(personnelCol, where('isDisabled', '==', false)));
    const submissionsQuery = getDocs(query(
        collectionGroup(db, 'submissions'),
        where('month', '==', currentMonth),
        where('year', '==', currentYear)
    ));

    // Run in parallel
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


export async function createNewNSP(db: Firestore, data: Omit<NSP, 'id' | 'createdDate' | 'lastUpdatedDate' | 'serviceYear' | 'isDisabled'> & { districtId: string }) {
    const newId = generateNspId();
    const personnelRef = doc(db, 'districts', data.districtId, 'personnel', newId);
    
    const newNspData = {
        ...data,
        id: newId,
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
    
    const updateData = {
        ...data,
        lastUpdatedDate: serverTimestamp(),
    };

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

export async function checkServiceNumberUniqueness(db: Firestore, serviceNumber: string, currentNspId?: string): Promise<boolean> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    const q = query(personnelCol, where('serviceNumber', '==', serviceNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return true; // Unique
    }

    if (currentNspId) {
        // If we are updating, it's ok if the number belongs to the current user.
        const isSelf = querySnapshot.docs.every(doc => doc.id === currentNspId);
        return isSelf;
    }
  
    return false; // Not unique
}

export async function fetchSubmissionsForMonth(db: Firestore, month: number, year: number): Promise<SubmissionWithNSP[]> {
  // 1. Fetch all submissions for the month/year
  const submissionsQuery = query(collectionGroup(db, 'submissions'), 
    where('month', '==', month),
    where('year', '==', year)
  );
  const submissionsSnapshot = await getDocs(submissionsQuery);
  const submissions = submissionsSnapshot.docs.map(doc => doc.data() as Submission);
  
  if (submissions.length === 0) return [];

  // 2. Fetch all personnel and create a lookup map
  const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
  const personnelSnap = await getDocs(personnelCol);
  const nspsMap = new Map<string, NSP>();
  personnelSnap.docs.forEach(doc => nspsMap.set(doc.id, { id: doc.id, ...doc.data() } as NSP));
  
  // 3. Join submissions with personnel data
  const enrichedSubmissions: SubmissionWithNSP[] = submissions.map(sub => {
    const nsp = nspsMap.get(sub.nspId);
    return {
      ...sub,
      nspFullName: nsp?.fullName ?? 'N/A',
      nspServiceNumber: nsp?.serviceNumber ?? 'N/A'
    };
  });

  return enrichedSubmissions;
}


export async function getMonthlySubmissionStats(db: Firestore, month: number, year: number): Promise<{ submitted: number, pending: number, total: number }> {
    const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
    
    // Queries
    const activePersonnelQuery = getDocs(query(personnelCol, where('isDisabled', '==', false)));
    const submissionsQuery = getDocs(query(
      collectionGroup(db, 'submissions'),
      where('month', '==', month),
      where('year', '==', year)
    ));
    
    // Run in parallel
    const [activePersonnelSnapshot, submissionsSnapshot] = await Promise.all([
      activePersonnelQuery,
      submissionsQuery
    ]);
    
    const totalActive = activePersonnelSnapshot.size;
    const submittedCount = submissionsSnapshot.size;
    
    return {
        submitted: submittedCount,
        pending: totalActive - submittedCount,
        total: totalActive,
    };
}


export async function isUserAdmin(db: Firestore, userId: string): Promise<boolean> {
  if (!userId) return false;
  const adminDocRef = doc(db, 'admins', userId);
  const adminDocSnap = await getDoc(adminDocRef);
  return adminDocSnap.exists();
}
