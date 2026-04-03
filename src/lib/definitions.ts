import { Timestamp } from 'firebase/firestore';

export type AppUser = {
  id: string;
  email: string;
  fullName?: string;
  role: 'Admin' | 'User';
  status: 'Active' | 'Pending' | 'Rejected';
  createdAt?: Timestamp;
};

export type NSP = {
  id: string; // Document ID from Firestore (System ID)
  email: string;
  nssNumber: string;
  surname: string;
  otherNames: string;
  fullName: string; // Concatenation of surname and otherNames
  institution: string;
  courseOfStudy: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  residentialAddress: string;
  gpsAddress: string;
  posting: string; // Place of service
  region: string;
  district: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  isEmployed: boolean;
  isDisabled: boolean; // For soft delete
  createdDate: Timestamp;
  lastUpdatedDate: Timestamp;
  districtId: string; // Firebase district document ID
  serviceYear: number;
  hasSubmittedThisMonth?: boolean;
  year?: string;
  batch?: string;
};


export type Submission = {
  id: string; // Document ID
  nspId: string;
  month: number;
  year: number;
  timestamp: Timestamp;
  deskOfficerName?: string;
};

export type SubmissionWithNSP = Submission & {
  nspFullName: string;
  nspNssNumber: string;
  nspPosting?: string;
}

export type DashboardStats = {
  totalNsps: number;
  activeNsps: number;
  submittedThisMonth: number;
  pendingThisMonth: number;
};

export type StaffSubmissionStat = {
    officerName: string;
    submissionCount: number;
}

export type AuditLog = {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  details: Record<string, any>;
  timestamp: Timestamp;
};
