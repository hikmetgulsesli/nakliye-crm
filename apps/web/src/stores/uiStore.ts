import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  /** Masaustu: sidebar daraltilmis mi (icon-only) */
  sidebarCollapsed: boolean;
  /** Mobil: sidebar drawer acik mi (burger menu davranisi) */
  mobileSidebarOpen: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openModal: (modalName: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      activeModal: null,
      modalData: null,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

      setMobileSidebarOpen: (open) =>
        set({ mobileSidebarOpen: open }),

      openModal: (modalName, data = undefined) =>
        set({ activeModal: modalName, modalData: data ?? null }),

      closeModal: () =>
        set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'nakliye-crm-ui',
      // Yalniz tercih edilen ayarlari persist et — modal state'i tutmaya gerek yok
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
