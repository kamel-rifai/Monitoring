/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type DeviceType =
  | "camera"
  | "telephone"
  | "nursing"
  | "access-point"
  | "access-door"
  | string;

export interface Device {
  id: string | number;
  name: string;
  type: DeviceType;
  floor: number;
  active: boolean; // true => Active, false => Inactive
  // Optional extended details used in the sidebar detail view
  model?: string;
  place?: string;
  cableNumber?: string;
  Mac?: string; // Note: API uses capital M
  IP?: string; // Note: API uses capital I
  Notes?: string;
  show?: boolean;
  date?: string; // ISO date string
}

export interface Switch {
  id: string | number;
  name: string;
  type: "switch";
  floor: number;
  active: boolean;
  unique_id: string;
  total_ports: number;
  total_fiber_ports?: number;
  model?: string;
  place?: string;
  Mac?: string;
  IP?: string;
  Notes?: string;
  POE: boolean;
  ports: {
    id: number;
    unique_id: string;
    port_number: number;
    title: string;
    switch_id: number;
    device_id: number | null;
    switch: {
      id: number;
      name: string;
      type: "switch";
      floor: number;
      active: boolean;
      model?: string;
      place?: string;
      Mac?: string;
      IP?: string;
      Notes?: string;
    };
    device?: Device;
  }[];
  show?: boolean;
}

export interface PatchPanel {
  id: string | number;
  title: string;
  floor: number;
  unique_id: string;
  show?: boolean;
  ports: {
    id: number;
    title: string;
    port_number: number;
    switch_port?: {
      id: number;
      port_number: number;
      function: string;
      switch?: {
        id: number;
        name: string;
        type: DeviceType;
      };
    };
    cable_number?: string;
    cable_length?: string;
  }[];
}
[];

export interface System {
  devices: Device[];
  switches: Switch[];
  patchpanels: PatchPanel[];
}
