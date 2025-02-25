import { fetch } from "@tauri-apps/plugin-http";

export interface PutKeylightStateArgs {
	hostname: string;
	payload: {
		on: number;
		brightness: number;
		temperature: number;
	};
}

export const putKeylightState = async (args: PutKeylightStateArgs) => {
	await fetch(`http://${args.hostname}:9123/elgato/lights`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Origin: "",
		},
		body: JSON.stringify({
			numberOfLights: 1,
			lights: [
				{
					on: args.payload.on,
					brightness: args.payload.brightness,
					temperature: args.payload.temperature,
				},
			],
		}),
	});
};
