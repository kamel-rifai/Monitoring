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
  | "nursing-system"
  | "access-point"
  | "access-door"
  | string;

export interface Device {
  id: string | number;
  name: string;
  type: DeviceType;
  floor: number; // 0-12
  active: boolean; // true => Active, false => Inactive
  // Optional extended details used in the sidebar detail view
  model?: string;
  place?: string;
  mac?: string;
  ip?: string;
  notes?: string;
  show?: boolean;
  date?: string; // ISO date string
}
