import { FloorSection } from "@/components/FloorSection";
import type { Device } from "@shared/api";
import { sortFloorsByCustomOrder, getFloorTitle } from "@/lib/floorOrder";

interface DeviceGridProps {
  floors: number[];
  devices: Device[];
  onDeviceLongPress: (device: Device) => void;
}

export function DeviceGrid({
  floors,
  devices,
  onDeviceLongPress,
}: DeviceGridProps) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-gray-100 mt-2">
      {sortFloorsByCustomOrder(
        floors.filter((f) => devices.some((d) => d.floor === f)),
      ).map((f) => (
        <FloorSection
          key={f}
          floor={f}
          title={getFloorTitle(f)}
          devices={devices.filter((d) => d.floor === f)}
          onDeviceLongPress={onDeviceLongPress}
        />
      ))}
    </div>
  );
}
