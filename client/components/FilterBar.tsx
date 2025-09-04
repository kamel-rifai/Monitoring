import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Camera,
  Phone,
  Stethoscope,
  Wifi,
  Box,
  DoorClosed,
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
      return <Camera className="size-4" />;
    case "telephone":
      return <Phone className="size-4" />;
    case "nursing":
      return <Stethoscope className="size-4" />;
    case "accesspoint":
      return <Wifi className="size-4" />;
    case "access-door":
      return <DoorClosed className="size-4" />;
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
    <div className="mt-2 flex flex-col gap-2">
      {allTypes.map((t) => {
        const active = selected.includes(t);
        return (
          <button
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
          </button>
        );
      })}
    </div>
  );
}
