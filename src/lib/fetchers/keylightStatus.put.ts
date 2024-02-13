import { fetch, Body } from "@tauri-apps/api/http";

type Args = {
  ipAddress: string;
  port: number;
  payload: {
    on: number;
    brightness: number;
    temperature: number;
  };
};

export const putKeylightStatus = async (args: Args) => {
  await fetch(`http://${args.ipAddress}:${args.port}/elgato/lights`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: Body.json({
      numberOfLights: 1,
      lights: [
        {
          on: args.payload.on,
          brightness: args.payload.brightness,
          temperature: args.payload.temperature,
        },
      ],
    }),
  });
};
