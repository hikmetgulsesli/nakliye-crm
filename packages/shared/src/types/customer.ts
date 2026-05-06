export interface Customer {
  id: number;
  companyName: string;
  contactName?: string | null;
  taxNumber?: string | null;
  taxOffice?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  transportModes?: string[] | null;
  serviceTypes?: string[] | null;
  incoterms?: string[] | null;
  direction?: string | null;
  originCountries?: string[] | null;
  destinationCountries?: string[] | null;
  source?: string | null;
  potential?: string | null;
  status: string;
  notes?: string | null;
  assignedUserId: number;
  assignedUser?: { id: number; fullName: string };
  lastContactDate?: string | null;
  lastQuoteDate?: string | null;
  createdById: number;
  createdBy?: { id: number; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateInput {
  companyName: string;
  contactName?: string;
  taxNumber?: string;
  taxOffice?: string;
  phone: string;
  email: string;
  address?: string;
  transportModes?: string[];
  serviceTypes?: string[];
  incoterms?: string[];
  direction?: string;
  originCountries?: string[];
  destinationCountries?: string[];
  source?: string;
  potential?: string;
  status?: string;
  notes?: string;
  assignedUserId: number;
  forceCreate?: boolean;
}

export interface CustomerUpdateInput {
  companyName?: string;
  contactName?: string;
  taxNumber?: string;
  taxOffice?: string;
  phone?: string;
  email?: string;
  address?: string;
  transportModes?: string[];
  serviceTypes?: string[];
  incoterms?: string[];
  direction?: string;
  originCountries?: string[];
  destinationCountries?: string[];
  source?: string;
  potential?: string;
  status?: string;
  notes?: string;
  assignedUserId?: number;
}
