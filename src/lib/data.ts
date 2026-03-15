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
  writeBatch,
  type Firestore,
  collectionGroup,
  Timestamp,
} from 'firebase/firestore';

// Assume a default district for now
const DISTRICT_ID = 'district1';

export async function fetchNsps(db: Firestore, queryString?: string, page: number = 1): Promise<{nsps: NSP[], total: number}> {
  const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');

  // 1. Fetch all NSPs
  const querySnapshot = await getDocs(personnelCol);
  let allNSPs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NSP));
  
  // 2. Enrich NSP data with submission status for the current month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const enrichedNSPs = await Promise.all(
    allNSPs.map(async (nsp) => {
      const submissionId = `${currentYear}-${currentMonth}`;
      const subDocRef = doc(db, `districts/${DISTRICT_ID}/personnel/${nsp.id}/submissions`, submissionId);
      const subDocSnap = await getDoc(subDocRef);
      return {
        ...nsp,
        hasSubmittedThisMonth: subDocSnap.exists(),
      };
    })
  );
  
  let filteredNSPs = enrichedNSPs;

  // 3. Filter if a search query is provided
  if (queryString) {
    const lowercasedQuery = queryString.toLowerCase();
    filteredNSPs = enrichedNSPs.filter(nsp => 
      nsp.fullName.toLowerCase().includes(lowercasedQuery) ||
      (nsp.id && nsp.id.toLowerCase().includes(lowercasedQuery)) ||
      nsp.serviceNumber.toLowerCase().includes(lowercasedQuery)
    );
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

    const personnelSnapshot = await getDocs(query(personnelCol, where('isDisabled', '==', false)));
    const totalNsps = personnelSnapshot.size;
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    let submittedThisMonth = 0;
    for (const nspDoc of personnelSnapshot.docs) {
        const submissionId = `${currentYear}-${currentMonth}`;
        const subDocRef = doc(db, `districts/${DISTRICT_ID}/personnel/${nspDoc.id}/submissions`, submissionId);
        const subDocSnap = await getDoc(subDocRef);
        if (subDocSnap.exists()) {
            submittedThisMonth++;
        }
    }
    
    return {
        totalNsps,
        submittedThisMonth,
        pendingThisMonth: totalNsps - submittedThisMonth,
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
  const personnelCol = collection(db, 'districts', DISTRICT_ID, 'personnel');
  const personnelSnap = await getDocs(personnelCol);
  const nsps = personnelSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NSP));
  
  const enrichedSubmissions: SubmissionWithNSP[] = [];

  for (const nsp of nsps) {
    const submissionId = `${year}-${month}`;
    const subDocRef = doc(db, `districts/${DISTRICT_ID}/personnel/${nsp.id}/submissions`, submissionId);
    const subDocSnap = await getDoc(subDocRef);
    
    if (subDocSnap.exists()) {
      const sub = subDocSnap.data() as Submission;
      enrichedSubmissions.push({
        ...sub,
        nspFullName: nsp.fullName,
        nspServiceNumber: nsp.serviceNumber
      });
    }
  }

  return enrichedSubmissions;
}

export async function isUserAdmin(db: Firestore, userId: string): Promise<boolean> {
  if (!userId) return false;
  const adminDocRef = doc(db, 'admins', userId);
  const adminDocSnap = await getDoc(adminDocRef);
  return adminDocSnap.exists();
}
