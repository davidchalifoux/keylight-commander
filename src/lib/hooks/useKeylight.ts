import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getKeylightStatus } from "../fetchers/keylightStatus.get";
import { putKeylightStatus } from "../fetchers/keylightStatus.put";

/**
 * A hook to interact with an Elgato Keylight.
 */
export const useKeylight = (args: { ipAddress: string; port: number }) => {
  const queryClient = useQueryClient();

  const queryKey = ["keylight", args.ipAddress, args.port];

  const query = useQuery({
    queryKey: queryKey,
    queryFn: () => getKeylightStatus(args),
    retry(failureCount) {
      if (failureCount > 1) {
        return false;
      }

      return true;
    },
  });

  const mutation = useMutation({
    mutationFn: async (mutationArgs: {
      on?: number;
      temperature?: number;
      brightness?: number;
    }) => {
      const on = mutationArgs.on ?? query.data?.on ?? 0;
      const temperature =
        mutationArgs.temperature ?? query.data?.temperature ?? 143;
      const brightness = mutationArgs.brightness ?? query.data?.brightness ?? 0;

      await putKeylightStatus({
        ipAddress: args.ipAddress,
        port: args.port,
        payload: {
          on: on,
          temperature: temperature,
          brightness: brightness,
        },
      });

      return {
        on,
        temperature,
        brightness,
      };
    },

    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: queryKey,
      });
    },
  });

  return {
    query: query,
    mutation: mutation,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKey }),
  };
};
