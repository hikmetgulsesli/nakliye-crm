'use client';

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SALES_REP' | 'SALES_MANAGER' | 'OPERATIONS' | 'FINANCE' | 'VIEWER';
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  phone?: string;
  isActive?: boolean;
}

interface UseUsersOptions {
  search?: string;
  role?: string;
  status?: 'all' | 'active' | 'inactive';
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (options.search) params.set('search', options.search);
    if (options.role && options.role !== 'all') params.set('role', options.role);
    if (options.status && options.status !== 'all') params.set('status', options.status);
    return params.toString();
  };

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const response = await fetch(`/api/users?${queryString}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.search, options.role, options.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData: UserInput): Promise<User> => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create user');
    }

    const newUser = await response.json();
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = async (id: string, userData: Partial<UserInput>): Promise<User> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }

    const updatedUser = await response.json();
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? updatedUser : user))
    );
    return updatedUser;
  };

  const toggleUserStatus = async (id: string): Promise<void> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to toggle user status');
    }

    const result = await response.json();
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, isActive: result.user.isActive } : user
      )
    );
  };

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    toggleUserStatus,
    refetch: fetchUsers,
  };
}
