export interface LookupValue {
  id: number;
  category: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LookupCreateInput {
  category: string;
  value: string;
  sortOrder?: number;
}
