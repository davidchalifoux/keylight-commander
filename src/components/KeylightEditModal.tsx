import { Modal, Stack, TextInput, Table, Group, Button } from "@mantine/core";
import React, { useState } from "react";
import { useServiceStore } from "../lib/hooks/useServiceStore";
import { useKeylight } from "../lib/hooks/useKeylight";
import { sleep } from "../lib/sleep";

type Props = {
  setIsQuerySyncDisabled: (value: boolean) => void;
  macAddress: string;
  isOpen: boolean;
  onClose: () => void;
};

export const KeylightEditModal: React.FC<Props> = (props) => {
  const serviceStore = useServiceStore();

  const service = serviceStore.getService(props.macAddress)!;

  const keylight = useKeylight({
    ipAddress: service.ip_v4,
    port: service.port,
  });

  /** Used to prevent spamming identify */
  const [isIdentifying, setIsIdentifying] = useState(false);

  /**
   * Flashes the light to identify it.
   */
  async function identifyLight() {
    if (!keylight.query.data) return;

    setIsIdentifying(true);
    props.setIsQuerySyncDisabled(true);

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
    props.setIsQuerySyncDisabled(false);

    keylight.invalidate();
  }

  return (
    <Modal opened={props.isOpen} onClose={props.onClose} title="Edit">
      <Stack>
        <TextInput
          label="Name"
          defaultValue={service.name}
          onChange={(event) => {
            serviceStore.setName(
              service.mac_address,
              event.currentTarget.value
            );
          }}
        />

        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>IP Address</Table.Td>
              <Table.Td>{service.ip_v4}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Port</Table.Td>
              <Table.Td>{service.port}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>MAC Address</Table.Td>
              <Table.Td>{service.mac_address}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Model</Table.Td>
              <Table.Td>{service.model}</Table.Td>
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
                serviceStore.deleteService(service.mac_address);
              }}
            >
              Remove
            </Button>
          </Group>
          <Button onClick={() => props.onClose()}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
