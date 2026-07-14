import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CampaignCategory, CampaignFiltersState, LegacyCampaignStatus } from "../types";

interface CampaignFiltersProps extends React.HTMLAttributes<HTMLFormElement> {
  filters: CampaignFiltersState;
  onFiltersChange: (filters: CampaignFiltersState) => void;
  isLoading?: boolean;
}

const categories: Array<{ value: "all" | CampaignCategory; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "medical", label: "Medical" },
  { value: "education", label: "Education" },
  { value: "emergency", label: "Emergency relief" },
  { value: "community", label: "Community" },
  { value: "ngo", label: "NGO programs" },
  { value: "environment", label: "Environment" },
  { value: "other", label: "Other" },
];

const statuses: Array<{ value: "all" | LegacyCampaignStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const sortOptions: Array<{ value: CampaignFiltersState["sortBy"]; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "mostFunded", label: "Most funded" },
  { value: "endingSoon", label: "Ending soon" },
  { value: "goalAmount", label: "Largest goal" },
];

const fieldClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const DEFAULT_FILTERS: CampaignFiltersState = {
  query: "",
  category: "all",
  status: "all",
  sortBy: "newest",
};

export function CampaignFilters({
  filters,
  onFiltersChange,
  isLoading = false,
  className,
  ...props
}: CampaignFiltersProps) {
  const [draftQuery, setDraftQuery] = React.useState(filters.query);
  const searchInputId = React.useId();
  const categorySelectId = React.useId();
  const statusSelectId = React.useId();
  const sortSelectId = React.useId();

  React.useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (draftQuery !== filters.query) {
        onFiltersChange({ ...filters, query: draftQuery });
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftQuery, filters, onFiltersChange]);

  const updateFilter = <TKey extends keyof CampaignFiltersState>(key: TKey, value: CampaignFiltersState[TKey]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setDraftQuery("");
    onFiltersChange(DEFAULT_FILTERS);
  };

  const applySearchNow = () => {
    if (draftQuery !== filters.query) {
      onFiltersChange({ ...filters, query: draftQuery });
    }
  };

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.category !== DEFAULT_FILTERS.category ||
    filters.status !== DEFAULT_FILTERS.status ||
    filters.sortBy !== DEFAULT_FILTERS.sortBy;

  return (
    <form
      className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5", className)}
      role="search"
      aria-label="Filter campaigns"
      onSubmit={(event) => {
        event.preventDefault();
        applySearchNow();
      }}
      {...props}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))_auto] lg:items-end">
        <div className="space-y-2">
          <label htmlFor={searchInputId} className="text-sm font-medium text-foreground">
            Search
          </label>
          <input
            id={searchInputId}
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            className={fieldClassName}
            type="search"
            placeholder="Search by title, organizer, or location"
            autoComplete="off"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={categorySelectId} className="text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id={categorySelectId}
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value as CampaignFiltersState["category"])}
            className={fieldClassName}
            disabled={isLoading}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor={statusSelectId} className="text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id={statusSelectId}
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value as CampaignFiltersState["status"])}
            className={fieldClassName}
            disabled={isLoading}
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor={sortSelectId} className="text-sm font-medium text-foreground">
            Sort
          </label>
          <select
            id={sortSelectId}
            value={filters.sortBy}
            onChange={(event) => updateFilter("sortBy", event.target.value as CampaignFiltersState["sortBy"])}
            className={fieldClassName}
            disabled={isLoading}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="button" variant="outline" onClick={resetFilters} className="w-full lg:w-auto" disabled={!hasActiveFilters || isLoading}>
          Reset
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Search updates are debounced to avoid excessive campaign API calls. Press Enter to apply immediately.
      </p>
    </form>
  );
}

export default CampaignFilters;
