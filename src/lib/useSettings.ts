import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsStore {
	globalSync: boolean;
	setGlobalSync: (value: boolean) => void;
}

export const useSettings = create<SettingsStore>()(
	persist(
		(set) => ({
			globalSync: true,
			setGlobalSync: (value) => {
				set({ globalSync: value });
			},
		}),
		{
			name: "settings-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
