import { invoke } from "@tauri-apps/api/tauri";

import {
  ActionIcon,
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconPower,
  IconScanEye,
  IconSettings,
} from "@tabler/icons-react";
import { KeylightListItem } from "./components/KeylightListItem";
import { ElgatoServiceResponse } from "./lib/types";
import { useCallback, useMemo, useState } from "react";
import { useKeylights } from "./lib/hooks/useKeylights";
import { useServiceStore } from "./lib/hooks/useServiceStore";
import { SettingsModal } from "./components/SettingsModal";
import { useDisclosure } from "@mantine/hooks";
import { ManualAddModal } from "./components/ManualAddModal";
import { nanoid } from "nanoid";

function App() {
  const serviceStore = useServiceStore();

  const keylights = useKeylights();

  const [isSettingsOpen, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [isManualAddOpen, { open: openManualAdd, close: closeManualAdd }] =
    useDisclosure(false);

  const [globalBrightness, setGlobalBrightness] = useState<number | null>(null);
  const [globalTemperature, setGlobalTemperature] = useState<number | null>(
    null
  );

  /**
   * Used to toggle all lights on or off.
   *
   * We use a count value to force a re-render when the value changes.
   */
  const [globalOn, setGlobalOn] = useState<{
    value: boolean | null;
    count: number;
  }>({
    value: null,
    count: 0,
  });

  function scanServices() {
    invoke<ElgatoServiceResponse[]>("scan").then((res): void => {
      res.forEach((service) => {
        serviceStore.addService({
          ...service,
          id: nanoid(),
          name: service.full_name.split(".")[0],
        });
      });
    });
  }

  const isEveryLightOn = useMemo(() => {
    for (const keylight of keylights) {
      if (keylight.data?.on === 0) {
        return false;
      }
    }

    return true;
  }, [keylights]);

  const toggleAllLights = useCallback(() => {
    setGlobalOn((prev) => {
      return { value: isEveryLightOn ? false : true, count: prev.count + 1 };
    });
  }, [isEveryLightOn]);

  return (
    <div>
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      <ManualAddModal isOpen={isManualAddOpen} onClose={closeManualAdd} />

      <Box bg={"dark.6"} h={"2.5rem"} px={"md"} w={"100%"}>
        <SimpleGrid cols={2} h={"100%"}>
          <Flex align={"center"}>
            <ActionIcon
              variant={isEveryLightOn ? "filled" : "default"}
              onClick={() => toggleAllLights()}
            >
              <IconPower style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Flex>

          <Flex align={"center"} justify={"right"} gap={"xs"}>
            <Tooltip label={"Scan for lights"} openDelay={500}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => scanServices()}
              >
                <IconScanEye style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={"Manually add light"} openDelay={500}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => openManualAdd()}
              >
                <IconPlus style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={"Settings"} openDelay={500}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => openSettings()}
              >
                <IconSettings style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        </SimpleGrid>
      </Box>

      {serviceStore.getServices().length === 0 && (
        <Flex
          align={"center"}
          justify={"center"}
          direction={"column"}
          gap={"md"}
          h={"100%"}
        >
          <Text size={"xl"} mt={"xl"}>
            No lights found
          </Text>
          <Button onClick={() => scanServices()}>Scan for lights</Button>
        </Flex>
      )}

      {serviceStore.getServices().map((service) => (
        <KeylightListItem
          key={service.id}
          itemId={service.id}
          globalBrightness={globalBrightness}
          setGlobalBrightness={setGlobalBrightness}
          globalTemperature={globalTemperature}
          setGlobalTemperature={setGlobalTemperature}
          globalOn={globalOn}
          setGlobalOn={setGlobalOn}
        />
      ))}
    </div>
  );
}

export default App;
