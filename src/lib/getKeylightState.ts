import { queryOptions } from "@tanstack/react-query";
import { fetch } from "@tauri-apps/plugin-http";

interface Response {
	numberOfLights: number;
	lights: {
		on: number;
		brightness: number;
		temperature: number;
	}[];
}

export type GetKeylightStateResponse = Response["lights"][0];

export const getKeylightState = async (args: {
	hostname: string;
	signal: AbortSignal;
}) => {
	const response = await fetch(`http://${args.hostname}:9123/elgato/lights`, {
		method: "GET",
		signal: args.signal,
		connectTimeout: 2000,
		headers: {
			Origin: "",
		},
	});

	if (!response.ok) {
		throw new Error(response.status.toString());
	}

	const json: Response = await response.json();

	return json.lights[0];
};

export function getKeylightStateQueryOptions(args: { hostname: string }) {
	return queryOptions<GetKeylightStateResponse>({
		queryKey: ["keylight-state", args.hostname],
		queryFn: (queryArgs) => {
			return getKeylightState({
				hostname: args.hostname,
				signal: queryArgs.signal,
			});
		},
		refetchInterval: 2000,
		retry: false,
		refetchOnWindowFocus: true,
	});
}
