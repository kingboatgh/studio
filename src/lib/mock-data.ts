import type { NSP, Submission } from './definitions';

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

// Let's assume some are submitted for the current month
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();
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

export { mockNSPs, mockSubmissions, generateNspId };
