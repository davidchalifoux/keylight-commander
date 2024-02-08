/**
 * Service response returned from Rust backend
 */
export type ElgatoServiceResponse = {
  full_name: string;
  ip_v4: string;
  port: number;
  model: string;
  mac_address: string;
};

/**
 * Service type stored in the the store
 */
export type ElgatoService = {
  name: string;
  ip_v4: string;
  port: number;
  model: string;
  mac_address: string;
};
