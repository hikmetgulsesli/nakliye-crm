export interface Activity {
  id: number;
  customerId: number;
  customer?: { id: number; companyName: string };
  activityType: string;
  activityDate: string;
  durationMinutes?: number | null;
  notes?: string | null;
  outcome?: string | null;
  nextActionDate?: string | null;
  createdById: number;
  createdBy?: { id: number; fullName: string };
  createdAt: string;
}

export interface ActivityCreateInput {
  customerId: number;
  activityType: string;
  activityDate: string;
  durationMinutes?: number;
  notes?: string;
  outcome?: string;
  nextActionDate?: string;
}
