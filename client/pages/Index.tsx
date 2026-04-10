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
import { cn } from "@/lib/utils";

function ActionButton({
  label,
  icon,
  onClick,
  accentColor,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl p-2 pr-5 transition-all duration-300 ease-out",
        "border shadow-sm hover:shadow-xl hover:-translate-y-1",

        // Light Mode
        "bg-white border-slate-200/60 text-slate-800 hover:ring-slate-200",

        // Dark Mode
        "dark:bg-slate-950 dark:border-slate-800/50 dark:hover:bg-slate-900/50 dark:hover:ring-slate-800 dark:text-slate-100",
      )}
    >
      {/* Icon Container - Matches the DeviceCard top-left icon box */}
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg border transition-colors",
          "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50 group-hover:border-transparent group-hover:bg-opacity-100",
          label === "Switch" &&
            "group-hover:bg-emerald-500/10 group-hover:text-emerald-500",
          label === "Patch Panel" &&
            "group-hover:bg-blue-500/10 group-hover:text-blue-500",
        )}
      >
        {icon}
      </div>

      {/* Label - Matches the "ID badge" font style */}
      <span className="font-mono text-[12px] font-bold uppercase tracking-tight opacity-80">
        {label}
      </span>

      {/* Subtle Bottom Accent Line - Matches DeviceCard hover effect */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full",
          accentColor,
        )}
      />
    </button>
  );
}

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
          <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 md:right-4">
            {/* Add Switch Button */}
            <ActionButton
              label="Switch"
              icon={<Plus className="size-4" />}
              accentColor="bg-emerald-500"
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
            />

            {/* Add Patch Panel Button */}
            <ActionButton
              label="Patch Panel"
              icon={<Plus className="size-4" />}
              accentColor="bg-blue-500"
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
            />

            {/* Add Device Button */}
            <ActionButton
              label="Device"
              icon={<Plus className="size-4" />}
              accentColor="bg-emerald-500"
              onClick={() => {
                setSelectedDevice(null);
                setModalMode("add");
                setModalOpen(true);
              }}
            />
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
            patchPanels={patchPanels}
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
