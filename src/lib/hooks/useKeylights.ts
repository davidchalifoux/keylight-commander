import { useServiceStore } from "./useServiceStore";
import { getKeylightStatus } from "../fetchers/keylightStatus.get";
import { useQueries } from "@tanstack/react-query";

/**
 * A hook that returns an array of keylight queries.
 */
export const useKeylights = () => {
  const serviceStore = useServiceStore();
  const queries = useQueries({
    queries: serviceStore.getServices().map((service) => {
      return {
        queryKey: ["keylight", service.ip_v4, service.port],
        queryFn: () =>
          getKeylightStatus({
            ipAddress: service.ip_v4,
            port: service.port,
          }),
        staleTime: Infinity,
      };
    }),
  });

  return queries;
};
