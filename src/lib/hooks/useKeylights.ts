import { useServiceStore } from "../../App";
import { useKeylight } from "./useKeylight";

export const useKeylights = () => {
  const serviceStore = useServiceStore();

  const queries: ReturnType<typeof useKeylight>[] = [];

  for (const service of Object.values(serviceStore.services)) {
    queries.push(useKeylight({ ipAddress: service.ip_v4, port: service.port }));
  }

  console.log("usekeylights refreshed");

  return queries;
};
