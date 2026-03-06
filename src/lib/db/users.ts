import type { User } from '@/types';

// In-memory users for demo - in production this would be a database
const users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@example.com',
    full_name: 'Regular User',
    role: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function getAllUsers(): User[] {
  return users.filter(u => u.is_active);
}

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id && u.is_active);
}

export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email && u.is_active);
}
