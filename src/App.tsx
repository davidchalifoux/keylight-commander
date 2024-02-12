import { invoke } from "@tauri-apps/api/tauri";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ActionIcon, Box, Flex, Text } from "@mantine/core";
import {
  IconPlus,
  IconPower,
  IconScanEye,
  IconSettings,
} from "@tabler/icons-react";
import { KeylightListItem } from "./components/keylightListItem";
import { ElgatoService, ElgatoServiceResponse } from "./lib/types";
import { useCallback, useMemo } from "react";
import { useKeylights } from "./lib/hooks/useKeylights";

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

  const keylights = useKeylights();

  const isEveryLightOn = useMemo(() => {
    for (const keylight of keylights) {
      if (keylight.query.data?.on === 0) {
        return false;
      }
    }

    return true;
  }, [keylights]);

  const toggleAllLights = useCallback(() => {
    for (const keylight of keylights) {
      const onState: number = isEveryLightOn ? 0 : 1;

      keylight.mutation.mutate({ on: onState });
    }
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
