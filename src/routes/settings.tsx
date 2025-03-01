import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
} from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/lib/useSettings";
import { useQuery } from "@tanstack/react-query";
import { getVersion } from "@tauri-apps/api/app";

export const Route = createFileRoute("/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const globalSync = useSettings((state) => state.globalSync);
	const setGlobalSync = useSettings((state) => state.setGlobalSync);

	const version = useQuery({
		queryKey: ["version"],
		queryFn: async () => {
			return await getVersion();
		},
	});

	return (
		<Layout
			header={
				<div className="flex px-2 h-full w-full items-center gap-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon-sm" asChild>
									<Link to="/">
										<ArrowLeft />
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Back</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<p className="text-sm">Settings</p>
				</div>
			}
		>
			<div className="p-4 flex flex-col gap-6">
				<div className="items-top flex space-x-2">
					<Checkbox
						id="sync"
						checked={globalSync}
						onClick={() => setGlobalSync(!globalSync)}
					/>
					<div className="grid gap-1.5 leading-none">
						<label
							htmlFor="sync"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Sync light controls
						</label>
						<p className="text-sm text-neutral-500">
							All controls move in sync.
						</p>
					</div>
				</div>

				<p className="text-xs text-neutral-500">Version {version.data}</p>
			</div>
		</Layout>
	);
}
