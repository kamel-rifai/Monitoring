import { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Activity,
  Phone,
  DoorOpen,
  Wifi,
  Cable,
  Search,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Link2,
  Unlink,
  Loader2,
  Check,
} from "lucide-react";

// ---------------------------------------------
// USAGE:
// <CableManagement
//   devices={apiData.devices}
//   switches={apiData.switches}
//   patchpanels={apiData.patchpanels}
//   apiBase="http://your-server:3666"
// />
// ---------------------------------------------

const API_BASE = "http://192.168.200.245:3666";

function buildCables(switches = [], devices = [], patchpanels = []) {
  const cables = [];
  const coveredPPPortIds = new Set();

  // Pass 1: switch ports that have a patch_panel_port
  for (const sw of switches) {
    for (const port of sw.ports ?? []) {
      const pp = port.patch_panel_port;
      if (!pp) continue;

      coveredPPPortIds.add(pp.id);

      // port.device is the full device object from your API
      const dev = port.device ?? null;
      const isOnline = dev ? dev.active === true && dev.show !== false : null;

      cables.push({
        _id: `sw-${sw.id}-${port.id}`,
        cableNumber: pp.cable_number ?? "-",
        length: pp.cable_length
          ? String(pp.cable_length).endsWith("m")
            ? pp.cable_length
            : pp.cable_length + "m"
          : "-",
        device: dev?.name ?? "-",
        deviceType: dev?.type ?? "unknown",
        deviceIp: dev?.IP ?? "-",
        deviceStatus:
          isOnline === null ? "unassigned" : isOnline ? "online" : "offline",
        patchPanel: pp.patch_panel?.title ?? "-",
        ppPortTitle: pp.title ?? `Port ${pp.port_number}`,
        ppPort: pp.port_number,
        switchName: sw.name,
        switchPort: port.port_number,
        floor: sw.floor ?? "-",
        unassigned: false,
      });
    }
  }

  // Pass 2: patch panel ports not covered by Pass 1 (Dahua / unlinked)
  for (const panel of patchpanels) {
    for (const ppPort of panel.ports ?? []) {
      if (coveredPPPortIds.has(ppPort.id)) continue;
      if (!ppPort.cable_number) continue;

      const swPort = ppPort.switch_port ?? null;
      const switchName = swPort?.switch?.name ?? "N/A";
      const switchPort = swPort?.port_number ?? "N/A";
      const switchModel = swPort?.switch?.model ?? null;
      const isDahua = switchModel
        ? switchModel.toUpperCase().startsWith("DH-")
        : false;

      const matchedDevice =
        devices.find((d) => d.cableNumber === ppPort.cable_number) ?? null;
      const isOnline = matchedDevice
        ? matchedDevice.active === true && matchedDevice.show !== false
        : null;

      cables.push({
        _id: `pp-${panel.id}-${ppPort.id}`,
        cableNumber: ppPort.cable_number ?? "N/A",
        length: ppPort.cable_length
          ? String(ppPort.cable_length).endsWith("m")
            ? ppPort.cable_length
            : ppPort.cable_length + "m"
          : "N/A",
        device: matchedDevice?.name ?? "N/A",
        deviceType: matchedDevice?.type ?? "unknown",
        deviceIp: matchedDevice?.IP ?? "N/A",
        deviceStatus:
          swPort === null
            ? "unknown"
            : isOnline === null
              ? "unassigned"
              : isOnline
                ? "online"
                : "offline",
        patchPanel: panel.title ?? "N/A",
        ppPortTitle: ppPort.title ?? `Port ${ppPort.port_number}`,
        ppPort: ppPort.port_number,
        switchName,
        switchPort,
        switchModel,
        isDahua,
        floor: panel.floor ?? "N/A",
        unassigned: true,
      });
    }
  }

  return cables;
}

// ── Icons ────────────────────────────────────────────────────────────────────
const DEVICE_ICONS: Record<string, any> = {
  camera: Camera,
  nursing: Activity,
  telephone: Phone,
  "access-door": DoorOpen,
  accesspoint: Wifi,
};

// ── Status map ───────────────────────────────────────────────────────────────
const STATUS: Record<
  string,
  { dot: string; text: string; badge: string; label: string }
> = {
  online: {
    dot: "bg-green-500",
    text: "text-green-700",
    badge: "bg-green-100",
    label: "Online",
  },
  offline: {
    dot: "bg-red-500",
    text: "text-red-700",
    badge: "bg-red-100",
    label: "Offline",
  },
  unknown: {
    dot: "bg-gray-400",
    text: "text-gray-500",
    badge: "bg-gray-100",
    label: "Unknown",
  },
  unassigned: {
    dot: "bg-orange-400",
    text: "text-orange-600",
    badge: "bg-orange-50",
    label: "Unassigned",
  },
};

// ── SelectFilter ─────────────────────────────────────────────────────────────
function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── Link Cables Tab ───────────────────────────────────────────────────────────
function LinkCablesTab({
  patchpanels,
  apiBase,
  onRefresh,
}: {
  patchpanels: any[];
  apiBase: string;
  onRefresh?: () => void;
}) {
  const base = apiBase || API_BASE;

  const [availablePorts, setAvailablePorts] = useState<any[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [saveState, setSaveState] = useState<Record<number, string>>({});
  const [confirmPending, setConfirmPending] = useState<{
    ppPort: any;
    switchPortId: number;
    cableNumber: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [portSearch, setPortSearch] = useState("");
  const PAGE_SIZE = 50;

  const floors = useMemo(() => {
    const f = new Set(patchpanels.map((p) => String(p.floor)).filter(Boolean));
    return [
      "All Floors",
      ...Array.from(f).sort((a, b) => Number(a) - Number(b)),
    ];
  }, [patchpanels]);

  const [selectedFloor, setSelectedFloor] = useState("All Floors");

  useEffect(() => {
    setLoadingPorts(true);
    const url =
      selectedFloor === "All Floors"
        ? `${base}/switches/available-ports`
        : `${base}/switches/available-ports?floor=${selectedFloor}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setAvailablePorts(data);
        setLoadingPorts(false);
      })
      .catch(() => setLoadingPorts(false));
  }, [selectedFloor, base]);

  const filteredPanels = useMemo(
    () =>
      selectedFloor === "All Floors"
        ? patchpanels
        : patchpanels.filter((p) => String(p.floor) === String(selectedFloor)),
    [patchpanels, selectedFloor],
  );

  const unlinkedPorts = useMemo(() => {
    const rows: any[] = [];
    for (const panel of filteredPanels) {
      for (const port of panel.ports ?? []) {
        if (!port.switch_port) {
          rows.push({
            ...port,
            panelTitle: panel.title,
            panelId: panel.id,
            panelFloor: panel.floor,
          });
        }
      }
    }
    return rows;
  }, [filteredPanels]);

  const totalPorts = useMemo(
    () => filteredPanels.reduce((s, p) => s + (p.ports?.length ?? 0), 0),
    [filteredPanels],
  );
  const linkedCount = totalPorts - unlinkedPorts.length;
  const progress =
    totalPorts > 0 ? Math.round((linkedCount / totalPorts) * 100) : 0;

  const portsBySwitch = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of availablePorts) {
      const key = p.switch?.name ?? "Unknown Switch";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [availablePorts]);

  const handleLink = useCallback(
    async (
      ppPortId: number,
      panelId: number,
      portNumber: number,
      switchPortId: number,
      cableNumber: string,
    ) => {
      if (!switchPortId) return;
      setSaveState((s) => ({ ...s, [ppPortId]: "saving" }));
      try {
        // 1. Link pp port to switch port
        const res = await fetch(
          `${base}/patchpanel/${panelId}/port/${portNumber}?switch_port_id=${switchPortId}`,
          { method: "POST" },
        );
        // 409 means already linked (e.g. double-click) — treat as success
        if (!res.ok && res.status !== 409)
          throw new Error(`Link failed: ${res.status}`);

        // 2. Auto-update device cableNumber
        // device is nested under swPort.switch.device per /switches/available-ports response
        const swPort = availablePorts.find((p) => p.id === switchPortId);
        const deviceId =
          swPort?.switch?.device?.id ?? swPort?.device?.id ?? null;

        if (
          deviceId != null &&
          cableNumber != null &&
          String(cableNumber).trim() !== ""
        ) {
          // Fetch the full device first so we don't overwrite existing fields with null
          const deviceRes = await fetch(`${base}/devices`);
          const deviceData = await deviceRes.json();
          const fullDevice = deviceData.devices?.find(
            (d: any) => d.id === deviceId,
          );

          if (fullDevice) {
            const editRes = await fetch(`${base}/edit/${deviceId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: fullDevice.name,
                type: fullDevice.type,
                model: fullDevice.model,
                floor: fullDevice.floor,
                place: fullDevice.place,
                cableNumber: String(cableNumber),
                Mac: fullDevice.Mac,
                IP: fullDevice.IP,
                Notes: fullDevice.Notes,
                show: fullDevice.show,
                active: fullDevice.active,
              }),
            });
            if (!editRes.ok)
              console.warn("cableNumber update failed:", await editRes.text());
          }
        }

        setSaveState((s) => ({ ...s, [ppPortId]: "saved" }));
        setAvailablePorts((prev) => prev.filter((p) => p.id !== switchPortId));
        onRefresh?.();
      } catch (err) {
        console.error("handleLink error:", err);
        setSaveState((s) => ({ ...s, [ppPortId]: "error" }));
      }
    },
    [availablePorts, base],
  );

  return (
    <div>
      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-bold text-gray-700">
              Linking Progress
            </span>
            <span className="ml-2 text-xs text-gray-400">
              {linkedCount} of {totalPorts} ports linked
            </span>
          </div>
          <span className="text-2xl font-bold text-blue-600 font-mono">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          <span className="text-xs text-green-600 font-semibold">
            {linkedCount} linked
          </span>
          <span className="text-xs text-orange-500 font-semibold">
            {unlinkedPorts.length} remaining
          </span>
        </div>
      </div>

      {/* Floor filter */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-gray-500">Floor:</span>
        <div className="flex gap-2 flex-wrap">
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer
                ${
                  String(selectedFloor) === String(f)
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {unlinkedPorts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-green-300 py-16 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-green-600">
            All ports on this floor are linked!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search + pagination bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Search cable #, panel..."
                value={portSearch}
                onChange={(e) => {
                  setPortSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium shrink-0">
              Showing {Math.min((page + 1) * PAGE_SIZE, unlinkedPorts.length)}{" "}
              of {unlinkedPorts.length} unlinked
            </span>
            <div className="flex gap-1 shrink-0">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500 font-mono">
                {page + 1} /{" "}
                {Math.max(1, Math.ceil(unlinkedPorts.length / PAGE_SIZE))}
              </span>
              <button
                disabled={(page + 1) * PAGE_SIZE >= unlinkedPorts.length}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
          <div
            className="bg-gray-50 border-b border-gray-200 px-5 py-3"
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 90px 80px 1fr 110px",
            }}
          >
            {[
              "Cable #",
              "PP Port",
              "Length",
              "Floor",
              "Link to Switch Port",
              "Status",
            ].map((h) => (
              <span
                key={h}
                className="text-xs font-bold text-gray-400 uppercase tracking-wider"
              >
                {h}
              </span>
            ))}
          </div>

          {unlinkedPorts
            .filter((port) => {
              if (!portSearch.trim()) return true;
              const q = portSearch.toLowerCase();
              return (
                String(port.cable_number ?? "")
                  .toLowerCase()
                  .includes(q) ||
                (port.panelTitle ?? "").toLowerCase().includes(q) ||
                (port.title ?? "").toLowerCase().includes(q)
              );
            })
            .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
            .map((port) => {
              const state = saveState[port.id];
              return (
                <div
                  key={port.id}
                  className="px-5 py-3 border-b border-gray-100 items-center hover:bg-gray-50"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr 90px 80px 1fr 110px",
                  }}
                >
                  <span className="text-sm font-mono font-bold text-blue-700">
                    {port.cable_number ?? "-"}
                  </span>

                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {port.panelTitle}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {port.title ?? `Port ${port.port_number}`}
                    </div>
                  </div>

                  <span className="text-sm text-gray-500">
                    {port.cable_length
                      ? String(port.cable_length).endsWith("m")
                        ? port.cable_length
                        : port.cable_length + "m"
                      : "-"}
                  </span>
                  <span className="text-sm text-gray-500">
                    Floor {port.panelFloor}
                  </span>

                  {state === "saved" ? (
                    <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Linked!
                    </span>
                  ) : (
                    <div className="relative mr-3">
                      <select
                        disabled={loadingPorts || state === "saving"}
                        defaultValue=""
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val)
                            setConfirmPending({
                              ppPort: port,
                              switchPortId: val,
                              cableNumber: port.cable_number ?? "",
                            });
                        }}
                        className="appearance-none w-full bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-gray-700 cursor-pointer focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                      >
                        <option value="" disabled>
                          {loadingPorts
                            ? "Loading..."
                            : "Select switch port..."}
                        </option>
                        {Object.entries(portsBySwitch).map(
                          ([swName, ports]) => (
                            <optgroup key={swName} label={swName}>
                              {(ports as any[]).map((p) => (
                                <option key={p.id} value={p.id}>
                                  Port {p.port_number}
                                  {p.device
                                    ? ` — ${p.device.name} (${p.device.type})`
                                    : p.switch?.device
                                      ? ` — ${p.switch.device.name} (${p.switch.device.type})`
                                      : " — empty"}
                                </option>
                              ))}
                            </optgroup>
                          ),
                        )}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  <div className="flex items-center">
                    {state === "saving" && (
                      <span className="flex items-center gap-1 text-xs text-blue-500 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                      </span>
                    )}
                    {state === "saved" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                    {state === "error" && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Error - retry
                      </span>
                    )}
                    {!state && (
                      <span className="text-xs text-gray-300">pending</span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
      {/* Confirm Dialog — floating bubbles on overlay, no outer card */}
      {confirmPending &&
        (() => {
          const { ppPort, switchPortId, cableNumber } = confirmPending;
          const swPort = availablePorts.find((p) => p.id === switchPortId);
          const deviceName =
            swPort?.device?.name ?? swPort?.switch?.device?.name ?? null;
          const deviceType =
            swPort?.device?.type ?? swPort?.switch?.device?.type ?? null;
          const switchName = swPort?.switch?.name ?? "Unknown Switch";
          const portNum = swPort?.port_number;
          const cableLen = ppPort.cable_length
            ? String(ppPort.cable_length).endsWith("m")
              ? ppPort.cable_length
              : ppPort.cable_length + "m"
            : "-";
          return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/50 backdrop-blur-sm p-10">
              {/* X */}
              <button
                onClick={() => setConfirmPending(null)}
                className="absolute right-4 top-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="h-11 w-11 text-white" />
              </button>

              {/* Floating title */}
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  Confirm Cable Link
                </h3>
                <p className="text-sm text-white/50 mt-1">
                  Review the full path before saving
                </p>
              </div>

              {/* 4 independent bubbles with arrows */}
              <div className="flex items-center gap-4">
                <div className="bg-white/30 ring-1 ring-white/80 rounded-lg px-6 py-5 flex flex-col gap-1.5 min-w-[140px]">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                    Device
                  </p>
                  {deviceName ? (
                    <>
                      <p className="text-white font-semibold text-sm leading-tight">
                        {deviceName}
                      </p>
                      <p className="text-white/50 text-xs capitalize">
                        {deviceType}
                      </p>
                    </>
                  ) : (
                    <p className="text-orange-300 text-sm font-semibold">
                      No device yet
                    </p>
                  )}
                </div>

                <span className="text-white/40 text-3xl leading-none">›</span>

                <div className="bg-white/30 ring-1 ring-white/80 rounded-lg px-6 py-5 flex flex-col gap-1.5 min-w-[130px]">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                    Cable
                  </p>
                  <p className="text-white font-bold font-mono text-sm">
                    #{cableNumber}
                  </p>
                  <p className="text-white/50 text-xs">{cableLen}</p>
                </div>

                <span className="text-white/40 text-3xl leading-none">›</span>

                <div className="bg-white/30 ring-1 ring-white/80 rounded-lg px-6 py-5 flex flex-col gap-1.5 min-w-[140px]">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                    Patch Panel
                  </p>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {ppPort.panelTitle}
                  </p>
                  <p className="text-white/50 text-xs">
                    {ppPort.title ?? `Port ${ppPort.port_number}`}
                  </p>
                </div>

                <span className="text-white/40 text-3xl leading-none">›</span>

                <div className="bg-white/30 ring-1 ring-white/80 rounded-lg px-6 py-5 flex flex-col gap-1.5 min-w-[140px]">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                    Switch Port
                  </p>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {switchName}
                  </p>
                  <p className="text-white/50 text-xs">Port {portNum}</p>
                </div>
              </div>

              {/* Floating notice bubble */}
              {deviceName && (
                <div className="bg-white/30 ring-1 ring-white/80 rounded-lg px-6 py-3 flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-300 shrink-0" />
                  <p className="text-sm text-white/80">
                    Cable{" "}
                    <span className="text-white font-bold">#{cableNumber}</span>{" "}
                    will be assigned to{" "}
                    <span className="text-white font-bold">{deviceName}</span>
                  </p>
                </div>
              )}

              {/* Floating buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmPending(null)}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white/80 bg-white/10 ring-1 ring-white/30 hover:bg-white/20 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLink(
                      ppPort.id,
                      ppPort.panelId,
                      ppPort.port_number,
                      switchPortId,
                      cableNumber,
                    );
                    setConfirmPending(null);
                  }}
                  className="px-7 py-2.5 rounded-lg text-sm font-bold text-white bg-slate-900/80 ring-1 ring-white/20 hover:bg-slate-900 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Confirm Link
                </button>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
// mirrors DeviceModal's Field component
function ConfirmField({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1${full ? " sm:col-span-2" : ""}`}>
      {label && (
        <span className="text-xs font-medium text-white/90">{label}</span>
      )}
      {children}
    </label>
  );
}

export default function CableManagement({
  devices = [] as any[],
  switches = [] as any[],
  patchpanels = [] as any[],
  apiBase = API_BASE,
  onRefresh,
}: {
  devices?: any[];
  switches?: any[];
  patchpanels?: any[];
  apiBase?: string;
  onRefresh?: () => void;
}) {
  const allCables = useMemo(
    () => buildCables(switches, devices, patchpanels),
    [switches, devices, patchpanels],
  );

  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [filterFloor, setFilterFloor] = useState("All Floors");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [expanded, setExpanded] = useState<string | null>(null);

  const floors = useMemo(
    () => ["All Floors", ...new Set(allCables.map((c) => c.floor))],
    [allCables],
  );
  const types = useMemo(
    () => [
      "All Types",
      ...new Set(
        allCables.map((c) => c.deviceType).filter((t) => t && t !== "unknown"),
      ),
    ],
    [allCables],
  );

  const filteredCables = useMemo(
    () =>
      allCables.filter((c) => {
        const q = search.toLowerCase();
        if (
          q &&
          !c.cableNumber.toLowerCase().includes(q) &&
          !c.device.toLowerCase().includes(q) &&
          !c.deviceIp.includes(q) &&
          !c.patchPanel.toLowerCase().includes(q)
        )
          return false;
        if (
          filterFloor !== "All Floors" &&
          String(c.floor) !== String(filterFloor)
        )
          return false;
        if (filterType !== "All Types" && c.deviceType !== filterType)
          return false;
        if (filterStatus !== "All Status" && c.deviceStatus !== filterStatus)
          return false;
        return true;
      }),
    [allCables, search, filterFloor, filterType, filterStatus],
  );

  const stats = useMemo(
    () => ({
      total: allCables.length,
      online: allCables.filter((c) => c.deviceStatus === "online").length,
      offline: allCables.filter((c) => c.deviceStatus === "offline").length,
      unassigned: allCables.filter((c) => c.deviceStatus === "unassigned")
        .length,
      unknown: allCables.filter((c) => c.deviceStatus === "unknown").length,
    }),
    [allCables],
  );

  const unlinkedCount = useMemo(
    () =>
      patchpanels.reduce(
        (s, p) =>
          s + (p.ports ?? []).filter((pp: any) => !pp.switch_port).length,
        0,
      ),
    [patchpanels],
  );

  return (
    <div className="min-h-screen bg-gray-100 p-7 text-gray-900 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-1 h-14 bg-blue-600 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Cable Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Trace and audit all cable paths across the building
            </p>
          </div>
        </div>
        <div className="flex bg-gray-200 rounded-xl p-1 gap-1">
          {(
            [
              ["table", "Table View"],
              ["link", "Link Cables"],
            ] as [string, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer relative
                ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {label}
              {v === "link" && unlinkedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unlinkedCount > 9 ? "9+" : unlinkedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          {
            label: "Total Cables",
            value: stats.total,
            colorText: "text-blue-700",
            colorBg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Active Paths",
            value: stats.online,
            colorText: "text-green-700",
            colorBg: "bg-green-50",
            border: "border-green-100",
          },
          {
            label: "Flagged Paths",
            value: stats.offline,
            colorText: "text-red-700",
            colorBg: "bg-red-50",
            border: "border-red-100",
          },
          {
            label: "Unassigned",
            value: stats.unassigned,
            colorText: "text-orange-600",
            colorBg: "bg-orange-50",
            border: "border-orange-100",
          },
          {
            label: "Unknown",
            value: stats.unknown,
            colorText: "text-gray-500",
            colorBg: "bg-gray-50",
            border: "border-gray-100",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.colorBg} ${s.border} border rounded-xl px-5 py-3 flex flex-col gap-0.5 hover:-translate-y-0.5 transition-transform`}
          >
            <span
              className={`text-3xl font-bold ${s.colorText} leading-none font-mono`}
            >
              {s.value}
            </span>
            <span className={`text-xs font-semibold ${s.colorText} opacity-80`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {view === "link" ? (
        <LinkCablesTab
          patchpanels={patchpanels}
          apiBase={apiBase}
          onRefresh={onRefresh}
        />
      ) : (
        <div>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Search cable #, device, IP, patch panel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <SelectFilter
              value={filterFloor}
              onChange={setFilterFloor}
              options={floors as string[]}
            />
            <SelectFilter
              value={filterType}
              onChange={setFilterType}
              options={types as string[]}
            />
            <SelectFilter
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                "All Status",
                "online",
                "offline",
                "unassigned",
                "unknown",
              ]}
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div
              className="bg-gray-50 border-b border-gray-200 px-5 py-3"
              style={{
                display: "grid",
                gridTemplateColumns: "110px 70px 1fr 1fr 1fr 90px",
              }}
            >
              {[
                "Cable #",
                "Length",
                "Device",
                "Patch Panel",
                "Switch / Port",
                "Status",
              ].map((h) => (
                <span
                  key={h}
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>

            {filteredCables.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm font-medium">
                {allCables.length === 0
                  ? "No cable data found — ensure switch ports have patch panel connections."
                  : "No cables match your filters."}
              </div>
            ) : (
              filteredCables.map((cable) => {
                const isOffline = cable.deviceStatus === "offline";
                const isUnassigned = cable.deviceStatus === "unassigned";
                const st = STATUS[cable.deviceStatus] ?? STATUS.unknown;
                const IconComp = DEVICE_ICONS[cable.deviceType];

                return (
                  <div key={cable._id}>
                    <div
                      onClick={() =>
                        setExpanded(expanded === cable._id ? null : cable._id)
                      }
                      className={`px-5 py-3 items-center border-b border-gray-100 cursor-pointer transition-colors
                      ${
                        isOffline
                          ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100"
                          : isUnassigned
                            ? "bg-orange-50 border-l-4 border-l-orange-400 hover:bg-orange-100"
                            : "border-l-4 border-l-transparent hover:bg-blue-50"
                      }`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px 70px 1fr 1fr 1fr 90px",
                      }}
                    >
                      <span className="text-sm font-mono font-bold text-blue-700">
                        {cable.cableNumber}
                      </span>
                      <span className="text-sm text-gray-500">
                        {cable.length}
                      </span>

                      <div className="flex items-center gap-2">
                        {IconComp && (
                          <IconComp
                            className={`w-4 h-4 ${isOffline ? "text-red-400" : "text-gray-400"}`}
                          />
                        )}
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {cable.device}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 font-medium">
                          {cable.ppPortTitle}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {cable.patchPanel}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 font-medium">
                          {cable.switchName}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          Port {cable.switchPort}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span className={`text-xs font-semibold ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {expanded === cable._id && (
                      <div
                        className={`px-5 py-4 border-b border-gray-100
                      ${isOffline ? "bg-red-50" : isUnassigned ? "bg-orange-50" : "bg-blue-50"}`}
                      >
                        {/* Path chain */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            {
                              label: "Device",
                              value: cable.device,
                              Icon: Cable,
                            },
                            {
                              label: "Cable",
                              value: `#${cable.cableNumber} (${cable.length})`,
                              Icon: Cable,
                            },
                            {
                              label: "Patch Panel",
                              value: `${cable.patchPanel} — ${cable.ppPortTitle}`,
                              Icon: Cable,
                            },
                            {
                              label: "Switch",
                              value: `${cable.switchName} — Port ${cable.switchPort}`,
                              Icon: Cable,
                            },
                          ].map((node, i) => (
                            <div key={i} className="flex items-center gap-1">
                              {i > 0 && (
                                <span className="text-gray-300 font-mono mx-1">
                                  →
                                </span>
                              )}
                              <div
                                className={`flex items-center gap-2 border rounded-xl px-3 py-2
                              ${
                                isOffline
                                  ? "bg-red-100 border-red-200"
                                  : isUnassigned
                                    ? "bg-orange-100 border-orange-200"
                                    : "bg-blue-100 border-blue-200"
                              }`}
                              >
                                <div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                                    {node.label}
                                  </div>
                                  <div
                                    className={`text-xs font-semibold
                                  ${
                                    isOffline
                                      ? "text-red-700"
                                      : isUnassigned
                                        ? "text-orange-700"
                                        : "text-blue-700"
                                  }`}
                                  >
                                    {node.value}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="mt-3 flex gap-4 flex-wrap">
                          {[
                            ["IP", cable.deviceIp],
                            ["Type", cable.deviceType],
                            ["Floor", cable.floor],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                {k}
                              </div>
                              <div className="text-xs font-semibold text-gray-600">
                                {v}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Hints */}
                        {cable.deviceStatus === "unknown" && (
                          <div className="mt-3 flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 w-fit">
                            <Unlink className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-600">
                              No switch port linked — use Link Cables tab to fix
                              this
                            </span>
                          </div>
                        )}
                        {cable.deviceStatus === "unassigned" &&
                          !cable.isDahua && (
                            <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-300 rounded-lg px-3 py-1.5 w-fit">
                              <Link2 className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-xs font-semibold text-orange-600">
                                Switch port linked but no device connected
                              </span>
                            </div>
                          )}
                        {cable.isDahua && (
                          <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-300 rounded-lg px-3 py-1.5 w-fit">
                            <Link2 className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs font-semibold text-orange-600">
                              Dahua switch ({cable.switchModel}) — no RouterOS
                              API
                            </span>
                          </div>
                        )}
                        {isOffline && (
                          <div className="mt-3 flex items-center gap-2 bg-red-100 border border-red-300 rounded-lg px-3 py-1.5 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs font-semibold text-red-700">
                              Device offline — path flagged
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
