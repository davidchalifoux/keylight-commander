import { queryOptions } from "@tanstack/react-query";
import { fetch } from "@tauri-apps/plugin-http";

export interface GetKeylightConfigResponse {
	productName: string;
	hardwareBoardType: number;
	hardwareRevision: string;
	macAddress: string;
	firmwareBuildNumber: number;
	firmwareVersion: string;
	serialNumber: string;
	displayName: string;
	features: string[];
	"wifi-info": {
		ssid: string;
		frequencyMHz: number;
		rssi: number;
	};
	"bt-info": {
		broadcastMode: number;
		pairing: boolean;
		paired: boolean;
	};
}

export const getKeylightConfig = async (args: {
	hostname: string;
	signal?: AbortSignal;
}) => {
	const response = await fetch(
		`http://${args.hostname}:9123/elgato/accessory-info`,
		{
			method: "GET",
			signal: args.signal,
			connectTimeout: 2000,
			headers: {
				Origin: "",
			},
		},
	);

	if (!response.ok) {
		console.log(response);
		throw new Error(response.status.toString());
	}

	const json: GetKeylightConfigResponse = await response.json();

	return json;
};

export function getKeylightConfigQueryOptions(args: { hostname: string }) {
	return queryOptions<GetKeylightConfigResponse>({
		queryKey: ["keylight-config", args.hostname],
		queryFn: (queryArgs) => {
			return getKeylightConfig({
				hostname: args.hostname,
				signal: queryArgs.signal,
			});
		},
		refetchInterval: 15_000,
		staleTime: 500,
		retry: false,
		refetchOnWindowFocus: true,
	});
}
