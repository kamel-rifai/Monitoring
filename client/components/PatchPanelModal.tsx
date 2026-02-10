import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import type { PatchPanel, Switch } from "@shared/api";
import { cn } from "@/lib/utils";
import { PatchPanelPortConfigModal } from "./PatchPanelPortConfigModal";
import { DialogClose } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { PortVisualization } from "@/components/PortVisualization";

export interface PatchPanelModalProps {
  open: boolean;
  patchPanel: PatchPanel | null;
  mode: "view" | "edit" | "add";
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patchPanel: PatchPanel) => void;
  availableSwitches?: Switch[];
  allPatchPanels?: PatchPanel[];
}

export function PatchPanelModal({
  open,
  patchPanel,
  mode,
  isSubmitting = false,
  onOpenChange,
  onSave,
  availableSwitches = [],
  allPatchPanels = [],
}: PatchPanelModalProps) {
  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const [selectedPort, setSelectedPort] = useState<
    PatchPanel["ports"][0] | null
  >(null);
  const [portConfigOpen, setPortConfigOpen] = useState(false);
  const [filteredAvailableSwitches, setFilteredAvailableSwitches] =
    useState(availableSwitches);

  // Update filtered switches when available switches change
  useEffect(() => {
    setFilteredAvailableSwitches(availableSwitches);
  }, [availableSwitches]);

  // Filter out already taken ports from all patch panels
  useEffect(() => {
    if (isAdd && allPatchPanels.length > 0) {
      const takenPortIds = new Set<number>();

      // Collect all taken switch port IDs from existing patch panels
      allPatchPanels.forEach((patchPanel) => {
        patchPanel.ports.forEach((port) => {
          if (port.switch_port?.id) {
            takenPortIds.add(port.switch_port.id);
          }
        });
      });

      // Filter out taken ports from available switches
      const filteredSwitches = availableSwitches.map((switch_) => ({
        ...switch_,
        ports: switch_.ports.filter((port) => !takenPortIds.has(port.id)),
      }));

      setFilteredAvailableSwitches(filteredSwitches);
    }
  }, [allPatchPanels, availableSwitches, isAdd]);
  const base: PatchPanel = useMemo(
    () =>
      patchPanel ?? {
        id: "",
        title: "",
        unique_id: "",
        show: true,
        ports: [],
        floor: 1,
      },
    [patchPanel],
  );

  const [form, setForm] = useState<PatchPanel>(base);
  useEffect(() => setForm(base), [base, open]);

  const canSave = form.title;

  const handlePortUpdate = (updatedPort: PatchPanel["ports"][0]) => {
    console.log("Received port update:", updatedPort);
    setForm((prev) => {
      const existingPortIndex = prev.ports.findIndex(
        (port) => port.port_number === updatedPort.port_number,
      );

      if (existingPortIndex >= 0) {
        // Update existing port
        return {
          ...prev,
          ports: prev.ports.map((port) =>
            port.port_number === updatedPort.port_number ? updatedPort : port,
          ),
        };
      } else {
        // Add new port
        return {
          ...prev,
          ports: [...prev.ports, updatedPort],
        };
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full max-h-full h-full flex items-center justify-center border-slate-200 bg-black/50 backdrop-blur-sm p-10 shadow-xl">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-11 w-11 text-white" />
          </DialogClose>
          <div className="flex items-start justify-center gap-5">
            <div className="my-10">
              <div className="w-64 h-64 bg-white/30 rounded-lg ring-1 ring-white/80 flex items-center justify-center">
                <span className="text-white text-sm text-center">
                  <img
                    src="/images/patchpanel.png"
                    alt="Patch Panel Photo"
                    width={240}
                    height={240}
                  />
                </span>
              </div>
            </div>
            <div className="bg-white/30 rounded-lg ring-1 ring-white/80 my-10 pb-5w-[40vw]">
              <div className="p-6 dark:from-slate-950 dark:to-slate-900">
                <DialogHeader>
                  <DialogTitle className="text-lg text-white ">
                    {isAdd
                      ? "Add Patch Panel"
                      : isEdit
                        ? "Edit Patch Panel"
                        : "Patch Panel Details"}
                  </DialogTitle>
                  <DialogDescription className="text-white">
                    {isAdd
                      ? "Create a new patch panel entry"
                      : "View and edit patch panel information"}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
                <Field label="Title">
                  <input
                    className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    value={form.title}
                    readOnly={!isEdit && !isAdd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g. Main Patch Panel"
                  />
                </Field>

                <Field label="Floor">
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    value={form.floor}
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

                {isEdit && (
                  <Field label="Show">
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white/45 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      value={form.show ? "yes" : "no"}
                      disabled={!isEdit && !isAdd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          show: e.target.value === "yes",
                        }))
                      }
                    >
                      <option value="yes">Visible</option>
                      <option value="no">Hidden</option>
                    </select>
                  </Field>
                )}
              </div>

              {/* Port Visualization */}
              {!isAdd && !isEdit ? (
                <div className="px-6 py-4">
                  <PortVisualization
                    patchPanel={form}
                    readOnly={!isEdit}
                    onPortClick={(port) => {
                      setSelectedPort(port);
                      setPortConfigOpen(true);
                    }}
                  />
                </div>
              ) : null}

              {/* Port Configuration for Add/Edit Mode */}
              {(isAdd || isEdit) && (
                <div className="px-6 py-4">
                  <PortVisualization
                    patchPanel={form}
                    readOnly={false}
                    onPortClick={(port) => {
                      setSelectedPort(port);
                      setPortConfigOpen(true);
                    }}
                  />
                </div>
              )}

              {/* View mode buttons */}
              {mode === "view" && (
                <DialogFooter className="gap-2 px-6 py-4">
                  <button
                    className="inline-flex items-center justify-center rounded-md border text-sm px-3 py-2 transition border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-900"
                    onClick={() => onSave(form)}
                  >
                    Edit
                  </button>
                </DialogFooter>
              )}

              {(isEdit || isAdd) && (
                <DialogFooter className="gap-2 px-6 py-4">
                  <button
                    className={cn(
                      "inline-flex items-center justify-center rounded-md border text-sm px-3 py-2 transition border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-900",
                      (!canSave || isSubmitting) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                    disabled={!canSave || isSubmitting}
                    onClick={() => {
                      console.log(form);
                      onSave(form);
                    }}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </DialogFooter>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Port Configuration Modal */}
      <PatchPanelPortConfigModal
        open={portConfigOpen}
        port={selectedPort}
        availableSwitches={filteredAvailableSwitches}
        currentPatchPanel={form}
        allPatchPanels={allPatchPanels}
        patchPanelId={String(form.id)}
        onOpenChange={setPortConfigOpen}
        onSave={handlePortUpdate}
      />
    </>
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
