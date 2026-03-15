import type { NSP } from './definitions';
import { Timestamp } from 'firebase/firestore';

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
const courses = ['Computer Science', 'Business Administration', 'Nursing', 'Civil Engineering', 'Political Science'];
const regions = ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central'];
const districts = ['Accra Metro', 'Kumasi Metro', 'Sekondi-Takoradi', 'Koforidua', 'Cape Coast'];

const generateMockNSPs = (count: number): Omit<NSP, 'id' | 'createdDate' | 'lastUpdatedDate' | 'districtId' | 'serviceYear' | 'isDisabled' | 'fullName'>[] => {
  const nsps: any[] = [];

  for (let i = 1; i <= count; i++) {
    const surname = lastNames[Math.floor(Math.random() * lastNames.length)];
    const otherNames = firstNames[Math.floor(Math.random() * firstNames.length)];
    const gender = ['Ama', 'Adwoa', 'Esi', 'Afia'].includes(otherNames) ? 'Female' : 'Male';

    nsps.push({
      email: `${surname.toLowerCase()}.${otherNames.toLowerCase()}@example.com`,
      nssNumber: `NSS${Math.floor(100000 + Math.random() * 900000)}`,
      surname,
      otherNames,
      institution: sampleInstitutions[Math.floor(Math.random() * sampleInstitutions.length)],
      courseOfStudy: courses[Math.floor(Math.random() * courses.length)],
      gender: gender,
      phone: `024${Math.floor(1000000 + Math.random() * 9000000)}`,
      residentialAddress: `${i + 100} ${surname} Street, ${districts[Math.floor(Math.random() * districts.length)]}`,
      gpsAddress: `GA-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      posting: samplePostings[Math.floor(Math.random() * samplePostings.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      district: districts[Math.floor(Math.random() * districts.length)],
      nextOfKinName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${surname}`,
      nextOfKinPhone: `055${Math.floor(1000000 + Math.random() * 9000000)}`,
      isEmployed: Math.random() > 0.8,
    });
  }
  return nsps;
};

export const mockNSPsForSeeding = generateMockNSPs(10);
