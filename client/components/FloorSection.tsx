import { memo } from "react";
import type { Device } from "@shared/api";
import { DeviceCard } from "@/components/DeviceCard";

export interface FloorSectionProps {
  floor: number;
  devices: Device[];
  title?: string;
  onDeviceLongPress?: (device: Device) => void;
}

function FloorSectionBase({
  floor,
  devices,
  title,
  onDeviceLongPress,
}: FloorSectionProps) {
  const heading = title ?? `Floor ${floor}`;
  return (
    <section
      className="bg-slate-300/20 flex min-h-[120px] flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-0 dark:border-slate-800/60 md:px-6"
      aria-label={heading}
    >
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-lg">
          {heading}
        </h2>
        <span className="text-xs text-slate-500">{devices.length} devices</span>
      </div>
      <div className="flex flex-wrap items-start gap-3" role="list">
        {devices.length === 0 ? (
          <div className="col-span-full mx-8 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800/60">
            No devices on this floor
          </div>
        ) : (
          devices.map((d) => (
            <div
              key={String(d.id)}
              onClick={() => onDeviceLongPress?.(d)}
              className="cursor-pointer"
            >
              <DeviceCard device={d} onLongPress={onDeviceLongPress} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export const FloorSection = memo(FloorSectionBase);
