import { Timestamp } from 'firebase/firestore';

export type NSP = {
  id: string; // Document ID from Firestore
  serviceNumber: string;
  fullName: string;
  institution: string;
  posting: string;
  isDisabled: boolean;
  createdDate: Timestamp;
  lastUpdatedDate: Timestamp;
  districtId: string;
  serviceYear: number;
  hasSubmittedThisMonth?: boolean; // New optional field
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
  nspServiceNumber: string;
}

export type DashboardStats = {
  totalNsps: number;
  submittedThisMonth: number;
  pendingThisMonth: number;
};
