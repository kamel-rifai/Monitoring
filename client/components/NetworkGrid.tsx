import { SwitchCard } from "@/components/SwitchCard";
import type { Switch } from "@shared/api";
import { sortFloorsByCustomOrder, getFloorTitle } from "@/lib/floorOrder";

interface NetworkGridProps {
  switches: Switch[];
  deviceType: "switch";
  onDeviceLongPress: (device: Switch) => void;
}

export function NetworkGrid({
  switches,
  deviceType,
  onDeviceLongPress,
}: NetworkGridProps) {
  // Get unique floors for this device type
  const floors = Array.from(
    new Set(switches.map((d) => d.floor).filter((f) => f !== undefined)),
  ).filter((f): f is number => f !== undefined);

  if (switches.length === 0) {
    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-gray-100 mt-2">
        <div className="p-8 text-center text-slate-500">
          <p className="text-lg font-medium capitalize">
            {deviceType === "switch" ? "Switches" : "Patch Panels"}
          </p>
          <p className="text-sm mt-2">No switches found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-gray-100 mt-2">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 capitalize">
          {deviceType === "switch" ? "Network Switches" : "Patch Panels"}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {switches.length} {"switch"}
          {switches.length !== 1 ? "es" : ""} found
        </p>
      </div>
      {sortFloorsByCustomOrder(floors).map((f) => {
        const floorSwitches = switches.filter((d) => d.floor === f);

        return (
          <section
            key={`${deviceType}-${f}`}
            className="bg-slate-300/20 flex min-h-[120px] flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-0 dark:border-slate-800/60 md:px-6"
            aria-label={getFloorTitle(f)}
          >
            <div className="flex shrink-0 items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-lg">
                {getFloorTitle(f)}
              </h2>
              <span className="text-xs text-slate-500">
                {floorSwitches.length} switches
              </span>
            </div>
            <div className="flex flex-wrap items-start gap-3" role="list">
              {floorSwitches.length === 0 ? (
                <div className="col-span-full mx-8 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800/60">
                  No switches on this floor
                </div>
              ) : (
                floorSwitches
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((switchDevice) => (
                    <div
                      key={String(switchDevice.id)}
                      onClick={() => onDeviceLongPress?.(switchDevice)}
                    >
                      <SwitchCard
                        switch={switchDevice}
                        onLongPress={onDeviceLongPress}
                      />
                    </div>
                  ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
