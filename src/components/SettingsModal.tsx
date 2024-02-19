import { Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import React from "react";
import { useSettingsStore } from "../lib/hooks/useSettingsStore";
import { useQuery } from "@tanstack/react-query";
import { getVersion } from "@tauri-apps/api/app";

type Props = {
  onClose: () => void;
  isOpen: boolean;
};

export const SettingsModal: React.FC<Props> = (props) => {
  const settingsStore = useSettingsStore();

  const versionQuery = useQuery({
    queryKey: ["version"],
    queryFn: () => {
      return getVersion();
    },
  });

  return (
    <Modal opened={props.isOpen} onClose={props.onClose} title="Settings">
      <Stack>
        <Checkbox
          label="Sync light controls"
          checked={settingsStore.isSyncEnabled}
          onChange={() => settingsStore.toggleSync()}
        />

        <Text c={"dimmed"} size="sm">
          Version: {versionQuery.data}
        </Text>

        <Group justify="end">
          <Button onClick={() => props.onClose()}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
