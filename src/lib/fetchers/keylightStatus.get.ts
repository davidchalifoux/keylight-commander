import { Response, fetch } from "@tauri-apps/api/http";

type ApiResponse = {
  numberOfLights: number;
  lights: {
    on: number;
    brightness: number;
    temperature: number;
  }[];
};

type Args = {
  ipAddress: string;
  port: number;
};

export const getKeylightStatus = async (args: Args) => {
  const response: Response<ApiResponse> = await fetch(
    `http://${args.ipAddress}:${args.port}/elgato/lights`,
    {
      method: "GET",
      timeout: 2,
    }
  );

  if (!response.ok) {
    throw new Error(response.status.toString());
  }

  return response.data.lights[0];
};
