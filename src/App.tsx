import { invoke } from "@tauri-apps/api/tauri";

import { ActionIcon, Box, Flex, Text, Tooltip } from "@mantine/core";
import {
  IconLock,
  IconPlus,
  IconPower,
  IconScanEye,
} from "@tabler/icons-react";
import { KeylightListItem } from "./components/keylightListItem";
import { ElgatoServiceResponse } from "./lib/types";
import { useCallback, useMemo, useState } from "react";
import { useKeylights } from "./lib/hooks/useKeylights";
import { useServiceStore } from "./lib/hooks/useServiceStore";
import { useSettingsStore } from "./lib/hooks/useSettingsStore";

function App() {
  const serviceStore = useServiceStore();
  const settingsStore = useSettingsStore();

  const keylights = useKeylights();

  const [globalBrightness, setGlobalBrightness] = useState<number | null>(null);
  const [globalTemperature, setGlobalTemperature] = useState<number | null>(
    null
  );
  const [globalOn, setGlobalOn] = useState<boolean | null>(null);

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

  const isEveryLightOn = useMemo(() => {
    for (const keylight of keylights) {
      if (keylight.data?.on === 0) {
        return false;
      }
    }

    return true;
  }, [keylights]);

  const toggleAllLights = useCallback(() => {
    setGlobalOn(isEveryLightOn ? false : true);
  }, [isEveryLightOn]);

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
            <ActionIcon
              variant={isEveryLightOn ? "filled" : "default"}
              onClick={() => toggleAllLights()}
            >
              <IconPower style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Flex>

          <Flex align={"center"} justify={"center"}>
            <Text fw={600}>Keytrol</Text>
          </Flex>

          <Flex align={"center"} justify={"right"} gap={"xs"}>
            <Tooltip
              label={
                settingsStore.isSyncEnabled
                  ? "Turn off syncing"
                  : "Turn on syncing"
              }
            >
              <ActionIcon
                variant={settingsStore.isSyncEnabled ? "filled" : "subtle"}
                color={settingsStore.isSyncEnabled ? "blue" : "gray"}
                onClick={() => settingsStore.toggleSync()}
              >
                <IconLock style={{ width: "70%", height: "70%" }} />
              </ActionIcon>
            </Tooltip>

            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => scanServices()}
            >
              <IconScanEye style={{ width: "70%", height: "70%" }} />
            </ActionIcon>

            <ActionIcon variant="subtle" color="gray">
              <IconPlus style={{ width: "70%", height: "70%" }} />
            </ActionIcon>
          </Flex>
        </div>
      </Box>

      {serviceStore.getServices().map((service) => (
        <KeylightListItem
          key={service.mac_address}
          service={service}
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
