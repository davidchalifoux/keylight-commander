import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface KeylightsStore {
	keylights: string[];
	setKeylights: (keylights: string[]) => void;
	removeKeylight: (keylight: string) => void;
}

export const useKeylights = create<KeylightsStore>()(
	persist(
		(set) => ({
			keylights: [],
			setKeylights: (keylights) => {
				set({ keylights });
			},
			removeKeylight: (keylight) => {
				set((state) => ({
					keylights: state.keylights.filter((item) => item !== keylight),
				}));
			},
		}),
		{
			name: "keylights-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
