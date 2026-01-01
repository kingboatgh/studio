import { NSP, Submission, DashboardStats } from './definitions';
import { mockNSPs, mockSubmissions, generateNspId } from './mock-data';

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

// In a real app, this would query Firestore
export async function fetchNsps(query?: string, page: number = 1): Promise<{nsps: NSP[], total: number}> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  let filteredNSPs = mockNSPs;
  if (query) {
    const lowercasedQuery = query.toLowerCase();
    filteredNSPs = mockNSPs.filter(nsp => 
      nsp.fullName.toLowerCase().includes(lowercasedQuery) ||
      nsp.id.toLowerCase().includes(lowercasedQuery) ||
      nsp.serviceNumber.toLowerCase().includes(lowercasedQuery)
    );
  }

  return { nsps: filteredNSPs, total: filteredNSPs.length };
}

export async function fetchNspById(id: string): Promise<NSP | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockNSPs.find(nsp => nsp.id === id);
}

export async function getDashboardStats(): Promise<DashboardStats> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const totalNsps = mockNSPs.filter(n => n.status === 'active').length;
    const submittedThisMonth = mockSubmissions.filter(s => s.month === currentMonth && s.year === currentYear).length;
    return {
        totalNsps,
        submittedThisMonth,
        pendingThisMonth: totalNsps - submittedThisMonth,
    };
}

export async function getSubmissionsForNSP(nspId: string): Promise<Submission[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockSubmissions.filter(s => s.nspId === nspId);
}

export async function createNewNSP(data: Omit<NSP, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<NSP> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newNsp: NSP = {
        id: generateNspId(),
        ...data,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockNSPs.unshift(newNsp);
    return newNsp;
}

export async function updateNSP(id: string, data: Partial<Omit<NSP, 'id'>>): Promise<NSP> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const nspIndex = mockNSPs.findIndex(n => n.id === id);
    if (nspIndex === -1) throw new Error('NSP not found');

    mockNSPs[nspIndex] = { ...mockNSPs[nspIndex], ...data, updatedAt: new Date().toISOString() };
    return mockNSPs[nspIndex];
}

export async function createSubmission(nspId: string, month: number, year: number, officerName: string): Promise<Submission> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const existing = mockSubmissions.find(s => s.nspId === nspId && s.month === month && s.year === year);
    if (existing) {
        throw new Error('Submission for this month already exists.');
    }

    const newSubmission: Submission = {
        id: `sub_${mockSubmissions.length + 1}`,
        nspId,
        month,
        year,
        submittedAt: new Date().toISOString(),
        officerName,
    };
    mockSubmissions.push(newSubmission);
    return newSubmission;
}

export async function checkServiceNumberUniqueness(serviceNumber: string, currentNspId?: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const foundNSP = mockNSPs.find(n => n.serviceNumber === serviceNumber);
  if (!foundNSP) return true; // Unique
  if (currentNspId && foundNSP.id === currentNspId) return true; // It's the same record being edited
  return false; // Not unique
}
