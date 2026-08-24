import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleCommandPalette: () => void;
}

const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      commandPaletteOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          }
        }
      }
    }
  )
);

export default useUiStore;
