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
} from "lucide-react";

export interface FilterBarProps {
  types: string[];
  selected: string[];
  onToggle: (type: string) => void;
  onClear: () => void;
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "camera":
      return <Cctv className="size-4" />;
    case "telephone":
      return <Phone className="size-4" />;
    case "nursing":
      return <Stethoscope className="size-4" />;
    case "accesspoint":
      return <Wifi className="size-4" />;
    case "access-door":
      return <DoorClosed className="size-4" />;
    case "Switch":
      return <EthernetPort className="size-4" />;
    case "Patch-Panel":
      return <PanelTop className="size-4" />;
    default:
      return <Box className="size-4" />;
  }
}

export function FilterBar({ types, selected, onToggle }: FilterBarProps) {
  const allTypes = useMemo(
    () => types.sort((a, b) => a.localeCompare(b)),
    [types],
  );
  function capitalizeFirstLetter(inputString: string): string {
    if (inputString.length === 0) {
      return ""; // Handle empty strings
    }
    return inputString.charAt(0).toUpperCase() + inputString.slice(1);
  }

  return (
    <div className="mt-2 flex flex-col gap-2 items-center justify-center">
      {allTypes.map((t) => {
        const active = selected.includes(t);
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(t);
              }}
              className={`${
                active
                  ? "bg-[#0F2854] shadow-2xl border border-[#0F2854]/40"
                  : "bg-[#035AD7]/75 border border-[#035AD7]/10"
              } flex items-center w-[10.5vw] p-2 py-2 justify-start text-white rounded-2xl transition-transform duration-200 hover:scale-105 `}
            >
              <div
                className={
                  active
                    ? "ring-1 ring-white/40 bg-white/30 rounded-full w-7 h-7 flex items-center justify-center "
                    : "ring-1 ring-white/40 bg-white/30 rounded-full w-7 h-7 flex items-center justify-center"
                }
              >
                <TypeIcon type={t} />
              </div>
              <span
                className={`${active ? `ml-2 font-cairo text-sm text-white` : `ml-2 font-cairo text-sm text-white`}`}
              >
                {capitalizeFirstLetter(t)}
              </span>
            </button>
            {/*<button
              type="button"
              key={t}
              onClick={() => onToggle(t)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
              )}
              aria-pressed={active}
            >
              <TypeIcon type={t} />
              <span className="truncate">{capitalizeFirstLetter(t)}</span>
            </button>*/}
          </>
        );
      })}
    </div>
  );
}
