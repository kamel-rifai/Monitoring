import { Input } from "@/components/ui/input";
import { Search, X, ScissorsLineDashed } from "lucide-react";

interface HeaderBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isStrictSearch: boolean;
  setIsStrictSearch: (strict: boolean) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenMobileFilters: () => void;
}

export function HeaderBar({
  searchQuery,
  setSearchQuery,
  isStrictSearch,
  setIsStrictSearch,
  isRefreshing,
  onRefresh,
  onOpenMobileFilters,
}: HeaderBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 pointer-events-none">
      <div className="pointer-events-auto md:ml-[13vw] border-b border-slate-200 px-4 py-2 shadow-sm backdrop-blur-sm bg-black/5 dark:border-slate-800/60 dark:bg-slate-900/70 md:px-6">
        <div className="mx-auto flex items-center gap-4 justify-between">
          <div className="min-w-0 backdrop-blur-3xl bg-white px-4 rounded-lg py-2">
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              IT Devices Monitoring Dashboard
            </h1>
            <p className="text-xs text-slate-500 md:text-sm">
              Fast overview of devices across floors
            </p>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xl">
            <div className="relative mr-8 w-full hover:scale-[1.01] transition-transform">
              <Search className="absolute left-2 top-1/2 z-50 -translate-y-1/2 size-4 text-slate-600" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="px-8 backdrop-blur-lg bg-white rounded-full py-5"
                aria-label="Search devices"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button
              className={
                "absolute right-0 top-1/2 mr-2 hover:scale-[1.02] transition-transform -translate-y-1/2 text-slate-400 hover:text-slate-600 ring ring-[#e2e8f0] p-3 rounded-full" +
                (isStrictSearch
                  ? " bg-[#035AD7]/75 text-white hover:text-white"
                  : " bg-white")
              }
              onClick={() => setIsStrictSearch(!isStrictSearch)}
              aria-label="Toggle strict search"
            >
              <ScissorsLineDashed className="size-4" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 md:hidden"
              onClick={onOpenMobileFilters}
              aria-label="Open filters"
            >
              Filters
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
