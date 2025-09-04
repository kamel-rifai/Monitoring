import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import type { Device } from "@shared/api";
import { cn } from "@/lib/utils";

export interface DeviceModalProps {
  open: boolean;
  device: Device | null;
  mode: "view" | "edit" | "add";
  onOpenChange: (open: boolean) => void;
  onSave: (device: Device) => void;
}

const TYPES = [
  "CCTV",
  "Telephone",
  "Nursing System",
  "Access Point",
  "Access-door",
] as const;

export function DeviceModal({
  open,
  device,
  mode,
  onOpenChange,
  onSave,
}: DeviceModalProps) {
  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const base: Device = useMemo(
    () =>
      device ?? {
        id: "",
        name: "",
        type: "CCTV",
        floor: 0,
        active: true,
        model: "",
        place: "",
        mac: "",
        ip: "",
        notes: "",
        show: true,
        date: new Date().toISOString(),
      },
    [device],
  );

  const [form, setForm] = useState<Device>(base);
  useEffect(() => setForm(base), [base, open]);

  const canSave =
    (form.name || isAdd) && form.type && form.floor >= 0 && form.floor <= 12;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl border-slate-200 bg-white p-0 shadow-xl dark:border-slate-800/60 dark:bg-slate-900">
        <div className="rounded-t-xl bg-gradient-to-r from-slate-50 to-white px-6 py-4 dark:from-slate-950 dark:to-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isAdd ? "Add Device" : isEdit ? "Edit Device" : "Device Details"}
            </DialogTitle>
            <DialogDescription>
              {isAdd
                ? "Create a new device entry"
                : "View and edit device information"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
          {!isAdd && (
            <Field label="ID">
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
                value={String(form.id)}
                readOnly
              />
            </Field>
          )}
          <Field label="Type">
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. CCTV 01"
            />
          </Field>
          <Field label="Floor">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              type="number"
              min={0}
              max={12}
              value={form.floor}
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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.model ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, model: e.target.value }))
              }
            />
          </Field>
          <Field label="Place">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.place ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, place: e.target.value }))
              }
            />
          </Field>
          <Field label="MAC">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.mac ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, mac: e.target.value }))}
            />
          </Field>
          <Field label="IP">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.ip ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
            />
          </Field>
          <Field label="Notes" full>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </Field>
          <Field label="Status">
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.active ? "active" : "inactive"}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.value === "active" }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Show">
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              value={form.show ? "yes" : "no"}
              onChange={(e) =>
                setForm((f) => ({ ...f, show: e.target.value === "yes" }))
              }
            >
              <option value="yes">Visible</option>
              <option value="no">Hidden</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900"
              type="datetime-local"
              value={toLocalDateTime(form.date)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  date: fromLocalDateTime(e.target.value),
                }))
              }
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 px-6 py-4">
          {!isAdd && mode === "view" && (
            <button className={styles.btn} onClick={() => onSave({ ...form })}>
              Edit
            </button>
          )}
          {(isEdit || isAdd) && (
            <button
              className={cn(
                styles.btnPrimary,
                !canSave && "opacity-50 cursor-not-allowed",
              )}
              disabled={!canSave}
              onClick={() => onSave(form)}
            >
              Save
            </button>
          )}
        </DialogFooter>
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
      <span className="text-xs font-medium text-slate-500">{label}</span>
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
