import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import {
	getKeylightConfig,
	getKeylightConfigQueryOptions,
	type GetKeylightConfigResponse,
} from "./getKeylightConfig";

interface ScanResponse {
	hostname: string;
}

type KeylightMapItem = ScanResponse & GetKeylightConfigResponse;

export function useScan() {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: ["keylights"],
		queryFn: async () => {
			try {
				const res = await invoke("scan");

				const keylightMap = new Map<string, KeylightMapItem>();

				for (const keylight of res as ScanResponse[]) {
					const config = await getKeylightConfig({
						hostname: keylight.hostname,
					});

					keylightMap.set(keylight.hostname, {
						...config,
						hostname: keylight.hostname,
					});
				}

				const keylightArray = Array.from(keylightMap.values()).sort((a, b) => {
					return a.displayName.localeCompare(b.displayName);
				});

				for (const keylightConfig of keylightArray) {
					queryClient.setQueryData<GetKeylightConfigResponse>(
						getKeylightConfigQueryOptions({ hostname: keylightConfig.hostname })
							.queryKey,
						keylightConfig,
					);
				}

				return keylightArray.map((keylight) => keylight.hostname);
			} catch (e) {
				console.error(e);
			}

			return [];
		},
		enabled: false,
	});
}
