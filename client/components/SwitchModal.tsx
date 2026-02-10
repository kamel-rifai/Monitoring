import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import type { Switch, Device } from "@shared/api";
import { cn } from "@/lib/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { SwitchPortVisualization } from "./SwitchPortVisualization";
import { PortConfigModal } from "./PortConfigModal";
import { getUnlinkedDevices, AutoPortsDetect } from "@/lib/api";

// Switch model configuration
const SWITCH_MODELS = {
  "CRS328-24P-4S+RM": {
    total_ports: 24,
    total_fiber_ports: 4,
    POE: true,
  },
  "CRS326-24G-2S+RM": {
    total_ports: 24,
    total_fiber_ports: 2,
    POE: false,
  },
  "CRS354-48G-4S+2Q+RM": {
    total_ports: 48,
    total_fiber_ports: 4,
    POE: false,
  },
  "CRS354-48P-4S+2Q+RM": {
    total_ports: 48,
    total_fiber_ports: 4,
    POE: true,
  },
  "CRS317-1G-16S+RM": {
    total_ports: 1,
    total_fiber_ports: 16,
    POE: false,
  },
  "CCR2116-12G-4S+": {
    total_ports: 12,
    total_fiber_ports: 4,
    POE: false,
  },
  "DH-PFS4218-16GT-190": {
    total_ports: 16,
    total_fiber_ports: 2,
    POE: false,
  },
  "DH-PFS4218-16GT-240": {
    total_ports: 16,
    total_fiber_ports: 2,
    POE: false,
  },
} as const;

export interface SwitchModalProps {
  open: boolean;
  switch: Switch | null;
  mode: "view" | "edit" | "add";
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (switchDevice: Switch) => void;
  availableDevices?: Device[];
}

export function SwitchModal({
  open,
  switch: switchDevice,
  mode,
  isSubmitting = false,
  onOpenChange,
  onSave,
  availableDevices = [],
}: SwitchModalProps) {
  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const [selectedPort, setSelectedPort] = useState<Switch["ports"][0] | null>(
    null,
  );
  const [portConfigOpen, setPortConfigOpen] = useState(false);
  const [unlinkedDevices, setUnlinkedDevices] = useState<Device[]>([]);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  // Fetch unlinked devices when modal opens
  useEffect(() => {
    if (open) {
      getUnlinkedDevices().then(setUnlinkedDevices);
    }
  }, [open]);
  const base: Switch = useMemo(
    () =>
      switchDevice ?? {
        id: "",
        name: "",
        type: "switch",
        floor: 0,
        active: true,
        unique_id: "",
        model: "CRS328-24P-4S+RM",
        place: "",
        Mac: "",
        IP: "",
        Notes: "",
        ports: [],
        show: true,
        POE: false,
        total_ports: 12,
        total_fiber_ports: 0,
      },
    [switchDevice],
  );

  const [form, setForm] = useState<any>(base);
  useEffect(() => {
    setForm(base);

    // Update ports with correct switch_id when form changes
    if (base.id && base.ports) {
      const updatedPorts = base.ports.map((port: any) => ({
        ...port,
        switch_id: Number(base.id),
        switch: {
          ...port.switch,
          id: Number(base.id),
        },
      }));
      setForm((prev) => ({ ...base, ports: updatedPorts }));
    } else {
      setForm(base);
    }
  }, [base, open]);

  const canSave = form.name && form.type && form.floor >= 0 && form.floor <= 16;

  const handlePortUpdate = (updatedPort: any) => {
    setForm((prev: any) => ({
      ...prev,
      ports: prev.ports.map((port: any) =>
        port.port_number === updatedPort.port_number ? updatedPort : port,
      ),
    }));
  };

  const handleAutoAssignPorts = async () => {
    if (!form.id) return;

    setIsAutoAssigning(true);
    try {
      const updatedSwitch = await AutoPortsDetect({ switchId: form.id });
      setForm(updatedSwitch);
    } catch (error) {
      console.error("Failed to auto-assign ports:", error);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full h-full flex items-center justify-center border-slate-200 bg-black/50 backdrop-blur-sm p-10 shadow-xl">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-11 w-11 text-white" />
        </DialogClose>
        <div className="flex items-start justify-center gap-5">
          {!isAdd && (
            <div className="my-10">
              <div className="w-64 h-64 bg-white/30 rounded-lg ring-1 ring-white/80 flex items-center justify-center">
                <span className="text-white text-sm text-center">
                  <img
                    src={`/images/${form.model || "switch"}.png`}
                    alt="Switch Photo"
                    width={240}
                    height={240}
                  />
                </span>
              </div>
            </div>
          )}
          <div className="bg-white/30 rounded-lg ring-1 ring-white/80 my-10 pb-5">
            <div className="p-6 dark:from-slate-950 dark:to-slate-900">
              <DialogHeader>
                <DialogTitle className="text-lg text-white">
                  {isAdd
                    ? "Add Switch"
                    : isEdit
                      ? "Edit Switch"
                      : "Switch Details"}
                </DialogTitle>
                <DialogDescription className="text-white/80">
                  {isAdd
                    ? "Create a new switch entry"
                    : "View and edit switch information"}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.name}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Main Switch"
                />
              </Field>
              <Field label="Location">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  value={form.place ?? ""}
                  readOnly={!isEdit && !isAdd}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, place: e.target.value }))
                  }
                />
              </Field>
              <Field label="" full>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Floor">
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      value={parseInt(form.floor)}
                      disabled={!isEdit && !isAdd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          floor: parseInt(e.target.value || "0", 10),
                        }))
                      }
                    >
                      <option value={0}>كبين القبو</option>
                      <option value={1}>الطابق الأرضي</option>
                      <option value={2}>الطابق الثاني</option>
                      <option value={13}>IT كبين ال</option>
                      <option value={14}>Server Room</option>
                      <option value={3}>كبين التدريب</option>
                      <option value={4}>الطابق الرابع</option>
                      <option value={5}>الطابق الخامس</option>
                      <option value={6}>الطابق السادس</option>
                      <option value={7}>الطابق السابع</option>
                      <option value={8}>الطابق الثامن</option>
                      <option value={9}>الطابق التاسع</option>
                      <option value={10}>الطابق العاشر</option>
                      <option value={11}>العيادات</option>
                      <option value={12}>كبين الاسعاف</option>
                    </select>
                  </Field>
                  <Field label="Model">
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      value={form.model ?? ""}
                      disabled={!isEdit && !isAdd}
                      onChange={(e) => {
                        const newModel = e.target.value;
                        const modelConfig =
                          SWITCH_MODELS[newModel as keyof typeof SWITCH_MODELS];

                        setForm((f) => {
                          const updatedForm = { ...f, model: newModel };

                          // Auto-fill specifications based on model
                          if (modelConfig) {
                            updatedForm.total_ports = modelConfig.total_ports;
                            updatedForm.total_fiber_ports =
                              modelConfig.total_fiber_ports;
                            updatedForm.POE = modelConfig.POE;
                          }

                          return updatedForm;
                        });
                      }}
                    >
                      <option value="CRS354-48G-4S+2Q+RM">
                        CRS354-48G-4S+2Q+RM
                      </option>
                      <option value="CRS328-24P-4S+RM">CRS328-24P-4S+RM</option>
                      <option value="CRS326-24G-2S+RM">CRS326-24G-2S+RM</option>

                      <option value="CRS354-48P-4S+2Q+RM">
                        CRS354-48P-4S+2Q+RM
                      </option>
                      <option value="CRS317-1G-16S+RM">CRS317-1G-16S+RM</option>
                      <option value="CCR2116-12G-4S+">CCR2116-12G-4S+</option>
                      <option value="DH-PFS4218-16GT-190">
                        DH-PFS4218-16GT-190
                      </option>
                      <option value="DH-PFS4218-16GT-240">
                        DH-PFS4218-16GT-240
                      </option>
                    </select>
                  </Field>

                  <Field label="IP">
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      value={form.IP ?? ""}
                      readOnly={!isEdit && !isAdd}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, IP: e.target.value }))
                      }
                    />
                  </Field>
                </div>
              </Field>
              <Field label="" full>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Total Ports">
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      value={form.total_ports}
                      disabled={!isEdit && !isAdd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          total_ports: parseInt(e.target.value || "1", 10),
                        }))
                      }
                    >
                      <option value={1}>1</option>
                      <option value={12}>12</option>
                      <option value={16}>16</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </Field>
                  <Field label="Total Fiber Ports">
                    <select
                      className="w-full rounded-md border border-slate-300
                      bg-white/45 px-3 py-2 text-sm shadow-sm outline-none
                      focus:ring-2 focus:ring-slate-300 dark:border-slate-700
                      dark:bg-slate-900"
                      value={form.total_fiber_ports ?? 0}
                      disabled={!isEdit && !isAdd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          total_fiber_ports: parseInt(
                            e.target.value || "0",
                            10,
                          ),
                        }))
                      }
                    >
                      <option value={4}>4</option>
                      <option value={2}>2</option>
                      <option value={16}>16</option>
                    </select>
                  </Field>
                  <Field label="POE">
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      value={form.POE ? "yes" : "no"}
                      disabled={!isEdit && !isAdd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          POE: e.target.value === "yes",
                        }))
                      }
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </Field>
                </div>
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
            </div>
            {/* Switch Port Visualization */}
            {!isAdd && !isEdit && form.ports.length > 0 && (
              <div className="px-6 py-4">
                <SwitchPortVisualization
                  key={`${form.ports.length}-${form.ports.map((p) => p.device_id || "null").join(",")}`}
                  switchDevice={form}
                  readOnly={true}
                  onPortClick={(port) => {
                    setSelectedPort(port);
                    setPortConfigOpen(true);
                  }}
                />
              </div>
            )}
            {/* Port Configuration for Add/Edit Mode */}
            {(isAdd || isEdit) && (
              <div className="px-6 py-4">
                {(isAdd || isEdit) && (
                  <SwitchPortVisualization
                    key={`${form.ports.length}-${form.ports.map((p) => p.device_id || "null").join(",")}`}
                    switchDevice={form}
                    readOnly={false}
                    isAddMode={isAdd}
                    onPortClick={(port) => {
                      setSelectedPort(port);
                      setPortConfigOpen(true);
                    }}
                  />
                )}
              </div>
            )}

            {/* View mode buttons */}
            {mode === "view" && (
              <DialogFooter className="gap-2 px-6 pt-1">
                <button
                  className="inline-flex items-center justify-center rounded-md border text-sm px-3 py-2 transition border-[#4182E1] bg-[#4182E1] text-white hover:bg-[#4182E1]/90 dark:border-[#4182E1] dark:bg-[#4182E1] dark:text-white"
                  onClick={handleAutoAssignPorts}
                  disabled={isAutoAssigning}
                >
                  {isAutoAssigning ? "Auto-Assigning..." : "Auto-Assign Ports"}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md border text-sm px-3 py-2 transition border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-900"
                  onClick={() => onSave(form)}
                >
                  Edit
                </button>
              </DialogFooter>
            )}
            {(isEdit || isAdd) && (
              <DialogFooter className="gap-2 px-6 pt-1">
                <button
                  className={cn(
                    "inline-flex items-center justify-center rounded-md border text-sm px-3 py-2 transition border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-900",
                    (!canSave || isSubmitting) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                  disabled={!canSave || isSubmitting}
                  onClick={() => onSave(form)}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </DialogFooter>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Port Configuration Modal */}
      <PortConfigModal
        open={portConfigOpen}
        port={selectedPort}
        availableDevices={unlinkedDevices.filter(
          (device) => device.floor === form.floor,
        )}
        currentSwitchPorts={form.ports}
        isAddMode={isAdd}
        onOpenChange={setPortConfigOpen}
        onSave={handlePortUpdate}
      />
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
