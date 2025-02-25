import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useSettings } from "@/lib/useSettings";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const hideOnFocusChanged = useSettings((state) => state.hideOnFocusChanged);

	React.useEffect(() => {
		if (!hideOnFocusChanged) {
			return;
		}

		// Hide the window when it loses focus
		const window = getCurrentWebviewWindow();

		const unlisten = window.onFocusChanged(async (e) => {
			if (e.payload === false) {
				await window.hide();
			}
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, [hideOnFocusChanged]);

	return (
		<React.Fragment>
			<Outlet />
		</React.Fragment>
	);
}
