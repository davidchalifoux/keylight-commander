import React from "react";

import {
  Stack,
  Group,
  Button,
  Box,
  Flex,
  ActionIcon,
  Slider,
  Text,
} from "@mantine/core";
import { useDisclosure, useDebouncedValue } from "@mantine/hooks";
import {
  IconPower,
  IconDotsVertical,
  IconBrightnessUp,
  IconTemperature,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useKeylight } from "../lib/hooks/useKeylight";
import { useServiceStore } from "../lib/hooks/useServiceStore";
import { useSettingsStore } from "../lib/hooks/useSettingsStore";
import { KeylightEditModal } from "./KeylightEditModal";
import chroma from "chroma-js";

type KeylightListItemProps = {
  itemId: string;
  globalBrightness: number | null;
  setGlobalBrightness: (value: number | null) => void;
  globalTemperature: number | null;
  setGlobalTemperature: (value: number | null) => void;
  globalOn: {
    value: boolean | null;
    count: number;
  };
  setGlobalOn: React.Dispatch<
    React.SetStateAction<{
      value: boolean | null;
      count: number;
    }>
  >;
};

export const KeylightListItem: React.FC<KeylightListItemProps> = (props) => {
  const [isModalOpen, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const serviceStore = useServiceStore();
  const settingsStore = useSettingsStore();

  const service = serviceStore.getServiceById(props.itemId)!;

  const [isOn, setIsOn] = useState<boolean | undefined>();
  const [brightness, setBrightness] = useState<number | undefined>();
  const [temperature, setTemperature] = useState<number | undefined>();
  /** The color temperature value in Kelvin. */
  const [temperatureKelvin, setTemperatureKelvin] = useState<
    number | undefined
  >();

  const [debouncedIsOn] = useDebouncedValue(isOn, 100);
  const [debouncedBrightness] = useDebouncedValue(brightness, 100);
  const [debouncedTemperature] = useDebouncedValue(temperature, 100);

  /** Used to stop syncing with the service */
  const [isQuerySyncDisabled, setIsQuerySyncDisabled] = useState(false);

  const keylight = useKeylight({
    ipAddress: service.ip_v4,
    port: service.port,
  });

  function setTempatureInKelvin(value: number) {
    // Rough equation to get Kelvin value from elgato keylight value for temperature
    // Source: https://github.com/justinforlenza/keylight-control/blob/main/src/keylight.js
    setTemperatureKelvin(Math.round((-4100 * value) / 201 + 1993300 / 201));
  }

  useEffect(() => {
    // Update power on device
    if (debouncedIsOn === undefined) return;

    keylight.mutation.mutate({ on: isOn ? 1 : 0 });
  }, [debouncedIsOn]);

  useEffect(() => {
    // Update brightness on device
    if (debouncedBrightness === undefined) return;

    keylight.mutation.mutate({ brightness: brightness });
  }, [debouncedBrightness]);

  useEffect(() => {
    // Update temperature on device
    if (debouncedTemperature === undefined) return;

    keylight.mutation.mutate({ temperature: temperature });
  }, [debouncedTemperature]);

  useEffect(() => {
    // Sync global brightness
    if (!props.globalBrightness) return;

    setBrightness(props.globalBrightness);
  }, [props.globalBrightness]);

  useEffect(() => {
    // Sync global temperature
    if (!props.globalTemperature) return;

    setTemperature(props.globalTemperature);
  }, [props.globalTemperature]);

  useEffect(() => {
    // Sync global power
    if (props.globalOn.value === null) return;

    setIsOn(props.globalOn.value);
  }, [props.globalOn]);

  useEffect(() => {
    // Update state from query
    if (!keylight.query.data) return;
    if (isQuerySyncDisabled) return;

    setBrightness(keylight.query.data.brightness);
    setTemperature(keylight.query.data.temperature);
    setTempatureInKelvin(keylight.query.data.temperature);
    setIsOn(keylight.query.data.on === 1);
  }, [keylight.query.data]);

  return (
    <>
      <KeylightEditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        itemId={props.itemId}
        setIsQuerySyncDisabled={setIsQuerySyncDisabled}
      />

      <Box py={"sm"} px={"md"}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr" }}>
          <Flex pr={"md"}>
            {/* Power button */}
            <ActionIcon
              variant={isOn ? "filled" : "default"}
              size="md"
              aria-label="toggle power"
              loading={keylight.query.isLoading}
              disabled={keylight.query.isLoading || keylight.query.isError}
              onClick={() => {
                if (settingsStore.isSyncEnabled) {
                  props.setGlobalOn((prev) => {
                    return { value: !isOn, count: prev.count + 1 };
                  });
                }

                setIsOn(!isOn);
              }}
            >
              <IconPower stroke={1.5} style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Flex>
          <Stack gap={"xs"}>
            <Group justify="space-between" wrap="nowrap">
              <Text
                size="sm"
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              >{`${service.name}`}</Text>

              {/* Modal button */}
              <ActionIcon
                size={"md"}
                variant="subtle"
                color="gray"
                onClick={openModal}
                disabled={keylight.query.isLoading || keylight.query.isError}
              >
                <IconDotsVertical
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Group>

            {/* Error message */}
            {keylight.query.isError && (
              <>
                <Text size="sm" c={"red"}>
                  Unable to connect
                </Text>

                <Group>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => keylight.query.refetch()}
                    disabled={keylight.query.isFetching}
                  >
                    Retry
                  </Button>

                  <Button
                    size="xs"
                    variant="filled"
                    color="red"
                    onClick={() => {
                      serviceStore.deleteService(props.itemId);
                    }}
                  >
                    Delete
                  </Button>
                </Group>
              </>
            )}

            {/* Color temp */}
            {!keylight.query.isError && (
              <>
                <Flex gap={"sm"} align={"center"}>
                  <Slider
                    style={{ flexGrow: 1 }}
                    disabled={
                      keylight.query.isLoading || keylight.query.isError
                    }
                    color="rgba(0, 0, 0, 0)"
                    className="temp-slider"
                    min={143}
                    max={344}
                    label={() => {
                      return `${temperatureKelvin}K`;
                    }}
                    value={temperature}
                    onChange={(value) => {
                      if (settingsStore.isSyncEnabled) {
                        props.setGlobalTemperature(value);
                      }

                      setTemperature(value);
                      setTempatureInKelvin(value);
                    }}
                  />

                  <ActionIcon variant="subtle" color="gray">
                    <IconTemperature
                      style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  </ActionIcon>
                </Flex>

                {/* Brightness */}
                <Flex gap={"sm"} align={"center"}>
                  <Slider
                    style={{
                      flexGrow: 1,
                      "--brightness-slider-color": `rgb(${
                        temperatureKelvin
                          ? chroma.temperature(temperatureKelvin ?? 0).rgb()
                          : "255,255,255"
                      })`,
                    }}
                    min={3}
                    max={100}
                    color="rgba(0, 0, 0, 0)"
                    className="brightness-slider"
                    disabled={
                      keylight.query.isLoading || keylight.query.isError
                    }
                    label={(value) => `${value}%`}
                    value={brightness}
                    onChange={(value) => {
                      if (settingsStore.isSyncEnabled) {
                        props.setGlobalBrightness(value);
                      }

                      setBrightness(value);
                    }}
                  />

                  <ActionIcon variant="subtle" color="gray">
                    <IconBrightnessUp
                      style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  </ActionIcon>
                </Flex>
              </>
            )}
          </Stack>
        </div>
      </Box>
    </>
  );
};
