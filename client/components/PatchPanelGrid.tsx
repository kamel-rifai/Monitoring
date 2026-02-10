import { PatchPanelCard } from "@/components/PatchPanelCard";
import type { PatchPanel } from "@shared/api";
import { sortFloorsByCustomOrder, getFloorTitle } from "@/lib/floorOrder";

interface PatchPanelGridProps {
  patchPanels: PatchPanel[];
  deviceType: "patch-panel";
  onDeviceLongPress: (device: PatchPanel) => void;
}

export function PatchPanelGrid({
  patchPanels,
  deviceType,
  onDeviceLongPress,
}: PatchPanelGridProps) {
  // Get unique floors from patch panels
  const floors = Array.from(new Set(patchPanels.map((pp) => pp.floor))).filter(
    (floor): floor is number => floor !== undefined && floor !== null,
  );

  if (patchPanels.length === 0) {
    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-gray-100 mt-2">
        <div className="p-8 text-center text-slate-500">
          <p className="text-lg font-medium capitalize">Patch Panels</p>
          <p className="text-sm mt-2">No patch panels found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-gray-100 mt-2">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 capitalize">
          Patch Panels
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {patchPanels.length} {"patch panel"}
          {patchPanels.length !== 1 ? "s" : ""} found
        </p>
      </div>
      {sortFloorsByCustomOrder(floors).map((f) => (
        <section
          key={f}
          className="bg-slate-300/20 flex min-h-[120px] flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-0 dark:border-slate-800/60 md:px-6"
        >
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-lg">
              {getFloorTitle(f)}
            </h2>
            <span className="text-xs text-slate-500">
              {patchPanels.filter((pp) => pp.floor === f).length} patch panels
            </span>
          </div>
          <div className="flex flex-wrap items-start gap-3" role="list">
            {patchPanels
              .sort((a, b) => a.title.localeCompare(b.title))
              .filter((patchPanel) => patchPanel.floor === f)
              .map((patchPanel) => (
                <div
                  key={String(patchPanel.id)}
                  onClick={() => onDeviceLongPress?.(patchPanel)}
                  className="cursor-pointer"
                >
                  <PatchPanelCard
                    patchPanel={patchPanel}
                    onLongPress={onDeviceLongPress}
                  />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
