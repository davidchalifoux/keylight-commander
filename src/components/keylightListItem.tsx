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
import { IconPower, IconDotsVertical } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useServiceStore } from "../App";
import { useKeylight } from "../lib/hooks/useKeylight";
import { sleep } from "../lib/sleep";
import { ElgatoService } from "../lib/types";

type KeylightListItemProps = {
  service: ElgatoService;
};
export const KeylightListItem: React.FC<KeylightListItemProps> = (props) => {
  const [isModalOpen, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const serviceStore = useServiceStore();

  const [brightness, setBrightness] = useState<number | undefined>();
  const [temperature, setTemperature] = useState<number | undefined>();

  const [debouncedBrightness] = useDebouncedValue(brightness, 100);
  const [debouncedTemperature] = useDebouncedValue(temperature, 100);

  const keylight = useKeylight({
    ipAddress: props.service.ip_v4,
    port: props.service.port,
  });

  useEffect(() => {
    if (!debouncedBrightness) return;

    keylight.mutation.mutate({ brightness: brightness });
  }, [debouncedBrightness]);

  useEffect(() => {
    if (!debouncedTemperature) return;

    keylight.mutation.mutate({ temperature: temperature });
  }, [debouncedTemperature]);

  useEffect(() => {
    if (brightness && temperature) return;

    if (keylight.query.data) {
      setBrightness(keylight.query.data.brightness);
      setTemperature(keylight.query.data.temperature);
    }
  }, [keylight.query.data]);

  async function identifyLight() {
    if (!keylight.query.data) return;

    const previousValues = keylight.query.data;

    for (let i = 0; i < 2; i++) {
      await keylight.mutation.mutateAsync({ brightness: 100 });

      await sleep(300);

      await keylight.mutation.mutateAsync({ brightness: 0 });

      await sleep(300);
    }

    keylight.mutation.mutate({
      brightness: previousValues.brightness,
    });
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
            <Button onClick={closeModal}>Done</Button>
          </Group>
        </Stack>
      </Modal>

      <Box py={"md"} px={"md"}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr" }}>
          <Flex pr={"md"}>
            {/* Power button */}
            <ActionIcon
              variant={keylight.query.data?.on === 0 ? "default" : "filled"}
              size="lg"
              radius="xl"
              aria-label="toggle power"
              disabled={keylight.query.isLoading || keylight.query.isError}
              onClick={() => {
                keylight.mutation.mutate({
                  on: keylight.query.data?.on === 0 ? 1 : 0,
                });
              }}
            >
              <IconPower stroke={1.5} />
            </ActionIcon>
          </Flex>
          <Stack>
            <Group justify="space-between">
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
            <Slider
              disabled={keylight.query.isLoading || keylight.query.isError}
              min={143}
              max={344}
              label={(value) => {
                // Rough equation to get Kelvin value from elgato keylight value for temperature
                // Source: https://github.com/justinforlenza/keylight-control/blob/main/src/keylight.js
                return `${Math.round((-4100 * value) / 201 + 1993300 / 201)}K`;
              }}
              value={temperature}
              onChange={(value) => {
                setTemperature(value);
              }}
            />

            {/* Brightness */}
            <Slider
              min={3}
              max={100}
              disabled={keylight.query.isLoading || keylight.query.isError}
              label={(value) => `${value}%`}
              value={brightness}
              onChange={(value) => {
                setBrightness(value);
              }}
            />
          </Stack>
        </div>
      </Box>
    </>
  );
};
