import { FilterBar } from "@/components/FilterBar";
import { cn } from "@/lib/utils";
import type { Device } from "@shared/api";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Hash,
  Box,
  MapPin,
  Network,
  Globe,
  StickyNote,
  Eye,
  Calendar,
  BadgeInfo,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

export interface SidebarProps {
  mode: "filters" | "details";
  types?: string[];
  selected?: string[];
  onToggle?: (type: string) => void;
  onClear?: () => void;
  device?: Device | null;
  onBack?: () => void;
  inactiveOnly?: boolean;
  onToggleInactive?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

function Row({
  label,
  icon,
  value,
}: {
  label: string;
  icon: ReactNode;
  value?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800/60 dark:bg-slate-900">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="truncate text-slate-800 dark:text-slate-100">
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  mode,
  types,
  selected,
  onToggle,
  onClear,
  device,
  onBack,
  inactiveOnly,
  onToggleInactive,
  onRefresh,
  isRefreshing,
  className,
}: SidebarProps) {
  const showFilters = mode === "filters";
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 h-full w-56 shrink-0 border-r border-slate-200 bg-white/80 p-1 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/70 flex flex-col",
        className,
      )}
    >
      {showFilters ? (
        <>
          <div className="flex items-center justify-center">
            <div className="mb-8 -mt-12 flex-col items-center justify-center bg-gray-100 px-1 p-1">
              <div className="flex-col items-center">
                <img src="/rjdata.png" alt="" className="w-20 -mb-2" />
              </div>
              <span className="mb-8 text-[10px] font-normal italic self-center text-slate-500">
                Networks Infrastructure
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="ml-4 text-lg font-bold tracking-tight">
              IT Devices
            </h1>
            <p className="ml-4 text-xs text-slate-500">Filter by type</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <FilterBar
              types={types ?? []}
              selected={selected ?? []}
              onToggle={onToggle ?? (() => {})}
              onClear={onClear ?? (() => {})}
            />
          </div>

          <div className="mt-auto border-t border-slate-200 pt-3 pb-2 px-2 dark:border-slate-800/60 space-y-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed",
                isRefreshing
                  ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-500"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
              <span>{isRefreshing ? "Refreshing..." : "Instant Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={onToggleInactive}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition",
                inactiveOnly
                  ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-500"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
              )}
              aria-pressed={!!inactiveOnly}
            >
              <XCircle className="size-4" />
              <span>Show Inactive Devices</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" /> Filters
            </button>
            <div className="text-xs text-slate-500">Details</div>
          </div>

          <div className="space-y-2">
            <Row
              label="ID"
              icon={<Hash className="size-4" />}
              value={
                <span className="font-mono">{String(device?.id ?? "")}</span>
              }
            />
            <Row
              label="Type"
              icon={<BadgeInfo className="size-4" />}
              value={device?.type}
            />
            <Row
              label="Model"
              icon={<Box className="size-4" />}
              value={device?.model}
            />
            <Row
              label="Place"
              icon={<MapPin className="size-4" />}
              value={device?.place}
            />
            <Row
              label="MAC"
              icon={<Network className="size-4" />}
              value={<span className="font-mono">{device?.Mac}</span>}
            />
            <Row
              label="IP"
              icon={<Globe className="size-4" />}
              value={<span className="font-mono">{device?.IP}</span>}
            />
            <Row
              label="Notes"
              icon={<StickyNote className="size-4" />}
              value={device?.Notes || ""}
            />
            <Row
              label="Show"
              icon={
                device?.show ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <XCircle className="size-4 text-rose-500" />
                )
              }
              value={device?.show ? "Visible" : "Hidden"}
            />
            <Row
              label="Date"
              icon={<Calendar className="size-4" />}
              value={
                device?.date
                  ? new Date(device.date).toLocaleString()
                  : undefined
              }
            />
          </div>
        </>
      )}
    </aside>
  );
}
