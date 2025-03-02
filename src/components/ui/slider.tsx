import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			"relative flex w-full touch-none select-none items-center",
			className,
		)}
		{...props}
	>
		<SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-neutral-50/20">
			<SliderPrimitive.Range className="absolute h-full bg-neutral-50" />
		</SliderPrimitive.Track>
		<SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 border-neutral-700 bg-neutral-800 focus-visible:ring-neutral-300" />
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

const TemperatureSlider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			"relative flex w-full touch-none select-none items-center",
			className,
		)}
		{...props}
	>
		<SliderPrimitive.Track
			className="relative h-1.5 w-full grow overflow-hidden rounded-full"
			style={{
				background: "linear-gradient(to right, #F5F3FF, #FFE4CE 50%, #FFB166)",
			}}
		>
			{/* <SliderPrimitive.Range className="absolute h-full bg-neutral-900 dark:bg-neutral-50" /> */}
		</SliderPrimitive.Track>
		<SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 border-neutral-700 bg-neutral-800 focus-visible:ring-neutral-300" />
	</SliderPrimitive.Root>
));
TemperatureSlider.displayName = SliderPrimitive.Root.displayName;

export { Slider, TemperatureSlider };
