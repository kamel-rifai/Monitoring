import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import type { Switch, Device } from "@shared/api";
import { cn } from "@/lib/utils";
import { updateSwitchPort } from "@/lib/api";

interface PortConfigModalProps {
  open: boolean;
  port: Switch["ports"][0] | null;
  availableDevices: Device[];
  currentSwitchPorts?: Switch["ports"][]; // Add current switch ports for validation
  isAddMode?: boolean; // Add flag to check if we're in add mode
  onOpenChange: (open: boolean) => void;
  onSave: (port: Switch["ports"][0]) => void;
}

export function PortConfigModal({
  open,
  port,
  availableDevices,
  currentSwitchPorts,
  isAddMode = false,
  onOpenChange,
  onSave,
}: PortConfigModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<
    string | number | null
  >(port?.device_id || null);
  const [portTitle, setPortTitle] = useState(port?.title || "");

  // Update selectedDeviceId when port changes
  useEffect(() => {
    setSelectedDeviceId(port?.device_id || null);
    setPortTitle(port?.title || "");
  }, [port]);

  const handleSave = async () => {
    if (!port) return;

    const selectedDevice = availableDevices.find(
      (d) => String(d.id) === String(selectedDeviceId),
    );

    // Check if this device is already connected to another port in current switch
    const isDeviceAlreadyConnected =
      selectedDevice &&
      currentSwitchPorts?.some(
        (existingPort: any) =>
          String(existingPort.device_id) === String(selectedDeviceId) &&
          String(existingPort.port_number) !== String(port.port_number),
      );

    if (isDeviceAlreadyConnected) {
      alert(
        "This device is already connected to another port. Please disconnect it first.",
      );
      return;
    }

    try {
      if (isAddMode) {
        // For add mode, just update local state - switch doesn't exist in database yet
        const updatedPort = {
          ...port,
          title: portTitle,
          device_id: selectedDeviceId ? Number(selectedDeviceId) : null,
          device: selectedDeviceId ? selectedDevice : null, // Fixed: use selectedDevice only when ID exists
        };
        onSave(updatedPort);
        onOpenChange(false);
        return;
      }

      // For edit mode, check if we have a valid switch_id
      const hasValidSwitchId =
        port.switch_id &&
        String(port.switch_id) !== "0" &&
        String(port.switch_id) !== "undefined" &&
        String(port.switch_id) !== "null";

      if (!hasValidSwitchId) {
        console.error("Invalid switch_id:", port.switch_id);
        alert(
          "This port has an invalid switch ID. Please recreate the switch.",
        );
        return;
      }

      // For edit mode with valid switch_id, call the API
      const updatedPort = await updateSwitchPort(
        port.switch_id,
        port.port_number,
        selectedDeviceId ? Number(selectedDeviceId) : null,
        {
          ...port,
          title: portTitle,
        },
      );

      // Update local form with the response from API (which includes the device object)
      onSave(updatedPort);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update switch port:", error);
      alert("Failed to update switch port. Please try again.");
    }
  };

  const handleClearDevice = () => {
    setSelectedDeviceId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/30 ring-2 ring-white/90 rounded-lg backdrop-blur-sm ">
        <DialogHeader>
          <DialogTitle className="text-white">
            Configure Port {port?.port_number}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-xs"></DialogDescription>
        </DialogHeader>

        <div className="space-y-4 backdrop-blur-none">
          {/* Device Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Connected Device</label>
            <div className="space-y-2">
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={selectedDeviceId || ""}
                onChange={(e) => setSelectedDeviceId(e.target.value || null)}
              >
                <option value="">No device connected</option>
                {availableDevices
                  .sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0))
                  .map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.type}) -{" "}
                      {device.floor === 11
                        ? "العيادات"
                        : device.floor === 12
                          ? " كبين الاسعاف"
                          : device.floor === 13
                            ? "IT"
                            : device.floor === 0
                              ? "كبين القبو"
                              : `Floor ${device.floor}`}
                    </option>
                  ))}
              </select>

              {selectedDeviceId && (
                <button
                  type="button"
                  onClick={handleClearDevice}
                  className="text-sm text-slate-100 hover:text-slate-700"
                >
                  Clear device connection
                </button>
              )}
            </div>
          </div>

          {/* Current Connection Info */}
          {selectedDeviceId && (
            <div className="rounded-md bg-slate-50 p-3 border border-slate-200">
              <div className="text-sm">
                <div className="font-medium">
                  {availableDevices.find((d) => d.id == selectedDeviceId)?.name}
                </div>
                <div className="text-slate-500">
                  Type:{" "}
                  {availableDevices.find((d) => d.id == selectedDeviceId)?.type}
                </div>
                <div className="text-slate-500">
                  Floor:{" "}
                  {
                    availableDevices.find((d) => d.id == selectedDeviceId)
                      ?.floor
                  }
                </div>
                {availableDevices.find((d) => d.id == selectedDeviceId)?.IP && (
                  <div className="text-slate-500">
                    IP/MAC:{" "}
                    {availableDevices.find((d) => d.id == selectedDeviceId)?.IP}{" "}
                    -{" "}
                    {
                      availableDevices.find((d) => d.id == selectedDeviceId)
                        ?.Mac
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
