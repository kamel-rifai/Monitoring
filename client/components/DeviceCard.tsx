import { memo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  Stethoscope,
  Wifi,
  Box,
  DoorClosed,
  Cctv,
  Info,
} from "lucide-react";
import type { Device } from "@shared/api";

function TypeIcon({ type, active }: { type: string; active: boolean }) {
  const iconClass = cn(
    "size-4 transition-colors duration-300",
    active ? "text-emerald-500" : "text-red-400 dark:text-red-500",
  );

  switch (type) {
    case "camera":
      return <Cctv className={iconClass} />;
    case "telephone":
      return <Phone className={iconClass} />;
    case "nursing":
      return <Stethoscope className={iconClass} />;
    case "accesspoint":
      return <Wifi className={iconClass} />;
    case "access-door":
      return <DoorClosed className={iconClass} />;
    default:
      return <Box className={iconClass} />;
  }
}

export interface DeviceCardProps {
  device: Device;
  onLongPress?: (device: Device) => void;
}

function DeviceCardBase({ device, onLongPress }: DeviceCardProps) {
  const timer = useRef<number | null>(null);

  const start = () => {
    if (!onLongPress) return;
    timer.current = window.setTimeout(() => onLongPress(device), 500);
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
        // Layout: Use Flex instead of Grid for better vertical centering at high scale
        "group relative flex flex-col justify-between overflow-hidden rounded-xl p-4 transition-all duration-300 ease-out",
        "h-[140px] w-full min-w-[180px] border ring-1 ring-transparent",

        // Light Mode
        "bg-white border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-xl hover:ring-slate-200",

        // Dark Mode
        "dark:bg-slate-950 dark:border-slate-800/50 dark:hover:bg-slate-900/50 dark:hover:ring-slate-800",

        // State: Hidden
        !device.show && "opacity-40 grayscale pointer-events-none",

        // Hover translation
        "hover:-translate-y-1",
      )}
      onPointerDown={start}
      onPointerUp={clear}
      onPointerLeave={clear}
    >
      {/* Background Status Glow (Premium touch) */}
      {device.active && device.show && (
        <div className="absolute -right-4 -top-4 size-16 bg-emerald-500/20 blur-2xl transition-opacity group-hover:bg-emerald-500/30" />
      )}
      {!device.active && device.show && (
        <div className="absolute -right-4 -top-4 size-16 bg-red-500/20 blur-2xl transition-opacity group-hover:bg-red-500/30" />
      )}

      {/* Header: Icon & Metadata */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border transition-colors",
            device.active
              ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
              : "bg-red-50 border-red-100",
          )}
        >
          <TypeIcon type={device.type} active={device.active} />
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
            #{String(device.id).padStart(3, "0")}
          </span>
        </div>
      </div>

      {/* Content: Name & IP */}
      <div className="mt-4">
        <h3 className="truncate text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {device.name}
        </h3>
        <div className="mt-0.5 flex items-center gap-1.5 text-slate-500">
          <code className="text-[12px] font-medium tracking-tight opacity-80">
            {device.IP}
          </code>
        </div>
      </div>

      {/* Subtle Bottom Accent Line */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full",
          device.active ? "bg-emerald-500" : "bg-rose-500",
        )}
      />
    </div>
  );
}

export const DeviceCard = memo(DeviceCardBase);
