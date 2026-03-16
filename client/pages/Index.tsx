import { useEffect, useState } from "react";
import { FloorSection } from "@/components/FloorSection";
import { Sidebar } from "@/components/Sidebar";
import { DeviceModal } from "@/components/DeviceModal";
import { SwitchModal } from "@/components/SwitchModal";
import { PatchPanelModal } from "@/components/PatchPanelModal";
import { HeaderBar } from "@/components/HeaderBar";
import { DeviceGrid } from "@/components/DeviceGrid";
import { PatchPanelGrid } from "@/components/PatchPanelGrid";
import { NetworkGrid } from "@/components/NetworkGrid";
import { FLOORS } from "@/constants/floors";
import { useDevices } from "@/hooks/useDevices";
import { useDeviceFilters } from "@/hooks/useDeviceFilters";
import {
  useFilteredDevices,
  useFilteredSwitches,
  useFilteredPatchPanels,
} from "@/hooks/useFilteredDevices";
import type { Device, Switch, PatchPanel } from "@shared/api";
import { Plus } from "lucide-react";
import {
  addDevice,
  editDevice,
  addSwitch,
  editSwitch,
  addPatchPanel,
  editPatchPanel,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import CableManagement from "@/components/CableSection";

export default function Index() {
  const queryClient = useQueryClient();
  const {
    devices,
    deviceTypes,
    switches,
    patchPanels,
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing,
  } = useDevices();

  const filters = useDeviceFilters();
  const { filtered, floors } = useFilteredDevices(devices, filters);
  const { filtered: filteredSwitches, floors: switchFloors } =
    useFilteredSwitches(switches, filters.searchQuery, filters.isStrictSearch);
  const { filtered: filteredPatchPanels, floors: patchPanelFloors } =
    useFilteredPatchPanels(
      patchPanels,
      filters.searchQuery,
      filters.isStrictSearch,
    );

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<
    Device | Switch | PatchPanel | null
  >(null);
  const [selectedSwitch, setSelectedSwitch] = useState<Switch | null>(null);
  const [selectedPatchPanel, setSelectedPatchPanel] =
    useState<PatchPanel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "add">("view");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 dark:from-slate-950 dark:to-slate-900">
      <HeaderBar
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        isStrictSearch={filters.isStrictSearch}
        setIsStrictSearch={filters.setIsStrictSearch}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onOpenMobileFilters={() => setMobileSidebarOpen(true)}
      />
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar
            mode={"filters"}
            types={deviceTypes}
            selected={filters.selectedTypes}
            onToggle={(t) => {
              filters.setInactiveOnly(false);
              filters.setSelectedTypes((prev) => (prev[0] === t ? [] : [t]));
            }}
            onClear={() => filters.setSelectedTypes([])}
            inactiveOnly={filters.inactiveOnly}
            onToggleInactive={() => {
              filters.setInactiveOnly((v) => !v);
              filters.setSelectedTypes([]);
            }}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            className="fixed inset-y-0 left-0 h-screen w-[13vw] z-30 pt-16"
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
                selected={filters.selectedTypes}
                onToggle={(t) => {
                  filters.setInactiveOnly(false);
                  filters.setSelectedTypes((prev) =>
                    prev[0] === t ? [] : [t],
                  );
                }}
                onClear={() => filters.setSelectedTypes([])}
                inactiveOnly={filters.inactiveOnly}
                onToggleInactive={() => {
                  filters.setInactiveOnly((v) => !v);
                  filters.setSelectedTypes([]);
                }}
                onRefresh={refresh}
                isRefreshing={isRefreshing}
                className="h-full"
              />
            </div>
          </>
        )}

        <main className="flex-1 pt-14 ml-[13vw]">
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
              <p className="font-semibold">Failed to load devices.</p>
              <p className="mt-1 mb-2">
                If this message persists, please contact me (Kamel Rifai).
              </p>
              {String((error as Error)?.message ?? "")}
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {filters.selectedTypes.length === 1 &&
              filters.selectedTypes[0] === "Switch" ? (
                <NetworkGrid
                  switches={filteredSwitches}
                  deviceType="switch"
                  onDeviceLongPress={(d) => {
                    setSelectedSwitch(d);
                    setModalMode("view");
                    setModalOpen(true);
                  }}
                />
              ) : filters.selectedTypes.length === 1 &&
                filters.selectedTypes[0] === "Patch-Panel" ? (
                <PatchPanelGrid
                  patchPanels={filteredPatchPanels}
                  deviceType="patch-panel"
                  onDeviceLongPress={(d) => {
                    setSelectedPatchPanel(d);
                    setModalMode("view");
                    setModalOpen(true);
                  }}
                />
              ) : filters.selectedTypes.includes("Cables") ? (
                <CableManagement
                  devices={filtered}
                  switches={filteredSwitches}
                  patchpanels={filteredPatchPanels}
                  onRefresh={refresh}
                />
              ) : (
                <DeviceGrid
                  floors={floors}
                  devices={filtered}
                  onDeviceLongPress={(d) => {
                    setSelectedDevice(d);
                    setModalMode("view");
                    setModalOpen(true);
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Add Buttons */}
        {filters.selectedTypes[0] !== "Cables" && (
          <div className="fixed bottom-5 right-5 z-40 flex items-start flex-col gap-0 md:bottom-6 md:right-2">
            {/* Add Switch Button */}
            <button
              className="inline-flex items-center justify-center rounded-full border bg-transparent border-none border-emerald-300 bg-emerald-500 text-white transition hover:-translate-y-0.5 px-4 py-2 text-sm font-medium"
              aria-label="Add switch"
              onClick={() => {
                setSelectedSwitch({
                  id: 0,
                  name: "",
                  type: "switch",
                  floor: 1,
                  active: true,
                  unique_id: "",
                  model: "",
                  place: "",
                  Mac: "",
                  IP: "",
                  Notes: "",
                  POE: false,
                  total_ports: 48,
                  total_fiber_ports: 0,
                  ports: Array.from({ length: 16 }, (_, i) => ({
                    id: 0,
                    port_number: i + 1,
                    title: `Port ${i + 1}`,
                    unique_id: "",
                    switch_id: 0,
                    device_id: null,
                    device: null,
                    switch: null,
                    patch_panel_port: null,
                  })),
                  show: true,
                });
                setModalMode("add");
                setModalOpen(true);
              }}
            >
              <Plus className="ring-1 ring-emerald-300 size-8 mr-1 bg-emerald-500 text-white p-2 rounded-full shadow-sm" />
              <span className="p-2 px-6 bg-emerald-500 rounded-full border border-emerald-300 shadow-sm">
                Switch
              </span>
            </button>

            {/* Add Patch Panel Button */}
            <button
              className="inline-flex items-center justify-center rounded-full border bg-transparent border-none border-emerald-300 bg-emerald-500 text-white transition hover:-translate-y-0.5 px-4 py-2 text-sm font-medium"
              aria-label="Add patch panel"
              onClick={() => {
                setSelectedPatchPanel({
                  id: 0,
                  title: "",
                  unique_id: "",
                  show: true,
                  floor: 1,
                  ports: Array.from({ length: 24 }, (_, i) => ({
                    id: 0,
                    title: `Port ${i + 1}`,
                    port_number: i + 1,
                    switch_port: null,
                    cable_number: "",
                    cable_length: "",
                  })),
                });
                setModalMode("add");
                setModalOpen(true);
              }}
            >
              <Plus className="ring-1 ring-blue-300 size-8 mr-1 bg-blue-500 text-white p-2 rounded-full shadow-sm" />
              <span className="p-2 px-6 bg-blue-500 rounded-full border border-blue-300 shadow-sm">
                Patch Panel
              </span>
            </button>

            {/* Add Device Button */}
            <button
              className="inline-flex items-center justify-center rounded-full border bg-transparent border-none border-emerald-300 bg-emerald-500 text-white transition hover:-translate-y-0.5 px-4 py-2 text-sm font-medium"
              aria-label="Add device"
              onClick={() => {
                setSelectedDevice(null);
                setModalMode("add");
                setModalOpen(true);
              }}
            >
              <Plus className="ring-1 ring-slate-500 size-8  mr-1 bg-slate-900 text-white p-2 rounded-full shadow-sm" />
              <span className="p-2 px-6 bg-slate-900 rounded-full border border-slate-500 shadow-sm">
                Device
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Device Modal */}
      {(() => {
        // Check for patch panel first (most specific)
        if (selectedPatchPanel) {
          return (
            <PatchPanelModal
              open={modalOpen}
              patchPanel={selectedPatchPanel}
              mode={modalMode}
              isSubmitting={isSubmitting}
              availableSwitches={switches}
              allPatchPanels={patchPanels}
              onOpenChange={(open) => {
                setModalOpen(open);
                if (!open) {
                  setSelectedPatchPanel(null);
                }
              }}
              onUpdate={(updatedPatchPanel) => {
                // Update the selectedPatchPanel state to reflect changes
                setSelectedPatchPanel(updatedPatchPanel);
              }}
              onSave={async (patch) => {
                if (modalMode === "view") {
                  setModalMode("edit");
                  return;
                }

                if (isSubmitting) return;
                setIsSubmitting(true);

                try {
                  if (modalMode === "add") {
                    await addPatchPanel(patch);
                    // Refetch the devices data
                    await queryClient.invalidateQueries({
                      queryKey: ["devices"],
                    });
                    setModalOpen(false);
                    setModalMode("view");
                    setSelectedPatchPanel(null);
                  } else if (modalMode === "edit" && selectedPatchPanel) {
                    const updatedPatchPanel = {
                      id: selectedPatchPanel.id,
                      title: patch.title,
                      unique_id: patch.unique_id,
                      show: patch.show,
                      ports: patch.ports,
                      floor: patch.floor,
                    };
                    await editPatchPanel(updatedPatchPanel);

                    // Optimistically update cached data so reopening the modal
                    // reflects the new port info immediately without requiring
                    // a manual refresh.
                    queryClient.setQueryData(["devices"], (oldData: any) => {
                      if (!oldData) return oldData;
                      return {
                        ...oldData,
                        patchPanels: oldData.patchPanels.map((pp: any) =>
                          pp.id === updatedPatchPanel.id
                            ? updatedPatchPanel
                            : pp,
                        ),
                      };
                    });

                    // also update selectedPatchPanel in case user keeps modal open
                    setSelectedPatchPanel(updatedPatchPanel);

                    // Refetch in background to ensure consistency
                    await queryClient.invalidateQueries({
                      queryKey: ["devices"],
                    });
                    setModalOpen(false);
                    setModalMode("view");
                    setSelectedPatchPanel(null);
                  }
                } catch (error) {
                  console.error("Failed to save patch panel:", error);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          );
        }

        // Check for switch second
        if (selectedSwitch) {
          const switchData = selectedSwitch;
          return (
            <SwitchModal
              open={modalOpen}
              switch={switchData}
              mode={modalMode}
              isSubmitting={isSubmitting}
              availableDevices={devices}
              onOpenChange={(open) => {
                setModalOpen(open);
                if (!open) {
                  setSelectedSwitch(null);
                }
              }}
              onUpdate={(updatedSwitch) => {
                // Update the selectedSwitch state to reflect changes
                setSelectedSwitch(updatedSwitch);
              }}
              onSave={async (dev) => {
                if (modalMode === "view") {
                  setModalMode("edit");
                  return;
                }

                if (isSubmitting) return;
                setIsSubmitting(true);

                try {
                  if (modalMode === "add") {
                    const createdSwitch = await addSwitch(dev);

                    // Refetches devices data to get the updated switch with proper IDs
                    await queryClient.invalidateQueries({
                      queryKey: ["devices"],
                    });
                    setModalOpen(false);
                    setModalMode("view");
                    setSelectedSwitch(null);
                  } else if (modalMode === "edit" && switchData) {
                    const updatedSwitch = {
                      ...dev,
                      id: switchData.id,
                    };
                    await editSwitch(updatedSwitch);
                    // Refetch the devices data
                    await queryClient.invalidateQueries({
                      queryKey: ["devices"],
                    });
                    setModalOpen(false);
                    setModalMode("view");
                    setSelectedSwitch(null);
                  }
                } catch (error) {
                  console.error("Failed to save switch:", error);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          );
        }

        // Default to device modal
        return (
          <DeviceModal
            open={modalOpen}
            device={selectedDevice as Device}
            mode={modalMode}
            isSubmitting={isSubmitting}
            onOpenChange={setModalOpen}
            switches={switches}
            onSave={async (dev) => {
              if (modalMode === "view") {
                setModalMode("edit");
                return;
              }

              if (isSubmitting) return;
              setIsSubmitting(true);

              try {
                if (modalMode === "edit" && selectedDevice) {
                  const updatedDevice = {
                    ...dev,
                    id: selectedDevice.id,
                  };
                  await editDevice(updatedDevice);
                  // Refetch the devices data
                  await queryClient.invalidateQueries({
                    queryKey: ["devices"],
                  });
                  setModalOpen(false);
                  setModalMode("view");
                } else if (modalMode === "add") {
                  const newDevice = await addDevice(dev);
                  // Refetch the devices data
                  await queryClient.invalidateQueries({
                    queryKey: ["devices"],
                  });
                  setModalOpen(false);
                  setModalMode("view");
                }
              } catch (error) {
                console.error("Failed to save device:", error);
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        );
      })()}
    </div>
  );
}
