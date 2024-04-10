import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ElgatoService } from "../types";

type State = {
  services: ElgatoService[];
};

type Action = {
  addService: (service: ElgatoService) => { error: string | null };
  setName: (id: string, name: string) => void;
  deleteService: (id: string) => void;
  getServices: () => ElgatoService[];
  getServiceIndexById: (id: string) => number;
  getServiceById: (id: string) => ElgatoService | undefined;
  getServiceByMacAddress: (mac_address: string) => ElgatoService | undefined;
  getServiceByIpAddress: (ip_address: string) => ElgatoService | undefined;
};

export const useServiceStore = create(
  persist<State & Action>(
    (set, get) => ({
      services: [],
      addService: (service: ElgatoService) => {
        if (service.mac_address) {
          const existingServiceByMac = get().getServiceByMacAddress(
            service.mac_address
          );

          if (existingServiceByMac) {
            return {
              error: "Service already exists with this MAC address.",
            };
          }
        }

        const existingServiceByIp = get().getServiceByIpAddress(service.ip_v4);

        if (existingServiceByIp) {
          return {
            error: "Service already exists with this IP address.",
          };
        }

        set(() => {
          return {
            services: [...get().services, service],
          };
        });

        return {
          error: null,
        };
      },
      deleteService: (id: string) => {
        const serviceIndex = get().getServiceIndexById(id);
        const services = get().services;

        services.splice(serviceIndex, 1);
        set(() => {
          return {
            services: services,
          };
        });
      },
      setName: (id: string, name: string) => {
        set(() => ({
          services: get().services.map((service) => {
            if (service.id === id) {
              return { ...service, name };
            }

            return service;
          }),
        }));
      },
      getServices: () => {
        return get().services;
      },
      getServiceIndexById: (id: string) => {
        return get()
          .getServices()
          .findIndex((service) => service.id === id);
      },
      getServiceById: (id: string) => {
        return get()
          .getServices()
          .find((service) => service.id === id);
      },
      getServiceByMacAddress: (mac_address: string) => {
        return get()
          .getServices()
          .find((service) => service.mac_address === mac_address);
      },
      getServiceByIpAddress: (ip_address: string) => {
        return get()
          .getServices()
          .find((service) => service.ip_v4 === ip_address);
      },
    }),
    {
      name: "saved-services",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
