import { Button } from "@/components/ui/button";
import { Slider, TemperatureSlider } from "@/components/ui/slider";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGlobalState } from "@/lib/useGlobalState";
import { useKeylight } from "@/lib/useKeylight";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	EllipsisVertical,
	Loader2,
	Power,
	ScanEye,
	Settings,
	Sun,
	Thermometer,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { useQueries } from "@tanstack/react-query";
import { getKeylightStateQueryOptions } from "@/lib/getKeylightState";
import { useScan } from "@/lib/scan";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const scan = useScan();
	const setGlobalPower = useGlobalState((state) => state.setGlobalPower);

	const queries = useQueries({
		queries:
			scan.data?.map((item) => {
				return getKeylightStateQueryOptions({
					hostname: item,
				});
			}) ?? [],
	});

	const allOn = queries.every((query) => query.data?.on === 1) ? 1 : 0;

	return (
		<Layout
			header={
				<div
					data-tauri-drag-region
					className="flex px-2 h-full w-full items-center justify-between gap-2"
				>
					<TooltipProvider>
						<div>
							<Button
								variant={allOn ? "default" : "outline"}
								size="icon-sm"
								onClick={() => {
									setGlobalPower(allOn === 1 ? 0 : 1);
								}}
							>
								<Power />
							</Button>
						</div>

						<div className="flex gap-2 items-center">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => scan.refetch()}
										disabled={scan.isFetching}
									>
										{scan.isFetching ? (
											<Loader2 className="animate-spin" />
										) : (
											<ScanEye />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Scan for lights</p>
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon-sm" asChild>
										<Link to="/settings">
											<Settings />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Settings</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				</div>
			}
		>
			{!scan.data?.length && (
				<div className="flex flex-col items-center pt-16">
					<div className="text-center">
						<h3 className="mt-2 text-sm font-semibold text-neutral-100">
							No keylights found
						</h3>
						<p className="mt-1 text-sm text-neutral-500">
							Get started by scanning for lights.
						</p>
						<div className="mt-6">
							<Button onClick={() => scan.refetch()} disabled={scan.isFetching}>
								Scan for lights
							</Button>
						</div>
					</div>
				</div>
			)}

			{scan.data && (
				<div className="flex flex-col px-2">
					{scan.data.map((item, i) => {
						return (
							<div key={item}>
								<Keylight hostname={item} />
								{i < scan.data.length - 1 && (
									<div className="border-t border-neutral-800 my-2" />
								)}
							</div>
						);
					})}
				</div>
			)}
		</Layout>
	);
}

interface KeylightProps {
	hostname: string;
}

function Keylight(props: KeylightProps) {
	const keylight = useKeylight({
		hostname: props.hostname,
	});

	function getPowerButtonVariant() {
		if (
			keylight.stateQuery.error !== null ||
			keylight.configQuery.error !== null
		) {
			return "destructive";
		}

		return keylight.power ? "default" : "secondary";
	}

	const disabled =
		keylight.stateQuery.error !== null ||
		keylight.configQuery.error !== null ||
		!keylight.stateQuery.isFetched;

	return (
		<TooltipProvider>
			<div className="grid grid-cols-[auto_1fr_auto] grid-rows-3 gap-x-4 items-center py-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={getPowerButtonVariant()}
							size="icon-sm"
							onClick={() => {
								keylight.setPower(keylight.power === 0 ? 1 : 0);
							}}
							disabled={disabled}
						>
							<Power />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{keylight.stateQuery.error === null && <p>Toggle power</p>}
						{keylight.stateQuery.error !== null && (
							<p className="text-red-500">Unable to connect to keylight</p>
						)}
					</TooltipContent>
				</Tooltip>

				<p className="text-sm text-neutral-300 font-normal text-nowrap">
					{keylight.configQuery.data?.displayName}
				</p>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							disabled={keylight.stateQuery.isError}
							asChild
						>
							<Link
								to={"/keylight/$hostname"}
								params={{ hostname: props.hostname }}
							>
								<EllipsisVertical />
							</Link>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Details</p>
					</TooltipContent>
				</Tooltip>

				<div className="col-start-2">
					{/* Color Temp */}
					<TemperatureSlider
						value={[keylight.temperature]}
						onValueChange={(value) => keylight.setTemperature(value[0])}
						disabled={disabled}
						min={143}
						max={344}
					/>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon-sm">
							<Thermometer />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Temperature</p>
					</TooltipContent>
				</Tooltip>

				<div className="col-start-2">
					{/* Brightness */}
					<Slider
						value={[keylight.brightness]}
						disabled={disabled}
						onValueChange={(value) => keylight.setBrightness(value[0])}
						min={3}
						max={100}
					/>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon-sm" disabled={disabled}>
							<Sun />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Brightness</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
