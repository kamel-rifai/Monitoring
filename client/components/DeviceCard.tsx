import { memo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Camera,
  Phone,
  Stethoscope,
  Wifi,
  Box,
  DoorClosed,
} from "lucide-react";
import type { Device } from "@shared/api";

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "camera":
      return <Camera className="size-5 text-slate-600" />;
    case "telephone":
      return <Phone className="size-5 text-slate-600" />;
    case "nursing system":
      return <Stethoscope className="size-5 text-slate-600" />;
    case "access-point":
      return <Wifi className="size-5 text-slate-600" />;
    case "access-door":
      return <DoorClosed className="size-5 text-slate-600" />;
    default:
      return <Box className="size-5 text-slate-600" />;
  }
}

export const StatusDot = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      "inline-block size-2 rounded-full",
      active ? "bg-emerald-500" : "bg-rose-500",
    )}
  />
);

export interface DeviceCardProps {
  device: Device;
  onLongPress?: (device: Device) => void;
}

function DeviceCardBase({ device, onLongPress }: DeviceCardProps) {
  const timer = useRef<number | null>(null);
  const start = () => {
    if (!onLongPress) return;
    clear();
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
      className="group relative grid h-auto max-h-[120px] min-w-[150px] max-w-[220px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900 md:max-h-[180px]"
      role="listitem"
      onPointerDown={start}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
    >
      <div
        className={cn(
          "-mx-3 -mt-3 h-1.5 rounded-t-xl bg-gradient-to-r shadow-sm",
          device.active
            ? "from-emerald-500 to-green-500"
            : "from-rose-500 to-red-500",
        )}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon type={device.type} />
          <span className="text-[11px] font-medium text-slate-500">
            {device.type}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white md:text-base">
          {(() => {
            if (String(device.type).toLowerCase() === "cctv") {
              const match = String(device.name).match(/(\d+)/g);
              const last = match ? match[match.length - 1] : "1";
              const nn = String(parseInt(last, 10) || 1)
                .toString()
                .padStart(2, "0");
              return `Camera ${device.floor}${nn}`;
            }
            return device.name;
          })()}
        </h3>
        <p className="mt-1 text-xs text-slate-500 md:text-sm">
          Floor {device.floor}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-800/60">
        <span>Device ID</span>
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
          {String(device.id)}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-4 mx-3 h-8 translate-y-2 rounded-full bg-slate-900/10 opacity-0 blur-xl transition group-hover:opacity-60 dark:bg-white/10" />
    </div>
  );
}

export const DeviceCard = memo(DeviceCardBase);
