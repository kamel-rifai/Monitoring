import { memo, useRef } from "react";
import { cn } from "@/lib/utils";
import { EthernetPort } from "lucide-react";
import type { Switch } from "@shared/api";

export interface SwitchCardProps {
  switch: Switch;
  onLongPress?: (switchDevice: Switch) => void;
}

function SwitchCardBase({
  switch: switchDevice,
  onLongPress,
}: SwitchCardProps) {
  const timer = useRef<number | null>(null);

  const start = () => {
    if (!onLongPress) return;
    timer.current = window.setTimeout(() => onLongPress(switchDevice), 500);
  };

  const clear = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <div
      className={cn(
        // Matches DeviceCard Layout
        "group relative flex flex-col justify-between overflow-hidden rounded-xl p-4 transition-all duration-300 ease-out",
        "h-[140px] w-full min-w-[190px] border ring-1 ring-transparent",

        // Light Mode
        "bg-white border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-xl hover:ring-slate-200",

        // Dark Mode
        "dark:bg-slate-950 dark:border-slate-800/50 dark:hover:bg-slate-900/50 dark:hover:ring-slate-800",

        // State: Hidden
        !switchDevice.show && "opacity-70 grayscale pointer-events-none",

        // Hover translation
        "hover:-translate-y-1",
      )}
      onPointerDown={start}
      onPointerUp={clear}
      onPointerLeave={clear}
    >
      {/* Background Status Glow (Premium touch) */}
      {switchDevice.active && switchDevice.show && (
        <div className="absolute -right-4 -top-4 size-16 bg-emerald-500/20 blur-2xl transition-opacity group-hover:bg-emerald-500/30" />
      )}

      {!switchDevice.active && switchDevice.show && (
        <div className="absolute -right-4 -top-4 size-16 bg-red-500/20 blur-2xl transition-opacity group-hover:bg-red-500/30" />
      )}

      {/* Header: Icon & ID Metadata */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border transition-colors",
            switchDevice.active
              ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
              : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50",
          )}
        >
          <EthernetPort
            className={cn(
              "size-4 transition-colors duration-300",
              switchDevice.active
                ? "text-emerald-500"
                : "text-slate-400 dark:text-slate-500",
            )}
          />
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
            #{String(switchDevice.id).padStart(3, "0")}
          </span>
          {!switchDevice.show && (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              Hidden
            </span>
          )}
        </div>
      </div>

      {/* Content: Name & Model/IP */}
      <div className="mt-4">
        <h3 className="truncate text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {switchDevice.name}
        </h3>
        <div className="mt-0.5 flex items-center gap-1.5 text-slate-500">
          <code className="text-[12px] font-medium tracking-tight opacity-80 font-mono">
            {switchDevice.IP || "Unknown"}
          </code>
        </div>
      </div>

      {/* Subtle Bottom Accent Line */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full",
          switchDevice.active ? "bg-emerald-500" : "bg-rose-500",
        )}
      />
    </div>
  );
}

export const SwitchCard = memo(SwitchCardBase);
