import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { TrayIcon } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platform } from "@tauri-apps/plugin-os";
import { resolveResource } from "@tauri-apps/api/path";
import type { Image } from "@tauri-apps/api/image";

async function setupTrayIcon() {
	const window = getCurrentWebviewWindow();

	const platformName = platform();

	let icon: string | Image;

	if (platformName === "macos") {
		icon = await resolveResource("icons/macos-tray.png");
	} else {
		const defaultIcon = await defaultWindowIcon();

		if (!defaultIcon) {
			throw new Error("Failed to load the default window icon");
		}

		icon = defaultIcon;
	}

	const existingTray = await TrayIcon.getById("main");

	const menu = await Menu.new({
		items: [
			{
				id: "show",
				text: "Show",
				action: async () => {
					await window.show();
					await window.setFocus();
				},
			},
			{
				id: "hide",
				text: "Hide",
				action: async () => {
					await window.hide();
				},
			},
			{
				item: "Separator",
			},
			{
				id: "quit",
				text: "Quit",
				action: async () => {
					await window.close();
				},
			},
		],
	});

	if (existingTray) {
		console.log("Closing existing tray");
		await existingTray.setVisible(false);
		await existingTray.close();
	}

	await TrayIcon.new({
		id: "main",
		icon: icon,
		menu: menu,
		iconAsTemplate: true,
		showMenuOnLeftClick: false,
		action: async (e) => {
			if (e.type === "Click" && e.button === "Left" && e.buttonState === "Up") {
				const visible = await window.isVisible();
				const focused = await window.isFocused();

				if (!visible) {
					await window.show();
					await window.setFocus();

					return;
				}

				if (focused) {
					await window.hide();

					return;
				}

				await window.setFocus();
			}
		},
	});
}

setupTrayIcon();

const router = createRouter({ routeTree });

const queryClient = new QueryClient();

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// biome-ignore lint/style/noNonNullAssertion: It's fine.
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>,
	);
}
