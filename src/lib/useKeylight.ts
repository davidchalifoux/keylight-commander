import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getKeylightStateQueryOptions,
	type GetKeylightStateResponse,
} from "./getKeylightState";
import { putKeylightState } from "./putKeylightState";
import { useGlobalState } from "./useGlobalState";
import { useEffect } from "react";
import { useRequest } from "ahooks";
import { useIsFirstRender } from "@uidotdev/usehooks";
import { getKeylightConfigQueryOptions } from "./getKeylightConfig";
import { putKeylightDisplayName } from "./putKeylightDisplayName";
import { useSettings } from "./useSettings";

/**
 * A hook to interact with an Elgato Keylight.
 */
export const useKeylight = (args: { hostname: string }) => {
	const isFirstRender = useIsFirstRender();

	const queryClient = useQueryClient();

	const globalSync = useSettings((state) => state.globalSync);
	const globalBrightness = useGlobalState((state) => state.globalBrightness);
	const setGlobalBrightness = useGlobalState(
		(state) => state.setGlobalBrightness,
	);
	const globalTemperature = useGlobalState((state) => state.globalTemperature);
	const setGlobalTemperature = useGlobalState(
		(state) => state.setGlobalTemperature,
	);
	const globalPower = useGlobalState((state) => state.globalPower);
	const setGlobalPower = useGlobalState((state) => state.setGlobalPower);

	const stateQuery = useQuery(
		getKeylightStateQueryOptions({ hostname: args.hostname }),
	);

	const configQuery = useQuery(
		getKeylightConfigQueryOptions({ hostname: args.hostname }),
	);

	const state = {
		brightness: stateQuery.data?.brightness ?? 3,
		temperature: stateQuery.data?.temperature ?? 143,
		power: stateQuery.data?.on ?? 0,
	};

	const stateMutation = useRequest(putKeylightState, {
		manual: true,
		debounceWait: 100,
		debounceLeading: false,
		debounceMaxWait: 100,
	});

	const displayNameMutation = useRequest(putKeylightDisplayName, {
		manual: true,
		debounceWait: 100,
		debounceLeading: false,
		debounceMaxWait: 100,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (
			!stateQuery.isFetched ||
			isFirstRender ||
			globalBrightness === null ||
			globalBrightness === state.brightness
		) {
			return;
		}

		setBrightness(globalBrightness);
	}, [globalBrightness]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (
			!stateQuery.isFetched ||
			isFirstRender ||
			globalTemperature === null ||
			globalTemperature === state.temperature
		) {
			return;
		}

		setTemperature(globalTemperature);
	}, [globalTemperature]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (
			!stateQuery.isFetched ||
			isFirstRender ||
			globalPower === null ||
			globalPower.state === state.power
		) {
			return;
		}

		setPower(globalPower.state);
	}, [globalPower?.id]);

	async function setBrightness(value: number) {
		await queryClient.cancelQueries({
			queryKey: getKeylightStateQueryOptions({ hostname: args.hostname })
				.queryKey,
		});

		queryClient.setQueryData<GetKeylightStateResponse>(
			getKeylightStateQueryOptions({ hostname: args.hostname }).queryKey,
			{
				on: state.power,
				brightness: value,
				temperature: state.temperature,
			},
		);

		stateMutation.run({
			hostname: args.hostname,
			payload: {
				on: state.power,
				temperature: state.temperature,
				brightness: value,
			},
		});

		if (globalSync) {
			setGlobalBrightness(value);
		}
	}

	async function setTemperature(value: number) {
		await queryClient.cancelQueries({
			queryKey: getKeylightStateQueryOptions({ hostname: args.hostname })
				.queryKey,
		});

		queryClient.setQueryData<GetKeylightStateResponse>(
			getKeylightStateQueryOptions({ hostname: args.hostname }).queryKey,
			{
				on: state.power,
				brightness: state.brightness,
				temperature: value,
			},
		);

		stateMutation.run({
			hostname: args.hostname,
			payload: {
				on: state.power,
				temperature: value,
				brightness: state.brightness,
			},
		});

		if (globalSync) {
			setGlobalTemperature(value);
		}
	}

	async function setPower(value: number) {
		await queryClient.cancelQueries({
			queryKey: getKeylightStateQueryOptions({ hostname: args.hostname })
				.queryKey,
		});

		queryClient.setQueryData<GetKeylightStateResponse>(
			getKeylightStateQueryOptions({ hostname: args.hostname }).queryKey,
			{
				on: value,
				brightness: state.brightness,
				temperature: state.temperature,
			},
		);

		stateMutation.run({
			hostname: args.hostname,
			payload: {
				on: value,
				temperature: state.temperature,
				brightness: state.brightness,
			},
		});

		if (globalSync) {
			setGlobalPower(value);
		}
	}

	async function setDisplayName(value: string) {
		await queryClient.cancelQueries({
			queryKey: getKeylightConfigQueryOptions({ hostname: args.hostname })
				.queryKey,
		});

		queryClient.setQueryData(
			getKeylightConfigQueryOptions({ hostname: args.hostname }).queryKey,
			(old) => {
				if (old) {
					return {
						...old,
						displayName: value,
					};
				}
			},
		);

		displayNameMutation.run({
			hostname: args.hostname,
			displayName: value,
		});
	}

	return {
		stateQuery: stateQuery,
		configQuery: configQuery,
		brightness: state.brightness,
		setBrightness: setBrightness,
		temperature: state.temperature,
		setTemperature: setTemperature,
		power: state.power,
		setPower: setPower,
		setDisplayName: setDisplayName,
	};
};
