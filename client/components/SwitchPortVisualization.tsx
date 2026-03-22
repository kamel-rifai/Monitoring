import { cn } from "@/lib/utils";
import { EthernetPort, Wifi, Monitor, Loader2, RefreshCw } from "lucide-react";
import type { Switch } from "@shared/api";
import { useEffect, useState } from "react";

const API_BASE = "http://192.168.200.245:3666";

interface ConnectedHost {
  mac: string;
  port: string; // e.g. "ether5"
  ip: string | null;
  hostname: string | null;
}

interface SwitchPortVisualizationProps {
  switchDevice: Switch;
  onPortClick?: (port: Switch["ports"][0]) => void;
  readOnly?: boolean;
  isAddMode?: boolean;
}

type ExtendedSwitchPort = Switch["ports"][0] & {
  isConnected: boolean;
};

export function SwitchPortVisualization({
  switchDevice,
  onPortClick,
  readOnly = false,
  isAddMode = false,
}: SwitchPortVisualizationProps) {
  const [hosts, setHosts] = useState<ConnectedHost[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [hostsError, setHostsError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchHosts = () => {
    if (!switchDevice.id || isAddMode) return;
    setLoadingHosts(true);
    setHostsError(null);
    fetch(`${API_BASE}/switches/connected-hosts/${switchDevice.id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setHosts(data.hosts ?? []);
        setLastFetched(new Date());
        setLoadingHosts(false);
      })
      .catch((e) => {
        setHostsError(e.message);
        setLoadingHosts(false);
      });
  };

  useEffect(() => {
    fetchHosts();
  }, [switchDevice.id]);

  // Build a port-number → host map from live data
  // MikroTik returns "ether5" → strip to "5"
  const portNumToHost: Record<string, ConnectedHost> = {};
  for (const h of hosts) {
    const num = h.port.replace(/\D/g, "");
    if (num) portNumToHost[num] = h;
  }

  const totalPorts = isAddMode
    ? switchDevice.total_ports || 12
    : Math.max(switchDevice.total_ports || 48, switchDevice.ports.length);

  const allPorts: ExtendedSwitchPort[] = Array.from(
    { length: totalPorts },
    (_, i) => {
      const portNumber = i + 1;
      const actualPort = switchDevice.ports.find(
        (p) => p.port_number === portNumber,
      );
      const portData = actualPort ?? {
        id: null,
        unique_id: "",
        port_number: portNumber,
        title: `Port ${portNumber}`,
        switch_id: Number(switchDevice.id),
        device_id: null,
        switch: {
          id: Number(switchDevice.id),
          name: switchDevice.name,
          type: "switch" as const,
          floor: switchDevice.floor,
          active: switchDevice.active,
          model: switchDevice.model,
          place: switchDevice.place,
          Mac: switchDevice.Mac,
          IP: switchDevice.IP,
          Notes: switchDevice.Notes,
        },
        device: null,
      };
      return { ...portData, isConnected: portData.device != null };
    },
  );

  const getStatusColor = (status: string, device_type?: string) => {
    if (status === "live") return "bg-sky-500 hover:bg-sky-400 border-sky-400";
    if (status === "connected") {
      const typeColorMap: Record<string, string> = {
        telephone: "bg-emerald-400 border border-emerald-500",
        camera: "bg-yellow-500 border border-yellow-600",
        nursing: "bg-blue-400 border border-blue-500",
        pmd: "bg-white/70 border border-white",
        network: "bg-rose-400 border border-rose-500",
        accesspoint: "bg-black/70 border border-black",
        training: "bg-white/70",
      };
      return device_type && typeColorMap[device_type]
        ? typeColorMap[device_type]
        : "bg-emerald-500 border-emerald-600";
    }
    return "bg-slate-500/40 hover:bg-slate-600 border-slate-600";
  };

  const connectedCount = allPorts.filter((p) => p.isConnected).length;
  const liveCount = Object.keys(portNumToHost).length;

  return (
    <div className="bg-black/15 rounded-lg p-4 ring-2 ring-black/20">
      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Switch Port Configuration
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs flex-wrap">
          {[
            { color: "bg-emerald-400", label: "Telephone" },
            { color: "bg-yellow-400", label: "CCTV" },
            { color: "bg-blue-400", label: "Nursing" },
            { color: "bg-white/70", label: "PMD" },
            { color: "bg-rose-400", label: "Network" },
            { color: "bg-black/70", label: "AP" },
            { color: "bg-white/70", label: "Training" },
            { color: "bg-sky-400", label: "Live Host" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ports Grid ── */}
      <div className="grid grid-cols-12 gap-3">
        {allPorts.map((port) => {
          const liveHost = portNumToHost[String(port.port_number)];
          const status = liveHost
            ? "live"
            : port.isConnected
              ? "connected"
              : "disconnected";

          return (
            <div
              key={port.port_number}
              onClick={() => onPortClick?.(port)}
              className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-1 rounded-none border-2 transition-all duration-200 hover:shadow-lg",
                  getStatusColor(status, port.device?.type),
                )}
              >
                {liveHost ? (
                  <Monitor className="size-6 mb-1 text-white" />
                ) : (
                  <EthernetPort
                    className={cn(
                      "size-6 mb-1",
                      status === "connected" ? "text-white" : "text-white/70",
                    )}
                  />
                )}
                <span className="text-xs font-mono text-white">
                  {String(port.port_number).padStart(2, "0")}
                </span>
                {/* Status dot */}
                <div
                  className={cn(
                    "absolute top-1 right-1 w-1.5 h-1.5 rounded-full",
                    status === "connected"
                      ? "bg-white/30 animate-pulse"
                      : status === "live"
                        ? "bg-white animate-pulse"
                        : "bg-slate-400/30",
                  )}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs">
                <div className="font-medium text-md">
                  Port {port.port_number}
                </div>

                {/* DB device info */}
                {port.device ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-emerald-300 font-medium">
                      Connected to: {port.device.name}
                    </div>
                    <div className="text-slate-200">
                      {port.device.type} · Floor {port.device.floor}
                    </div>
                    {port.device.IP && (
                      <div className="text-slate-400">IP: {port.device.IP}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 mt-1">Not in database</div>
                )}

                {/* Live host info */}
                {liveHost && (
                  <div className="mt-2 pt-2 border-t border-slate-700 space-y-0.5">
                    <div className="text-sky-300 font-semibold flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> Live Host Detected
                    </div>
                    {liveHost.hostname && (
                      <div className="text-slate-200">{liveHost.hostname}</div>
                    )}
                    {liveHost.ip && (
                      <div className="text-slate-400">IP: {liveHost.ip}</div>
                    )}
                    <div className="text-slate-500 font-mono text-[10px]">
                      {liveHost.mac}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span>
            <span className="text-white font-semibold">{connectedCount}</span>
            <span className="text-slate-400">/{totalPorts} in DB</span>
          </span>
          {!isAddMode && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-white font-semibold">{liveCount}</span>
              <span className="text-slate-400"> live hosts</span>
            </span>
          )}
          {lastFetched && (
            <span className="text-slate-500">
              Updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
          {hostsError && (
            <span className="text-red-400">Live data unavailable</span>
          )}
        </div>

        {/* Refresh button */}
        {!isAddMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchHosts();
            }}
            disabled={loadingHosts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 bg-white/10 hover:bg-white/20 transition-all cursor-pointer disabled:opacity-40"
          >
            {loadingHosts ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {loadingHosts ? "Scanning..." : "Refresh"}
          </button>
        )}
      </div>
    </div>
  );
}
