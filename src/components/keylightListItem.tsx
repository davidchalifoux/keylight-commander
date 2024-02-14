import {
  Modal,
  Stack,
  TextInput,
  Table,
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
import { sleep } from "../lib/sleep";
import { ElgatoService } from "../lib/types";
import { useServiceStore } from "../lib/hooks/useServiceStore";
import { useSettingsStore } from "../lib/hooks/useSettingsStore";

type KeylightListItemProps = {
  service: ElgatoService;
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

  const [isOn, setIsOn] = useState<boolean | undefined>();
  const [brightness, setBrightness] = useState<number | undefined>();
  const [temperature, setTemperature] = useState<number | undefined>();

  const [debouncedIsOn] = useDebouncedValue(isOn, 100);
  const [debouncedBrightness] = useDebouncedValue(brightness, 100);
  const [debouncedTemperature] = useDebouncedValue(temperature, 100);

  /** Used to prevent spamming identify */
  const [isIdentifying, setIsIdentifying] = useState(false);

  /** Used to stop syncing with the service */
  const [isQuerySyncDisabled, setIsQuerySyncDisabled] = useState(false);

  const keylight = useKeylight({
    ipAddress: props.service.ip_v4,
    port: props.service.port,
  });

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
    setIsOn(keylight.query.data.on === 1);
  }, [keylight.query.data]);

  /**
   * Flashes the light to identify it.
   */
  async function identifyLight() {
    if (!keylight.query.data) return;

    setIsIdentifying(true);
    setIsQuerySyncDisabled(true);

    const previousValues = keylight.query.data;

    if (previousValues.on === 0) {
      await keylight.mutation.mutateAsync({ on: 1, brightness: 0 });
      await sleep(300);
    }

    for (let i = 0; i < 2; i++) {
      await keylight.mutation.mutateAsync({ brightness: 25 });

      await sleep(300);

      await keylight.mutation.mutateAsync({ brightness: 0 });

      await sleep(300);
    }

    keylight.mutation.mutate({
      brightness: previousValues.brightness,
      on: previousValues.on,
    });

    setIsIdentifying(false);
    setIsQuerySyncDisabled(false);

    keylight.invalidate();
  }

  return (
    <>
      <Modal opened={isModalOpen} onClose={closeModal} title="Edit">
        <Stack>
          <TextInput
            label="Name"
            defaultValue={props.service.name}
            onChange={(event) => {
              serviceStore.setName(
                props.service.mac_address,
                event.currentTarget.value
              );
            }}
          />

          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>IP Address</Table.Td>
                <Table.Td>{props.service.ip_v4}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Port</Table.Td>
                <Table.Td>{props.service.port}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>MAC Address</Table.Td>
                <Table.Td>{props.service.mac_address}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Model</Table.Td>
                <Table.Td>{props.service.model}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>

          <Group justify="space-between">
            <Group>
              <Button
                variant="default"
                onClick={() => {
                  identifyLight();
                }}
                disabled={isIdentifying}
              >
                Identify
              </Button>

              <Button
                variant="default"
                onClick={() => {
                  serviceStore.deleteService(props.service.mac_address);
                }}
              >
                Remove
              </Button>
            </Group>
            <Button onClick={() => closeModal()}>Done</Button>
          </Group>
        </Stack>
      </Modal>

      <Box py={"md"} px={"md"}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr" }}>
          <Flex pr={"md"}>
            {/* Power button */}
            <ActionIcon
              variant={isOn ? "filled" : "default"}
              size="lg"
              radius="xl"
              aria-label="toggle power"
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
              <IconPower stroke={1.5} />
            </ActionIcon>
          </Flex>
          <Stack>
            <Group justify="space-between" wrap="nowrap">
              <Text>{`${props.service.name}`}</Text>

              {/* Modal button */}
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={openModal}
                disabled={keylight.query.isLoading || keylight.query.isError}
              >
                <IconDotsVertical style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Group>

            {/* Error message */}
            {keylight.query.isError && (
              <Group>
                <Text c={"red"}>Unable to connect</Text>

                <Button
                  size="xs"
                  variant="default"
                  onClick={() => keylight.query.refetch()}
                  disabled={keylight.query.isFetching}
                >
                  Retry
                </Button>
              </Group>
            )}

            {/* Color temp */}
            <Flex gap={"sm"} align={"center"}>
              <Slider
                style={{ flexGrow: 1 }}
                disabled={keylight.query.isLoading || keylight.query.isError}
                color="rgba(0, 0, 0, 0)"
                className="temp-slider"
                min={143}
                max={344}
                label={(value) => {
                  // Rough equation to get Kelvin value from elgato keylight value for temperature
                  // Source: https://github.com/justinforlenza/keylight-control/blob/main/src/keylight.js
                  return `${Math.round(
                    (-4100 * value) / 201 + 1993300 / 201
                  )}K`;
                }}
                value={temperature}
                onChange={(value) => {
                  if (settingsStore.isSyncEnabled) {
                    props.setGlobalTemperature(value);
                  }

                  setTemperature(value);
                }}
              />

              <ActionIcon variant="subtle" color="gray">
                <IconTemperature style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Flex>

            {/* Brightness */}
            <Flex gap={"sm"} align={"center"}>
              <Slider
                style={{ flexGrow: 1 }}
                min={3}
                max={100}
                color="rgba(0, 0, 0, 0)"
                className="brightness-slider"
                disabled={keylight.query.isLoading || keylight.query.isError}
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
                <IconBrightnessUp style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Flex>
          </Stack>
        </div>
      </Box>
    </>
  );
};
