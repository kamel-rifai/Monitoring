import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDevices } from "@/lib/api";
import type { Device, System, Switch, PatchPanel } from "@shared/api";

interface UseDevicesReturn {
  devices: Device[];
  deviceTypes: string[];
  switches: Switch[];
  patchPanels: PatchPanel[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

/**
 * Centralised data-fetching hook for the monitoring dashboard.
 * Wraps the React-Query logic and exposes a flattened list of all devices
 * together with loading / error meta state and an explicit `refresh` handler.
 */
export function useDevices(): UseDevicesReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<System>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 240_000, // 4 minutes
    refetchOnWindowFocus: false,
  });

  // Manual refetch indicator so the UI can show a spinner independent of the
  // background polling triggered by React Query.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, queryClient]);

  // Flatten all devices across systems into one convenient array.
  const devices = useMemo((): Device[] => {
    if (!data) return [];
    return data.devices || [];
  }, [data]);

  const switches = useMemo(() => {
    return data?.switches as Switch[];
  }, [data]);

  const patchPanels = useMemo(() => {
    return data?.patchpanels as PatchPanel[];
  }, [data]);

  // Distinct available device types – handy for filter UIs.
  const deviceTypes = useMemo(() => {
    const set = new Set<string>();
    devices.forEach((d) => set.add(d.type));
    set.add("Switch");
    set.add("Patch-Panel");
    return Array.from(set);
  }, [devices]);

  return {
    devices,
    deviceTypes,
    switches,
    patchPanels,
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing,
  };
}
