import { ScrollArea } from "./ui/scroll-area";

interface LayoutProps {
	header: React.ReactNode;
	children: React.ReactNode;
}

export function Layout(props: LayoutProps) {
	return (
		<div className="h-dvh grid grid-rows-[auto_1fr] select-none">
			<div className="border-b border-neutral-700 bg-neutral-800 h-12">
				{props.header}
			</div>

			<ScrollArea className="bg-neutral-900">{props.children}</ScrollArea>
		</div>
	);
}
