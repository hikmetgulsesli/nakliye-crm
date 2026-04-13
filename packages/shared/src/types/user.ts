export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  phone?: string;
}

export interface UserUpdateInput {
  email?: string;
  fullName?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
  phone?: string;
  avatarUrl?: string;
}
