import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type State = {
  isSyncEnabled: boolean;
};

type Action = {
  toggleSync: () => void;
};

export const useSettingsStore = create(
  persist<State & Action>(
    (set, get) => ({
      isSyncEnabled: false,
      toggleSync: () => {
        set((state) => ({ isSyncEnabled: !state.isSyncEnabled }));
      },
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
