import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import type { Device, Switch, PatchPanel } from "@shared/api";
import { cn } from "@/lib/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import { X, FilePenLine, CheckCheck, Loader } from "lucide-react";

export interface DeviceModalProps {
  open: boolean;
  device: Device | null;
  mode: "view" | "edit" | "add";
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (device: Device) => void;
  switches?: Switch[]; // Add switches prop to find connection info
  patchPanels?: PatchPanel[]; // Add patchPanels prop to find patch panel connections
}

const TYPES = [
  "camera",
  "telephone",
  "nursing",
  "accesspoint",
  "access-door",
  "switch",
  "patch-panel",
] as const;

export function DeviceModal({
  open,
  device,
  mode,
  isSubmitting = false,
  onOpenChange,
  onSave,
  switches = [],
  patchPanels = [],
}: DeviceModalProps) {
  const isAdd = mode === "add";
  const isEdit = mode === "edit";

  // Find the switch and port this device is connected to
  const connectionInfo = useMemo(() => {
    if (!device || !switches.length) return null;

    for (const switchDevice of switches) {
      for (const port of switchDevice.ports) {
        if (port.device && String(port.device.id) === String(device.id)) {
          return {
            switchName: switchDevice.name,
            switchId: switchDevice.id,
            portNumber: port.port_number,
            portTitle: port.title,
          };
        }
      }
    }
    return null;
  }, [device, switches]);

  // Find patch panel port this device is connected to
  const patchPanelConnection = useMemo(() => {
    if (!device || !patchPanels.length) return null;

    for (const patchPanel of patchPanels) {
      for (const port of patchPanel.ports) {
        if (port.switch_port && port.switch_port.switch) {
          // Find if this patch panel port connects to a switch port that has our device
          const connectedSwitchPort = port.switch_port;
          const switchDevice = switches.find(
            (s) => s.id === connectedSwitchPort.switch.id,
          );

          if (switchDevice) {
            const switchPort = switchDevice.ports.find(
              (sp) => sp.port_number === connectedSwitchPort.port_number,
            );

            if (
              switchPort &&
              switchPort.device &&
              String(switchPort.device.id) === String(device.id)
            ) {
              return {
                patchPanelName: patchPanel.title,
                patchPanelId: patchPanel.id,
                portNumber: port.port_number,
                portTitle: port.title,
                cableNumber: port.cable_number,
              };
            }
          }
        }
      }
    }
    return null;
  }, [device, patchPanels, switches]);
  const base: Device = useMemo(() => {
    if (device) {
      return device;
    }
    return {
      id: 0,
      name: "",
      type: "camera",
      floor: 0,
      active: true,
      model: "",
      place: "",
      Mac: "",
      IP: "",
      Notes: "",
      show: true,
      cableNumber: "",
      date: new Date().toISOString(),
    };
  }, [device]);

  const [form, setForm] = useState<Device>(base);
  useEffect(() => setForm(base), [base, open]);

  function capitalizeFirstLetter(inputString: string): string {
    if (inputString.length === 0) {
      return ""; // Handle empty strings
    }
    return inputString.charAt(0).toUpperCase() + inputString.slice(1);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full h-full flex items-center justify-center border-slate-200 bg-black/50 backdrop-blur-sm p-10 shadow-xl">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-11 w-11 text-white" />
        </DialogClose>
        {/*<div className="flex flex-col items-center justify-center">*/}
        <div className="flex items-start justify-center gap-5">
          {!isAdd && (
            <div className="my-10">
              <div className="w-64 h-64 bg-white/30 rounded-lg ring-1 ring-white/80 flex items-center justify-center relative">
                <span className="text-white text-sm text-center">
                  <img
                    src={`/images/${form.model}.png`}
                    alt="Device Photo"
                    width={240}
                    height={240}
                  />
                </span>
                <div
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full shadow-lg animate-color-pulse ${
                    form.active
                      ? "bg-green-600 shadow-green-400/60"
                      : "bg-red-500 shadow-red-400/60"
                  }`}
                ></div>
              </div>
              <div className="w-64 h-10 mt-4 bg-white/30 rounded-lg ring-1 ring-white/80 flex items-center justify-center">
                <span className="text-white text-sm text-center">
                  {connectionInfo
                    ? `Switch: ${connectionInfo.switchName} - Port ${connectionInfo.portNumber}`
                    : "Not Connected - No Data"}
                </span>
              </div>
              {patchPanelConnection && (
                <div className="w-64 h-10 mt-4 bg-white/30 rounded-lg ring-1 ring-white/80 flex items-center justify-center">
                  <span className="text-white text-sm text-center">
                    {`${patchPanelConnection.patchPanelName} - Port ${patchPanelConnection.portNumber}`}
                    {patchPanelConnection.cableNumber && ``}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="bg-white/30 rounded-lg ring-1 ring-white/80 my-10 pb-5">
            <div className="p-6 flex justify-between">
              <DialogHeader>
                <DialogTitle className="text-lg text-white ">
                  {isAdd
                    ? "Add Device"
                    : isEdit
                      ? "Edit Device"
                      : "Device Details"}
                </DialogTitle>
                <DialogDescription className="text-white">
                  {isAdd
                    ? "Create a new device entry"
                    : "View and edit device information"}
                </DialogDescription>
              </DialogHeader>
              {!isEdit && !isSubmitting && !isAdd ? (
                <FilePenLine
                  className="text-white p-2 size-10 hover:bg-white/20 cursor-pointer rounded-xl"
                  onClick={() => {
                    onSave({ ...form });
                  }}
                />
              ) : isSubmitting ? (
                <Loader className="text-white p-2 size-10 animate-spin opacity-60" />
              ) : (
                <CheckCheck
                  className="text-white p-2 size-10 hover:bg-white/20 cursor-pointer rounded-xl"
                  onClick={() => {
                    onSave({ ...form });
                  }}
                />
              )}
            </div>

            <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
              {/* Device Photo */}

              {!isAdd && !isEdit && (
                <Field label="ID">
                  <input
                    className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    value={String(form.id)}
                    readOnly
                  />
                </Field>
              )}
              {isEdit && (
                <Field label="Show">
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    value={form.show ? "yes" : "no"}
                    disabled={!isEdit && !isAdd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, show: e.target.value === "yes" }))
                    }
                  >
                    <option value="yes">Visible</option>
                    <option value="no">Hidden</option>
                  </select>
                </Field>
              )}
              <Field label="Type">
                <select
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.type}
                  disabled={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {capitalizeFirstLetter(t)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Name">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.name}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. CCTV 01"
                />
              </Field>
              <Field label="Floor">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  type="number"
                  min={0}
                  max={12}
                  value={form.floor}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      floor: parseInt(e.target.value || "0", 10),
                    }))
                  }
                />
              </Field>
              <Field label="Model">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.model ?? ""}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, model: e.target.value }))
                  }
                />
              </Field>
              <Field label="Cable Number">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.cableNumber ?? ""}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cableNumber: e.target.value }))
                  }
                />
              </Field>
              <Field label="MAC">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.Mac ?? "No MAC address"}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, Mac: e.target.value }))
                  }
                />
              </Field>
              <Field label="IP">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.IP ?? "No IP address"}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, IP: e.target.value }))
                  }
                />
              </Field>

              <Field label="Notes" full>
                <textarea
                  className="min-h-10 w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.Notes ?? ""}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, Notes: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
          {/*</div>*/}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1", full && "sm:col-span-2")}>
      <span className="text-xs font-medium text-white/90">{label}</span>
      {children}
    </label>
  );
}

function toLocalDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalDateTime(v: string) {
  const d = new Date(v);
  return d.toISOString();
}

// simple button styles
const base =
  "inline-flex items-center justify-center rounded-md border text-sm px-3 py-2 transition";
export const styles = {
  btn: cn(
    base,
    "border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
  ),
  btnPrimary: cn(
    base,
    "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-900",
  ),
};
