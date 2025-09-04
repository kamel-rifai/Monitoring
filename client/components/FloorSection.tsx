import { memo } from "react";
import type { Device } from "@shared/api";
import { DeviceCard } from "@/components/DeviceCard";

export interface FloorSectionProps {
  floor: number;
  devices: Device[];
  title?: string;
  onDeviceLongPress?: (device: Device) => void;
}

function FloorSectionBase({ floor, devices, title, onDeviceLongPress }: FloorSectionProps) {
  const heading = title ?? `Floor ${floor}`;
  return (
    <section
      className="flex h-[200px] md:h-[220px] lg:h-[240px] flex-col gap-2 border-b border-slate-200 px-4 py-3 last:border-0 dark:border-slate-800/60 md:px-6"
      aria-label={heading}
    >
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-lg">
          {heading}
        </h2>
        <span className="text-xs text-slate-500">{devices.length} devices</span>
      </div>
      <div
        className="-mx-2 flex flex-1 snap-x snap-mandatory items-center gap-3 overflow-x-auto overflow-y-hidden px-2 py-1 scrollbar-rounded [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.400)_transparent]"
        role="list"
      >
        {devices.length === 0 ? (
          <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800/60">
            No devices on this floor
          </div>
        ) : (
          devices.map((d) => (
            <div key={String(d.id)} className="snap-start">
              <DeviceCard device={d} onLongPress={onDeviceLongPress} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export const FloorSection = memo(FloorSectionBase);
