import type { Device, System, Switch, PatchPanel } from "@shared/api";

const API_BASE_URL = "http://192.168.200.245:3666";

export async function fetchDevices(): Promise<System> {
  const res = await fetch(`${API_BASE_URL}/devices`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch devices: ${res.status}`);
  const data = (await res.json()) as System;
  return data;
}

export async function getUnlinkedDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE_URL}/devices/unlinked`);
  if (!res.ok)
    throw new Error(`Failed to fetch unlinked devices: ${res.status}`);
  const data = (await res.json()) as Device[];
  return data;
}

export async function addDevice(device: Omit<Device, "id">): Promise<Device> {
  const res = await fetch(`${API_BASE_URL}/add/device`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(device),
  });

  if (!res.ok) {
    throw new Error(`Failed to add device: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Device;
  return data;
}

export async function editDevice(device: Device): Promise<Device> {
  const res = await fetch(`${API_BASE_URL}/edit/${device.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(device),
  });

  if (!res.ok) {
    throw new Error(`Failed to edit device: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Device;
  return data;
}

export async function addSwitch(
  switchDevice: Omit<Switch, "id">,
): Promise<Switch> {
  const res = await fetch(`${API_BASE_URL}/add/switch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(switchDevice),
  });

  if (!res.ok) {
    throw new Error(`Failed to add switch: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Switch;
  return data;
}

export async function editSwitch(switchDevice: Switch): Promise<Switch> {
  const res = await fetch(`${API_BASE_URL}/edit/switch/${switchDevice.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(switchDevice),
  });

  if (!res.ok) {
    throw new Error(`Failed to edit switch: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Switch;
  return data;
}

export async function addPatchPanel(
  patchPanel: Omit<PatchPanel, "id">,
): Promise<PatchPanel> {
  const res = await fetch(`${API_BASE_URL}/add/patchpanel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchPanel),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to add patch panel: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as PatchPanel;
  return data;
}

export async function editPatchPanel(
  patchPanel: PatchPanel,
): Promise<PatchPanel> {
  const res = await fetch(`${API_BASE_URL}/edit/patchpanel/${patchPanel.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchPanel),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to edit patch panel: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as PatchPanel;
  return data;
}

export async function updateSwitchPort(
  switchId: string | number,
  portId: string | number,
  deviceId: number | null,
  p0: {
    title: string;
    id: number;
    unique_id: string;
    port_number: number;
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
  },
): Promise<Switch["ports"][0]> {
  const url =
    deviceId !== null
      ? `${API_BASE_URL}/switch/${switchId}/port/${portId}?device_id=${deviceId}`
      : `${API_BASE_URL}/switch/${switchId}/port/${portId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(p0),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to update switch port: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as Switch["ports"][0];
  return data;
}

export async function updatePatchPanelPort(
  patchPanelId: string,
  portId: number,
  switchPortId: number, // 0 means no change/disconnect, not null
  cableInfo?: {
    cable_number?: string;
    cable_length?: string;
  },
): Promise<PatchPanel> {
  // Build query parameters
  const params = new URLSearchParams();

  if (switchPortId > 0) {
    // Only add switch_port_id if it's greater than 0
    params.append("switch_port_id", switchPortId.toString());
  }

  if (cableInfo?.cable_number) {
    params.append("cable_number", cableInfo.cable_number);
  }

  if (cableInfo?.cable_length) {
    params.append("cable_length", cableInfo.cable_length);
  }

  const url = `${API_BASE_URL}/patchpanel/${patchPanelId}/port/${portId}${params.toString() ? "?" + params.toString() : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to update patch panel port: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as PatchPanel;
  return data;
}

export async function AutoPortsDetect({
  switchId,
}: {
  switchId: string | number;
}): Promise<Switch> {
  const res = await fetch(`${API_BASE_URL}/auto/ports/${switchId}`);

  if (!res.ok) {
    throw new Error(
      `Failed to auto-detect ports: ${res.status} ${res.statusText}`,
    );
  }

  const data = await res.json();
  return data.switches as Switch;
}
