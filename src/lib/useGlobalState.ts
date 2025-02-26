import { create } from "zustand";

interface GlobalState {
	globalBrightness: number | null;
	setGlobalBrightness: (value: number) => void;
	globalTemperature: number | null;
	setGlobalTemperature: (value: number) => void;
	globalPower: { state: number; id: string } | null;
	setGlobalPower: (value: number) => void;
}

export const useGlobalState = create<GlobalState>((set) => ({
	globalBrightness: null,
	setGlobalBrightness: (value) => {
		set(() => ({
			globalBrightness: value,
		}));
	},
	globalTemperature: null,
	setGlobalTemperature: (value) => {
		set(() => ({
			globalTemperature: value,
		}));
	},
	globalPower: null,
	setGlobalPower: (value) => {
		set(() => ({
			globalPower: {
				state: value,
				// We use this to force a re-render
				id: new Date().getTime().toString(),
			},
		}));
	},
}));
