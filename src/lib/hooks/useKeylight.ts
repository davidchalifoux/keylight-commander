import { useMutation, useQuery } from "react-query";
import { Response, fetch, Body } from "@tauri-apps/api/http";

type ApiResponse = {
  numberOfLights: number;
  lights: {
    on: number;
    brightness: number;
    temperature: number;
  }[];
};

export const useKeylight = (args: { ipAddress: string; port: number }) => {
  const query = useQuery(
    ["keylight", args],
    async () => {
      const response: Response<ApiResponse> = await fetch(
        `http://${args.ipAddress}:${args.port}/elgato/lights`,
        {
          method: "GET",
          timeout: 5,
        }
      );

      console.log(response);

      if (!response.ok) {
        throw new Error(response.status.toString());
      }

      return response.data.lights[0];
    },
    {
      retry: 2,
      retryDelay: 1000,
    }
  );

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

      const response = await fetch(
        `http://${args.ipAddress}:${args.port}/elgato/lights`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: Body.json({
            numberOfLights: 1,
            lights: [
              {
                on,
                brightness,
                temperature,
              },
            ],
          }),
        }
      );

      query.refetch();

      return response.data;
    },
  });

  return {
    query: query,
    mutation: mutation,
  };
};
