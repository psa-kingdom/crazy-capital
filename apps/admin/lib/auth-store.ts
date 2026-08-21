import { create } from 'zustand';
import { AuthUser, UserRole } from '@cc/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  selectedBranchId: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setSelectedBranchId: (branchId: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'u-super-admin-001',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@crazycapital.in',
    mobile: '9999999999',
    organizationId: 'org-cc-india-001',
    branchId: null,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      'lead.create',
      'lead.view',
      'lead.update',
      'lead.assign',
      'lead.delete',
      'customer.create',
      'customer.view',
      'customer.update',
      'user.manage',
    ],
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  token: typeof window !== 'undefined' ? localStorage.getItem('cc_access_token') : null,
  isAuthenticated: true,
  selectedBranchId: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cc_access_token', token);
    }
    set({ user, token, isAuthenticated: true });
  },
  setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cc_access_token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
