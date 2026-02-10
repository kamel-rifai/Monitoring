import { memo, useRef } from "react";
import { cn } from "@/lib/utils";
import { PanelTop } from "lucide-react";
import type { PatchPanel } from "@shared/api";

export const StatusDot = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      "inline-block size-2 rounded-full",
      active ? "bg-emerald-500" : "bg-rose-500",
    )}
  />
);

export interface PatchPanelCardProps {
  patchPanel: PatchPanel;
  onLongPress?: (patchPanel: PatchPanel) => void;
}

function PatchPanelCardBase({ patchPanel, onLongPress }: PatchPanelCardProps) {
  const timer = useRef<number | null>(null);
  const start = () => {
    if (!onLongPress) return;
    clear();
    timer.current = window.setTimeout(() => onLongPress(patchPanel), 500);
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
        "group relative grid h-auto max-h-[120px] min-w-[190px] max-w-[220px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900 md:max-h-[180px]",
        !patchPanel.show &&
          "opacity-70 grayscale-[0.3] bg-slate-100 dark:bg-slate-800",
      )}
      role="listitem"
      onPointerDown={start}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
    >
      <div
        className={cn(
          "-mx-3 -mt-3 h-[6px] rounded-t-xl  shadow-sm",
          !patchPanel.show
            ? "bg-gradient-to-r from-slate-500 to-slate-700"
            : "bg-[#4182E1]",
        )}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PanelTop className="size-5 text-slate-600" />
          <span className="text-[11px] font-medium text-slate-500">
            Patch Panel
          </span>
        </div>
        {!patchPanel.show && (
          <span className="text-[9px] font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded dark:bg-slate-700 dark:text-slate-500">
            HIDDEN
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white md:text-base">
          {patchPanel.title}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {patchPanel.ports.length} ports
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-800/60">
        <span>Panel ID</span>
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
          {String(patchPanel.id)}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-4 mx-3 h-8 translate-y-2 rounded-full bg-slate-900/10 opacity-0 blur-xl transition group-hover:opacity-60 dark:bg-white/10" />
    </div>
  );
}

export const PatchPanelCard = memo(PatchPanelCardBase);
