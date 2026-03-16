import { cn } from "@/lib/utils";
import { EthernetPort } from "lucide-react";
import type { PatchPanel } from "@shared/api";

interface PortVisualizationProps {
  patchPanel: PatchPanel;
  onPortClick?: (port: PatchPanel["ports"][0] | null) => void;
  readOnly?: boolean;
}

export function PortVisualization({
  patchPanel,
  onPortClick,
  readOnly = false,
}: PortVisualizationProps) {
  // Create a 4x6 grid (24 ports total)
  const portsPerRow = 6;
  const totalPorts = 24;

  // Generate all 24 port positions
  const allPorts = Array.from({ length: totalPorts }, (_, i) => {
    const portNumber = i + 1;
    const actualPort = patchPanel.ports.find(
      (port) => port.port_number === portNumber,
    );

    return {
      port_number: portNumber,
      title: actualPort?.title || `Port ${portNumber}`,
      switch_port_id: actualPort?.switch_port?.port_number || null,
      patch_panel_id: actualPort?.switch_port?.switch?.id || patchPanel.id,
      switch: actualPort?.switch_port?.switch || null,
      id: actualPort?.id || null,
      type: actualPort?.switch_port?.switch?.type || "",
      isConnected:
        actualPort?.switch_port != null &&
        actualPort?.switch_port.switch?.type != null,
      // Preserve the full actualPort for tooltip access
      actualPort: actualPort || null,
    };
  });
  const getPortStatus = (port: any) => {
    if (port.isConnected) return "connected";
    return "disconnected";
  };

  const getStatusColor = (status: string, device_type?: string) => {
    const colorMap = {
      connected: "bg-emerald-500 hover:bg-emerald-600 border-emerald-600",
      disconnected: "bg-slate-500/40 hover:bg-slate-600 border-slate-600",
    };

    const typeColorMap = {
      telephone: "bg-emerald-400 border border-emerald-500",
      accessdoor: "bg-emerald-400 border border-emerald-500",
      camera: "bg-yellow-500 border border-yellow-600",
      nursing: "bg-blue-400 border border-blue-500",
      pmd: "bg-white/70 border border-white",
      network: "bg-rose-400 border border-rose-500",
      accesspoint: "bg-black/70 border border-black",
      training: "bg-white/70",
    };

    const color = colorMap[status] || colorMap.disconnected;
    const typeColor = device_type ? typeColorMap[device_type] : "";

    return status === "connected" ? typeColor : color;
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-white/30";
      case "disconnected":
        return "bg-slate-400/30";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="bg-black/15 rounded-lg p-4 ring-2 ring-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Switch Port Configuration
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-slate-300">Telephone</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span className="text-slate-300">CCTV</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-slate-300">Nursing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/70"></div>
            <span className="text-slate-300">PMD</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-400"></div>
            <span className="text-slate-300">Network</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-black/70"></div>
            <span className="text-slate-300">AP</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/70"></div>
            <span className="text-slate-300">Training</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {allPorts.map((port) => {
          const status = getPortStatus(port);
          const isClickable = onPortClick;

          return (
            <div
              key={port.port_number}
              onClick={() =>
                isClickable &&
                onPortClick(
                  port.actualPort || {
                    id: port.id,
                    port_number: port.port_number,
                    title: port.title,
                    switch_port: port.switch
                      ? {
                          id: port.switch_port_id || 0,
                          port_number: port.switch_port_id || 0,
                          function: "connection" as const,
                          switch: port.switch,
                        }
                      : undefined,
                  } as any,
                )
              }
              className={cn(
                "relative group cursor-pointer transition-all duration-200",
                isClickable && "hover:scale-105",
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-1 rounded-none border-2 transition-all duration-200",
                  getStatusColor(status, port.type),
                  isClickable && "hover:shadow-lg",
                )}
              >
                <EthernetPort
                  className={cn(
                    "size-6 mb-1 transition-colors",
                    status === "connected" ? "text-white" : "text-white/70",
                  )}
                />
                <span className="text-xs font-mono text-white">
                  {String(port.port_number).padStart(2, "0")}
                </span>

                {/* Status indicator light */}
                <div
                  className={cn(
                    "absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-all duration-200",
                    getStatusIndicator(status),
                    status === "connected" && "animate-pulse",
                  )}
                ></div>
              </div>

              {/* Hover tooltip */}
              {isClickable && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-sm">
                  <div className="font-medium text-md">
                    Port {port.port_number}
                  </div>
                  {port.isConnected || port.switch_port_id ? (
                    <div className="mt-1 space-y-1">
                      <div className="text-emerald-300 font-medium">
                        Connected to (Port {port.switch_port_id}) in{" "}
                        {port.switch?.name}
                      </div>
                    </div>
                  ) : port.isConnected ? (
                    <div className="text-emerald-300">
                      Connected (no device info)
                    </div>
                  ) : (
                    <div className="text-slate-400">Not connected</div>
                  )}

                  {/* Show cable info regardless of connection status */}
                  {(port.actualPort?.cable_number ||
                    port.actualPort?.cable_length) && (
                    <div className="mt-1 text-slate-200 text-xs">
                      {port.actualPort?.cable_number &&
                        `Cable: ${port.actualPort.cable_number}`}
                      {port.actualPort?.cable_number &&
                        port.actualPort?.cable_length &&
                        " | "}
                      {port.actualPort?.cable_length &&
                        `Length: ${port.actualPort.cable_length}`}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-1 h-1 bg-slate-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-100">
        Total: {allPorts.filter((p) => p.isConnected).length} / {totalPorts}{" "}
        ports connected
      </div>
    </div>
  );
}
