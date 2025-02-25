import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsStore {
	globalSync: boolean;
	setGlobalSync: (value: boolean) => void;
	hideOnFocusChanged: boolean;
	setHideOnFocusChanged: (value: boolean) => void;
}

export const useSettings = create<SettingsStore>()(
	persist(
		(set) => ({
			globalSync: true,
			setGlobalSync: (value) => {
				set({ globalSync: value });
			},
			hideOnFocusChanged: true,
			setHideOnFocusChanged: (value) => {
				set({ hideOnFocusChanged: value });
			},
		}),
		{
			name: "settings-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
