export type NSP = {
  id: string; // LDM0001
  serviceNumber: string;
  fullName: string;
  institution: string;
  posting: string;
  status: 'active' | 'inactive';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

export type Submission = {
  id: string;
  nspId: string;
  month: number;
  year: number;
  submittedAt: string; // ISO date string
  officerName?: string;
};

export type DashboardStats = {
  totalNsps: number;
  submittedThisMonth: number;
  pendingThisMonth: number;
};
