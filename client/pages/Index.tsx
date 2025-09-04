import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FloorSection } from "@/components/FloorSection";
import { Sidebar } from "@/components/Sidebar";
import { DeviceModal } from "@/components/DeviceModal";
import type { Device } from "@shared/api";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const API_URL = "http://192.168.1.18:3666/devices";

async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch devices: ${res.status}`);
  const data = (await res.json()) as Device[];
  return data;
}

export default function Index() {
  const { data, isLoading, isError, error } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    refetchInterval: 5000000,
    refetchOnWindowFocus: false,
  });

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["telephone"]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "add">("view");
  const [overrides, setOverrides] = useState<Record<string, Partial<Device>>>(
    {},
  );
  const [addedDevices, setAddedDevices] = useState<Device[]>([]);

  const merged = useMemo(() => {
    const base = (data ?? []).map((d) => ({
      ...d,
      ...(overrides[String(d.id)] || {}),
    }));
    return [...base, ...addedDevices];
  }, [data, overrides, addedDevices]);

  const deviceTypes = useMemo(() => {
    const set = new Set<string>();
    merged.forEach((d) => set.add(d.type));
    return Array.from(set);
  }, [merged]);

  const filtered = useMemo(() => {
    if (!merged) return [] as Device[];
    let list = merged;
    if (inactiveOnly) list = list.filter((d) => !d.active);
    if (selectedTypes.length > 0)
      list = list.filter((d) => selectedTypes.includes(d.type));
    return list;
  }, [merged, selectedTypes, inactiveOnly]);

  const floors = useMemo(() => [10, 9, 8, 7, 6, 5, 4, 3, 2, 12, 11, 1], []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:to-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none">
        <div className="pointer-events-auto md:ml-52 border-b border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 md:px-6">
          <div className="mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                Building Devices Dashboard
              </h1>
              <p className="text-xs text-slate-500 md:text-sm">
                Live overview of devices across floors
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open filters"
            >
              Filters
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar
            mode={"filters"}
            types={deviceTypes}
            selected={selectedTypes}
            onToggle={(t) => {
              setInactiveOnly(false);
              setSelectedTypes((prev) => (prev[0] === t ? [] : [t]));
            }}
            onClear={() => setSelectedTypes([])}
            inactiveOnly={inactiveOnly}
            onToggleInactive={() => {
              setInactiveOnly((v) => !v);
              setSelectedTypes([]);
            }}
            className="fixed inset-y-0 left-0 h-screen z-30 pt-16"
          />
        </div>

        {/* Mobile overlay sidebar */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 pt-16 md:hidden">
              <Sidebar
                mode={"filters"}
                types={deviceTypes}
                selected={selectedTypes}
                onToggle={(t) => {
                  setInactiveOnly(false);
                  setSelectedTypes((prev) => (prev[0] === t ? [] : [t]));
                }}
                onClear={() => setSelectedTypes([])}
                inactiveOnly={inactiveOnly}
                onToggleInactive={() => {
                  setInactiveOnly((v) => !v);
                  setSelectedTypes([]);
                }}
                className="h-full"
              />
            </div>
          </>
        )}

        <main className="flex-1 pt-16 md:ml-56">
          {isLoading && (
            <div className="flex h-[50vh] items-center justify-center">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
                aria-label="Loading"
              />
            </div>
          )}
          {isError && (
            <div className="px-4 py-6 text-center text-sm text-rose-600 md:px-6">
              Failed to load devices. Ensure the API is running at {API_URL}.{" "}
              {String((error as Error)?.message ?? "")}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-gray-100">
              {floors.map((f) => (
                <FloorSection
                  key={f}
                  floor={f}
                  title={
                    f === 0
                      ? "Underground Floor"
                      : f === 11
                        ? "Clinics Section"
                        : f === 12
                          ? "Kidney Section"
                          : undefined
                  }
                  devices={filtered.filter((d) => d.floor === f)}
                  onDeviceLongPress={(d) => {
                    setSelectedDevice(d);
                    setModalMode("view");
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </main>

        {/* Add Device FAB */}
        <button
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 md:bottom-6 md:right-6"
          aria-label="Add device"
          onClick={() => {
            setSelectedDevice(null);
            setModalMode("add");
            setModalOpen(true);
          }}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Device Modal */}
      <DeviceModal
        open={modalOpen}
        device={selectedDevice}
        mode={modalMode}
        onOpenChange={setModalOpen}
        onSave={(dev) => {
          if (modalMode === "view") {
            setModalMode("edit");
            return;
          }
          if (modalMode === "edit" && selectedDevice) {
            setOverrides((m) => ({
              ...m,
              [String(selectedDevice.id)]: {
                ...m[String(selectedDevice.id)],
                ...dev,
              },
            }));
            setModalOpen(false);
            setModalMode("view");
            return;
          }
          if (modalMode === "add") {
            const id = `local-${Date.now()}`;
            const newDevice: Device = { ...dev, id };
            setAddedDevices((arr) => [...arr, newDevice]);
            setModalOpen(false);
            setModalMode("view");
            return;
          }
        }}
      />
    </div>
  );
}
