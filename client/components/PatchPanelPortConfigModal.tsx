import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import type { PatchPanel, Switch } from "@shared/api";
import { cn } from "@/lib/utils";
import { updatePatchPanelPort } from "@/lib/api";

interface PatchPanelPortConfigModalProps {
  open: boolean;
  port: PatchPanel["ports"][0] | null;
  availableSwitches: Switch[];
  currentPatchPanel: PatchPanel;
  allPatchPanels: PatchPanel[]; // Add all patch panels to check system-wide duplicates
  onOpenChange: (open: boolean) => void;
  onSave: (port: PatchPanel["ports"][0]) => void;
  patchPanelId: string; // Add patch panel ID for API calls
}

export function PatchPanelPortConfigModal({
  open,
  port,
  availableSwitches,
  currentPatchPanel,
  allPatchPanels,
  onOpenChange,
  onSave,
  patchPanelId,
}: PatchPanelPortConfigModalProps) {
  const [selectedSwitchPort, setSelectedSwitchPort] = useState<{
    switchId: string | number;
    portNumber: number;
  } | null>(null);
  const [portTitle, setPortTitle] = useState("");
  const [cableNumber, setCableNumber] = useState(port?.cable_number || "");
  const [cableLength, setCableLength] = useState(port?.cable_length || "");
  const [availableSwitchPorts, setAvailableSwitchPorts] = useState<
    {
      id: number;
      port_number: number;
      title: string;
      switch?: {
        id: number;
        name: string;
        type: "SWITCH";
        device?: {
          id: number;
          name: string;
          type: string;
        };
      };
    }[]
  >([]);

  // Reset state when port changes
  useEffect(() => {
    if (port) {
      setSelectedSwitchPort(
        port.switch_port
          ? {
              switchId: port.switch_port.switch?.id || "",
              portNumber: port.switch_port.port_number,
            }
          : null,
      );
      setPortTitle(port.title || "");
      setCableNumber(port.cable_number || "");
      setCableLength(port.cable_length || "");
    } else {
      // Reset all fields when no port
      setSelectedSwitchPort(null);
      setPortTitle("");
      setCableNumber("");
      setCableLength("");
    }
  }, [port]);

  // Fetch available ports when component mounts or switches change
  useEffect(() => {
    if (!open) return;

    const fetchAvailablePorts = async () => {
      try {
        // Filter available ports by patch panel floor
        const response = await fetch(
          `http://192.168.200.245:3666/switches/available-ports?floor=${currentPatchPanel.floor}`,
        );
        const ports = await response.json();
        setAvailableSwitchPorts(ports);
      } catch (error) {
        console.error("Failed to fetch available ports:", error);
        setAvailableSwitchPorts([]);
      }
    };

    fetchAvailablePorts();
  }, [availableSwitches, currentPatchPanel.floor, open]);

  const handleSave = async () => {
    if (!port) return;

    // Check if user actually changed the switch port selection
    const userChangedSwitchPort =
      selectedSwitchPort !== null &&
      (port.switch_port?.switch?.id !== Number(selectedSwitchPort.switchId) ||
        port.switch_port?.port_number !== selectedSwitchPort.portNumber);

    // Check if user explicitly wants to disconnect (selected "No connection" when there was a connection)
    const userWantsToDisconnect =
      port.switch_port !== null && selectedSwitchPort === null;

    const selectedPort = userChangedSwitchPort
      ? availableSwitchPorts.find(
          (s) =>
            String(s.switch?.id) === String(selectedSwitchPort?.switchId) &&
            s.port_number === selectedSwitchPort?.portNumber,
        )
      : port.switch_port;

    // Check for duplicates across all patch panels
    const filteredPanels = allPatchPanels.filter((patchPanel) => {
      const shouldExclude = patchPanel.id !== currentPatchPanel.id;
      return shouldExclude;
    });

    // Check for duplicates across all patch panels (only if user changed switch port)
    const isDuplicate =
      userChangedSwitchPort &&
      filteredPanels.some((patchPanel) =>
        patchPanel.ports.some((existingPort) => {
          const isMatch =
            existingPort.switch_port?.switch?.id ===
              Number(selectedSwitchPort?.switchId) &&
            existingPort.switch_port.port_number ===
              selectedSwitchPort?.portNumber &&
            existingPort.switch_port.port_number !== port?.port_number;
          return isMatch;
        }),
      );

    if (isDuplicate) {
      alert(
        "This switch port is already connected to another patch panel port. Please choose a different port.",
      );
      return;
    }

    try {
      // Only make API call if patch panel exists (editing mode)
      if (patchPanelId && patchPanelId !== "") {
        // Check if anything actually changed
        const cableInfoChanged =
          (port.cable_number || "") !== (cableNumber || "") ||
          (port.cable_length || "") !== (cableLength || "");

        // Always call API if there are any changes (switch port OR cable info)
        if (
          userChangedSwitchPort ||
          userWantsToDisconnect ||
          cableInfoChanged
        ) {
          // Only send switch_port_id if actually changing the connection
          const shouldSendSwitchPortId =
            userChangedSwitchPort || userWantsToDisconnect;

          // Call the API to update the port
          const updatedPatchPanel = await updatePatchPanelPort(
            patchPanelId,
            port.port_number,
            shouldSendSwitchPortId
              ? userWantsToDisconnect
                ? 0
                : selectedPort?.id || 0
              : 0,
            // Send cable info if it changed or if we're updating switch port
            cableInfoChanged || userChangedSwitchPort || userWantsToDisconnect
              ? {
                  cable_number: cableNumber || undefined,
                  cable_length: cableLength || undefined,
                }
              : undefined,
          );
        }
      }

      // Remove the taken port from the list of available ports
      const availableSwitchPortsWithoutTakenPort = availableSwitchPorts.filter(
        (p) => p.id !== selectedPort?.id,
      );

      // Create updated port object for local state update
      const updatedPort: PatchPanel["ports"][0] = {
        id: port.id || Date.now() + Math.floor(Math.random() * 1000),
        title: portTitle,
        port_number: port.port_number,
        switch_port: userWantsToDisconnect
          ? undefined // Explicitly disconnect
          : userChangedSwitchPort && selectedPort
            ? {
                id: selectedPort.id,
                port_number: selectedPort.port_number,
                function: "connection",
                switch: selectedPort.switch
                  ? {
                      id: Number(selectedPort.switch.id),
                      name: selectedPort.switch.name,
                      type: selectedPort.switch.type,
                    }
                  : undefined,
              }
            : port.switch_port, // Preserve existing connection if user didn't change it
        cable_number: cableNumber || undefined,
        cable_length: cableLength || undefined,
      };

      onSave(updatedPort);

      // Refresh available ports to get updated state
      try {
        const response = await fetch(
          `http://192.168.200.245:3666/switches/available-ports?floor=${currentPatchPanel.floor}`,
        );
        const ports = await response.json();
        setAvailableSwitchPorts(ports);
      } catch (error) {
        console.error("Failed to refresh available ports:", error);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update port:", error);
      alert(
        `Failed to update port: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleClearConnection = () => {
    setSelectedSwitchPort(null);
  };

  // Check if a switch port is already connected to another patch panel port across ALL patch panels
  const isSwitchPortAlreadyConnected = (
    switchId: string | number,
    portNumber: number,
  ) => {
    console.log("Checking duplicate across all patch panels:", {
      switchId,
      portNumber,
      currentPatchPanelId: currentPatchPanel.id,
      allPatchPanelsCount: allPatchPanels.length,
      allPatchPanels: allPatchPanels.map((p) => ({
        id: p.id,
        name: p.title,
        portsCount: p.ports.length,
      })),
    });

    // Check all ports across all patch panels in system, excluding current patch panel
    const filteredPanels = allPatchPanels.filter((patchPanel) => {
      const shouldExclude = patchPanel.id !== currentPatchPanel.id;
      return shouldExclude;
    });

    const isDuplicate = filteredPanels.some((patchPanel) =>
      patchPanel.ports.some((existingPort) => {
        const isMatch =
          existingPort.switch_port?.switch?.id === Number(switchId) &&
          existingPort.switch_port.port_number === portNumber &&
          existingPort.switch_port.port_number !== port?.port_number;
        return isMatch;
      }),
    );

    return isDuplicate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/30 ring-2 ring-white/90 rounded-lg backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white">
            Configure Patch Panel Port {port?.port_number}
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Connect this patch panel port to a switch port
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Switch Port Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Connect to Switch Port
            </label>
            <div className="space-y-2">
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={
                  selectedSwitchPort
                    ? `${selectedSwitchPort.switchId}-${selectedSwitchPort.portNumber}`
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value) {
                    const [switchId, portNumber] = e.target.value.split("-");
                    setSelectedSwitchPort({
                      switchId,
                      portNumber: parseInt(portNumber),
                    });
                  } else {
                    setSelectedSwitchPort(null);
                  }
                }}
              >
                <option value="">No connection</option>
                {availableSwitchPorts
                  .filter(
                    (switchPort) =>
                      switchPort.switch?.id && switchPort.port_number,
                  )
                  .map((switchPort) => (
                    <option
                      key={`${switchPort.switch?.id}-${switchPort.port_number}`}
                      value={`${switchPort.switch?.id}-${switchPort.port_number}`}
                    >
                      {switchPort.switch?.name} Port {switchPort.port_number}
                      {switchPort.title &&
                        switchPort.switch.device &&
                        ` -> ${switchPort.switch?.device?.name ?? ""} ->  ${
                          switchPort.switch?.device?.type ?? ""
                        }`}
                    </option>
                  ))}
              </select>

              {selectedSwitchPort && (
                <button
                  type="button"
                  onClick={handleClearConnection}
                  className="text-sm text-slate-200 hover:text-slate-700"
                >
                  Clear connection
                </button>
              )}
            </div>
          </div>

          {/* Cable Information */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Cable Number (Optional)
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={cableNumber}
              onChange={(e) => setCableNumber(e.target.value)}
              placeholder="e.g. CAB-001"
            />

            <label className="text-sm font-medium text-white">
              Cable Length (Optional)
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={cableLength}
              onChange={(e) => setCableLength(e.target.value)}
              placeholder="e.g. 10m"
            />
          </div>
        </div>

        {/* Current Connection Info */}
        {selectedSwitchPort && (
          <div className="rounded-md bg-slate-50 p-3 border border-slate-200">
            <div className="text-sm">
              <div className="font-medium">
                {
                  availableSwitches.find(
                    (s) => s.id === selectedSwitchPort.switchId,
                  )?.name
                }{" "}
                - Port {selectedSwitchPort.portNumber}
              </div>
              {availableSwitches
                .find((s) => s.id === selectedSwitchPort.switchId)
                ?.ports.find(
                  (p) => p.port_number === selectedSwitchPort.portNumber,
                )?.device && (
                <div className="text-slate-500">
                  Connected to:{" "}
                  {
                    availableSwitches
                      .find((s) => s.id === selectedSwitchPort.switchId)
                      ?.ports.find(
                        (p) => p.port_number === selectedSwitchPort.portNumber,
                      )?.device?.name
                  }
                </div>
              )}
            </div>
          </div>
        )}

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
