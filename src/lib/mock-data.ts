import type { NSP, Submission } from './definitions';
import { Timestamp } from 'firebase/firestore';

// This file is now for reference and seeding, but not directly used by the data.ts functions.

let lastId = 6000;
export const generateNspId = () => {
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

const generateMockNSPs = (count: number): Omit<NSP, 'id'>[] => {
  const nsps: Omit<NSP, 'id'>[] = [];
  const currentTimestamp = Timestamp.now();

  for (let i = 1; i <= count; i++) {
    nsps.push({
      serviceNumber: `NSS${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      institution: sampleInstitutions[Math.floor(Math.random() * sampleInstitutions.length)],
      posting: samplePostings[Math.floor(Math.random() * samplePostings.length)],
      isDisabled: false,
      createdDate: currentTimestamp,
      lastUpdatedDate: currentTimestamp,
      districtId: 'district1',
      serviceYear: new Date().getFullYear(),
    });
  }
  return nsps;
};

export const mockNSPsForSeeding = generateMockNSPs(10);
