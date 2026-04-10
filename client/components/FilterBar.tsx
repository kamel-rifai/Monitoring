import { useMemo } from "react";
import {
  Phone,
  Stethoscope,
  Wifi,
  Box,
  DoorClosed,
  Cctv,
  EthernetPort,
  PanelTop,
  Cable,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  types: string[];
  selected: string[];
  onToggle: (type: string) => void;
  onClear: () => void;
}

function TypeIcon({ type, active }: { type: string; active: boolean }) {
  switch (type) {
    case "camera":
      return <Cctv className={`size-4 ${active ? "text-emerald-500" : ""}`} />;
    case "telephone":
      return <Phone className={`size-4 ${active ? "text-emerald-500" : ""}`} />;
    case "nursing":
      return (
        <Stethoscope className={`size-4 ${active ? "text-emerald-500" : ""}`} />
      );
    case "accesspoint":
      return <Wifi className={`size-4 ${active ? "text-emerald-500" : ""}`} />;
    case "access-door":
      return (
        <DoorClosed className={`size-4 ${active ? "text-emerald-500" : ""}`} />
      );
    case "Switch":
      return (
        <EthernetPort
          className={`size-4 ${active ? "text-emerald-500" : ""}`}
        />
      );
    case "Patch-Panel":
      return (
        <PanelTop className={`size-4 ${active ? "text-emerald-500" : ""}`} />
      );
    case "Cables":
      return <Cable className={`size-4 ${active ? "text-emerald-500" : ""}`} />;
    default:
      return <Box className={`size-4 ${active ? "text-emerald-500" : ""}`} />;
  }
}

export function FilterBar({ types, selected, onToggle }: FilterBarProps) {
  const allTypes = useMemo(
    () => types.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [types],
  );
  function capitalizeFirstLetter(inputString: string): string {
    if (inputString.length === 0) {
      return ""; // Handle empty strings
    }
    return inputString.charAt(0).toUpperCase() + inputString.slice(1);
  }

  return (
    <div className="mt-2 flex flex-col gap-2 items-start m-2 justify-start">
      <div className="flex flex-wrap gap-2">
        {allTypes.map((t) => {
          const active = selected.includes(t);

          return (
            <button
              key={t}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(t);
              }}
              className={cn(
                // Base Layout: Matches the "compact" feel of the DeviceCard header
                "group relative flex items-center min-w-[220px] gap-3 overflow-hidden rounded-xl p-2 pr-4 transition-all duration-300 ease-out",
                "border ring-1 ring-transparent",

                // Light Mode
                "bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:ring-slate-200",

                // Dark Mode
                "dark:bg-slate-950 dark:border-slate-800/50 dark:hover:bg-slate-900/50 dark:hover:ring-slate-800",

                // Active State: Slight elevation and stronger border
                active &&
                  "ring-slate-200 dark:ring-slate-800 shadow-md translate-y-[-1px]",
              )}
            >
              {/* Icon Box: Exact mirror of the DeviceCard icon container */}
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg border transition-colors duration-300",
                  active
                    ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                    : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-800",
                )}
              >
                {/* Reuse your existing TypeIcon component */}
                <TypeIcon type={t} active={active} />
              </div>

              {/* Text: Mono-spaced and small like the Device ID # */}
              <span
                className={cn(
                  "text-[13px] font-bold  tracking-tight transition-colors duration-300",
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200",
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>

              {/* Bottom Accent Line: Signature hover/active effect */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 h-[2px] transition-all duration-500",
                  active
                    ? "w-full bg-emerald-500"
                    : "w-0 bg-blue-400 group-hover:w-full",
                )}
              />

              {/* Background Status Glow for Active state */}
              {active && (
                <div className="absolute -right-2 -top-2 size-8 bg-emerald-500/10 blur-xl pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
