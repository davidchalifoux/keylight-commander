import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  Slider,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconPlus,
  IconPower,
  IconScanEye,
  IconSettings,
} from "@tabler/icons-react";
import { useKeylight } from "./lib/hooks/useKeylight";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { sleep } from "./lib/sleep";

/**
 * Service response returned from Rust backend
 */
type ElgatoServiceResponse = {
  full_name: string;
  ip_v4: string;
  port: number;
  model: string;
  mac_address: string;
};

/**
 * Service type stored in the the store
 */
type ElgatoService = {
  name: string;
  ip_v4: string;
  port: number;
  model: string;
  mac_address: string;
};

type State = {
  services: Record<string, ElgatoService>;
};

type Action = {
  addService: (service: ElgatoService) => void;
  setName: (mac_address: string, name: string) => void;
  deleteService: (mac_address: string) => void;
  getService: (mac_address: string) => ElgatoService | undefined;
};

export const useServiceStore = create(
  persist<State & Action>(
    (set, get) => ({
      services: {},
      getService: (mac_address: string) => get().services[mac_address],
      addService: (service: ElgatoService) => {
        set(() => ({
          services: { ...get().services, [service.mac_address]: service },
        }));
      },
      deleteService: (mac_address: string) => {
        const services = get().services;
        delete services[mac_address];
        set({ services });
      },
      setName: (mac_address: string, name: string) => {
        const service = get().services[mac_address];

        if (!service) return;

        set(() => ({
          services: {
            ...get().services,
            [service.mac_address]: { ...service, name: name },
          },
        }));
      },
    }),
    {
      name: "saved-services",
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

function App() {
  const serviceStore = useServiceStore();

  function scanServices() {
    invoke<ElgatoServiceResponse[]>("scan").then((res): void => {
      res.forEach((service) => {
        const previousService = serviceStore.getService(service.mac_address);

        if (previousService) {
          serviceStore.addService({ ...service, name: previousService.name });
        } else {
          serviceStore.addService({
            ...service,
            name: service.full_name.split(".")[0],
          });
        }
      });
    });
  }

  return (
    <div>
      <Box bg={"dark.5"} h={"2.5rem"} px={"md"} w={"100%"}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            height: "100%",
          }}
        >
          <Flex align={"center"}>
            <ActionIcon>
              <IconPower style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Flex>

          <Flex align={"center"} justify={"center"}>
            <Text fw={600}>Keytrol</Text>
          </Flex>

          <Flex align={"center"} justify={"right"} gap={"xs"}>
            <ActionIcon variant="subtle" color="gray" onClick={scanServices}>
              <IconScanEye style={{ width: "70%", height: "70%" }} />
            </ActionIcon>

            <ActionIcon variant="subtle" color="gray">
              <IconPlus style={{ width: "70%", height: "70%" }} />
            </ActionIcon>

            <ActionIcon variant="subtle" color="gray">
              <IconSettings style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Flex>
        </div>
      </Box>

      {Object.values(serviceStore.services).map((service) => (
        <KeylightListItem service={service} key={service.mac_address} />
      ))}
    </div>
  );
}

export default App;

type KeylightListItemProps = {
  service: ElgatoService;
};
const KeylightListItem: React.FC<KeylightListItemProps> = (props) => {
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
              label={(value) => `${value}K`}
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
