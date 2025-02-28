import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKeylight } from "@/lib/useKeylight";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/keylight/$hostname")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const params = Route.useParams();

	const keylight = useKeylight({ hostname: params.hostname });

	if (!keylight) {
		return router.navigate({ to: "/" });
	}

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

					<p className="text-sm">
						{keylight.configQuery.data?.productName} Settings
					</p>
				</div>
			}
		>
			<div className="p-2 flex flex-col gap-4">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Config</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">Name</TableCell>
							<TableCell>
								<Input
									defaultValue={keylight.configQuery.data?.displayName}
									onChange={(e) => keylight.setDisplayName(e.target.value)}
								/>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Details</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">Serial Number</TableCell>
							<TableCell>{keylight.configQuery.data?.serialNumber}</TableCell>
						</TableRow>

						<TableRow>
							<TableCell className="font-medium">Model</TableCell>
							<TableCell>{keylight.configQuery.data?.productName}</TableCell>
						</TableRow>

						<TableRow>
							<TableCell className="font-medium">Firmware Version</TableCell>
							<TableCell>
								{keylight.configQuery.data?.firmwareVersion}
							</TableCell>
						</TableRow>

						<TableRow>
							<TableCell className="font-medium">MAC Address</TableCell>
							<TableCell>{keylight.configQuery.data?.macAddress}</TableCell>
						</TableRow>

						<TableRow>
							<TableCell className="font-medium">Wi-Fi</TableCell>
							<TableCell>
								{keylight.configQuery.data?.["wifi-info"].ssid}
							</TableCell>
						</TableRow>

						<TableRow>
							<TableCell className="font-medium">Signal Strength</TableCell>
							<TableCell>
								{keylight.configQuery.data?.["wifi-info"].rssi}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>

				<div>
					<Button
						disabled={keylight.identify.isPending}
						onClick={() => keylight.identify.mutate()}
					>
						Identify
					</Button>
				</div>
			</div>
		</Layout>
	);
}
