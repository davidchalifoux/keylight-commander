import {
  Anchor,
  Button,
  Checkbox,
  Group,
  Modal,
  Space,
  Stack,
  Text,
} from "@mantine/core";
import React from "react";
import { useSettingsStore } from "../lib/hooks/useSettingsStore";

type Props = {
  onClose: () => void;
  isOpen: boolean;
};

export const SettingsModal: React.FC<Props> = (props) => {
  const settingsStore = useSettingsStore();

  return (
    <Modal opened={props.isOpen} onClose={props.onClose} title="Settings">
      <Stack>
        <Checkbox
          label="Sync light controls"
          checked={settingsStore.isSyncEnabled}
          onChange={() => settingsStore.toggleSync()}
        />

        <Group justify="end">
          <Button onClick={() => props.onClose()}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
