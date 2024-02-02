import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import "./App.css";
import { ScrollArea, Box, Heading, Flex, Text } from "@radix-ui/themes";

type ElgatoService = {
  full_name: string;
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
};

export const useServiceStore = create(
  persist<State & Action>(
    (set, get) => ({
      services: {},
      addService: (service: ElgatoService) => {
        set(() => ({
          services: { ...get().services, [service.mac_address]: service },
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

  const [foundServices, setFoundServices] = useState<ElgatoService[]>([]);

  return (
    <ScrollArea type="always" scrollbars="vertical" style={{ height: "100%" }}>
      <Box p="2" pr="8">
        <Heading size="4" mb="2" trim="start">
          Principles of the typographic craft
        </Heading>
        <Flex direction="column" gap="4">
          <Text as="p">
            Three fundamental aspects of typography are legibility, readability,
            and aesthetics. Although in a non-technical sense “legible” and
            “readable” are often used synonymously, typographically they are
            separate but related concepts.
          </Text>

          <Text as="p">
            Legibility describes how easily individual characters can be
            distinguished from one another. It is described by Walter Tracy as
            “the quality of being decipherable and recognisable”. For instance,
            if a “b” and an “h”, or a “3” and an “8”, are difficult to
            distinguish at small sizes, this is a problem of legibility.
          </Text>

          <Text as="p">
            Typographers are concerned with legibility insofar as it is their
            job to select the correct font to use. Brush Script is an example of
            a font containing many characters that might be difficult to
            distinguish. The selection of cases influences the legibility of
            typography because using only uppercase letters (all-caps) reduces
            legibility.
          </Text>
        </Flex>
      </Box>
      <Box>
        <div className="container">
          <h1>Hello World</h1>

          <ul>
            {foundServices.map((service) => (
              <li key={service.mac_address}>
                {service.full_name} - {service.ip_v4}
              </li>
            ))}
          </ul>

          <ul>
            {Object.values(serviceStore.services).map((service) => (
              <li key={service.mac_address}>
                {service.full_name} - {service.ip_v4}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              invoke<ElgatoService[]>("scan").then((res): void => {
                setFoundServices(res);

                res.forEach((service) => {
                  serviceStore.addService(service);
                });

                console.log(res);
              });
            }}
          >
            Scan
          </button>
        </div>
      </Box>
    </ScrollArea>
  );
}

export default App;
