import { useState } from "react";

export interface DeviceFiltersState {
  selectedTypes: string[];
  inactiveOnly: boolean;
  searchQuery: string;
  isStrictSearch: boolean;
}

interface UseDeviceFiltersReturn extends DeviceFiltersState {
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setInactiveOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setIsStrictSearch: React.Dispatch<React.SetStateAction<boolean>>;
  resetFilters: () => void;
}

export function useDeviceFilters(
  initialType: string = "telephone",
): UseDeviceFiltersReturn {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([initialType]);
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStrictSearch, setIsStrictSearch] = useState(false);

  const resetFilters = () => {
    setSelectedTypes([]);
    setInactiveOnly(false);
    setSearchQuery("");
    setIsStrictSearch(false);
  };

  return {
    selectedTypes,
    setSelectedTypes,
    inactiveOnly,
    setInactiveOnly,
    searchQuery,
    setSearchQuery,
    isStrictSearch,
    setIsStrictSearch,
    resetFilters,
  };
}
