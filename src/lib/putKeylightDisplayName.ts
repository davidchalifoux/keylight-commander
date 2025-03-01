import { fetch } from "@tauri-apps/plugin-http";

export const putKeylightDisplayName = async (args: {
	hostname: string;
	displayName: string;
}) => {
	const response = await fetch(
		`http://${args.hostname}:9123/elgato/accessory-info`,
		{
			method: "PUT",
			connectTimeout: 2000,
			headers: {
				Origin: "",
			},
			body: JSON.stringify({
				displayName: args.displayName,
			}),
		},
	);

	if (!response.ok) {
		console.log(response);
		throw new Error(response.status.toString());
	}
};
