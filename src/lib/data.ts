import { NSP, Submission, DashboardStats } from './definitions';

// Function to generate a zero-padded ID
let lastId = 6000;
const generateNspId = () => {
  lastId++;
  return `LDM${lastId.toString().padStart(4, '0')}`;
};

const sampleInstitutions = [
  'University of Ghana',
  'KNUST',
  'University of Cape Coast',
  'Accra Technical University',
  'Koforidua Technical University',
];
const samplePostings = [
  'District Assembly',
  'Ghana Education Service',
  'Ministry of Health',
  'Ghana Revenue Authority',
  'Local Government Office',
];
const firstNames = ['Kwame', 'Ama', 'Kofi', 'Adwoa', 'Yaw', 'Esi', 'Kwadwo', 'Afia'];
const lastNames = ['Nkrumah', 'Adu', 'Mensah', 'Osei', 'Boateng', 'Asante', 'Yeboah'];

const generateMockNSPs = (count: number): NSP[] => {
  const nsps: NSP[] = [];
  for (let i = 1; i <= count; i++) {
    const createdAt = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString();
    nsps.push({
      id: `LDM${(6000 + i).toString().padStart(4, '0')}`,
      serviceNumber: `NSS${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      institution: sampleInstitutions[Math.floor(Math.random() * sampleInstitutions.length)],
      posting: samplePostings[Math.floor(Math.random() * samplePostings.length)],
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });
  }
  return nsps;
};

const mockNSPs: NSP[] = generateMockNSPs(50);

const mockSubmissions: Submission[] = [];
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

// Let's assume some are submitted for the current month
for (let i = 0; i < 20; i++) {
    mockSubmissions.push({
        id: `sub_${i}`,
        nspId: mockNSPs[i].id,
        month: currentMonth,
        year: currentYear,
        submittedAt: new Date().toISOString(),
        officerName: 'Desk Officer 1',
    });
}


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
