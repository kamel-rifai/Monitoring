import { useMemo } from "react";
import type { Device, Switch, PatchPanel } from "@shared/api";

interface Params {
  selectedTypes: string[];
  inactiveOnly: boolean;
  searchQuery: string;
  isStrictSearch: boolean;
}

interface UseFilteredDevicesReturn {
  filtered: Device[];
  floors: number[];
}

interface UseFilteredSwitchesReturn {
  filtered: Switch[];
  floors: number[];
}

interface UseFilteredPatchPanelsReturn {
  filtered: PatchPanel[];
  floors: number[];
}

/**
 * Helper function to check if a value matches search query (strict or contains)
 */
const matchesSearch = (
  value: string | number | boolean | undefined,
  query: string,
  isStrict: boolean,
): boolean => {
  const str = String(value ?? "").toLowerCase();
  const q = query.toLowerCase();

  if (isStrict) {
    return str === q;
  } else {
    return str.includes(q);
  }
};

/**
 * Returns a memoised filtered list of devices and a floors array present in that list.
 */
export function useFilteredDevices(
  devices: Device[],
  params: Params,
): UseFilteredDevicesReturn {
  const { inactiveOnly, searchQuery, selectedTypes } = params;

  const filtered = useMemo(() => {
    let list = devices;

    if (inactiveOnly) {
      list = list.filter((dev) => !dev.active);
    }
    if (selectedTypes.length > 0) {
      list = list.filter((dev) => selectedTypes.includes(dev.type));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter((dev) => {
        const fields: Array<string | number | boolean | undefined> = [
          dev.name,
          dev.type,
          dev.id,
          dev.model,
          dev.place,
          dev.Mac,
          dev.IP,
          dev.Notes,
          dev.floor,
        ];
        return fields.some((val) =>
          matchesSearch(val, q, params.isStrictSearch),
        );
      });
    }
    return list;
  }, [
    devices,
    inactiveOnly,
    searchQuery,
    selectedTypes,
    params.isStrictSearch,
  ]);

  const floors = useMemo(() => {
    const unique = new Set<number>();
    filtered.forEach((d) => unique.add(d.floor));
    // Sort descending (original list had custom order). Provide same custom order if needed.
    return Array.from(unique).sort((a, b) => b - a);
  }, [filtered]);

  return { filtered, floors };
}

/**
 * Returns a memoised filtered list of switches and a floors array present in that list.
 */
export function useFilteredSwitches(
  switches: Switch[],
  searchQuery: string,
  isStrictSearch: boolean,
): UseFilteredSwitchesReturn {
  const filtered = useMemo(() => {
    let list = switches || [];

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter((switchDevice) => {
        if (!switchDevice) return false;
        const fields: Array<string | number | boolean | undefined> = [
          switchDevice.name,
          switchDevice.type,
          switchDevice.id,
          switchDevice.model,
          switchDevice.place,
          switchDevice.Mac,
          switchDevice.IP,
          switchDevice.Notes,
          switchDevice.floor,
        ];
        return fields.some((val) => matchesSearch(val, q, isStrictSearch));
      });
    }
    return list;
  }, [switches, searchQuery, isStrictSearch]);

  const floors = useMemo(() => {
    const unique = new Set<number>();
    filtered.forEach((s) => {
      if (s && typeof s.floor === "number") {
        unique.add(s.floor);
      }
    });
    return Array.from(unique).sort((a, b) => b - a);
  }, [filtered]);

  return { filtered, floors };
}

/**
 * Returns a memoised filtered list of patch panels and a floors array present in that list.
 */
export function useFilteredPatchPanels(
  patchPanels: PatchPanel[],
  searchQuery: string,
  isStrictSearch: boolean,
): UseFilteredPatchPanelsReturn {
  const filtered = useMemo(() => {
    let list = patchPanels || [];

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter((patchPanel) => {
        if (!patchPanel) return false;
        const fields: Array<string | number | boolean | undefined> = [
          patchPanel.title,
          patchPanel.id,
          patchPanel.unique_id,
          patchPanel.floor,
        ];
        return fields.some((val) => matchesSearch(val, q, isStrictSearch));
      });
    }
    return list;
  }, [patchPanels, searchQuery, isStrictSearch]);

  const floors = useMemo(() => {
    const unique = new Set<number>();
    filtered.forEach((pp) => {
      if (pp && typeof pp.floor === "number") {
        unique.add(pp.floor);
      }
    });
    return Array.from(unique).sort((a, b) => b - a);
  }, [filtered]);

  return { filtered, floors };
}
