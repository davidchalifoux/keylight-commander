import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ElgatoService } from "../types";

type State = {
  services: Record<string, ElgatoService>;
};

type Action = {
  addService: (service: ElgatoService) => void;
  setName: (mac_address: string, name: string) => void;
  deleteService: (mac_address: string) => void;
  getService: (mac_address: string) => ElgatoService | undefined;
  getServices: () => ElgatoService[];
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
      getServices() {
        return Object.values(get().services);
      },
    }),
    {
      name: "saved-services",
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
