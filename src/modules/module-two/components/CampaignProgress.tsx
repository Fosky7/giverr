import React from "react";

import { cn } from "@/lib/utils";

export interface CampaignProgressCalculation {
  raisedAmount: number;
  goalAmount: number;
  rawPercentage: number;
  percentage: number;
  roundedPercentage: number;
}

export interface CampaignProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  raisedAmount: number | null | undefined;
  goalAmount: number | null | undefined;
  currency?: string | null;
  donorCount?: number | null;
  compact?: boolean;
  showAmounts?: boolean;
  label?: string;
}

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toSafeAmount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeCurrency(currency: string | null | undefined): string {
  const candidate = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(candidate) ? candidate : "USD";
}

export function formatCampaignCurrency(value: number | null | undefined, currency: string | null | undefined = "USD"): string {
  const safeCurrency = normalizeCurrency(currency);

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(toSafeAmount(value));
  } catch {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(toSafeAmount(value));
  }
}

export function calculateCampaignProgress(
  raisedAmount: number | null | undefined,
  goalAmount: number | null | undefined,
): CampaignProgressCalculation {
  const safeRaised = toSafeAmount(raisedAmount);
  const safeGoal = toSafeAmount(goalAmount);

  // Defensively guard against divide-by-zero even though the database rejects invalid goals.
  // Over-funded campaigns keep their true raised amount visible while the bar is capped at 100%.
  const rawPercentage = safeGoal > 0 ? (safeRaised / safeGoal) * 100 : 0;
  const percentage = clamp(rawPercentage, 0, 100);

  return {
    raisedAmount: safeRaised,
    goalAmount: safeGoal,
    rawPercentage,
    percentage,
    roundedPercentage: Math.round(percentage),
  };
}

function formatDonorCount(value: number | null | undefined): string {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  return compactNumberFormatter.format(safeValue);
}

export function CampaignProgress({
  raisedAmount,
  goalAmount,
  currency = "USD",
  donorCount,
  compact = false,
  showAmounts = true,
  label,
  className,
  ...props
}: CampaignProgressProps) {
  const progressId = React.useId();
  const progress = calculateCampaignProgress(raisedAmount, goalAmount);
  const formattedRaised = formatCampaignCurrency(progress.raisedAmount, currency);
  const formattedGoal = formatCampaignCurrency(progress.goalAmount, currency);
  const hasDonorCount = typeof donorCount === "number" && Number.isFinite(donorCount);
  const progressLabel =
    label ?? `${formattedRaised} raised of ${formattedGoal} goal, ${progress.roundedPercentage}% funded`;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {showAmounts ? (
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn("font-bold tracking-tight text-foreground", compact ? "text-lg" : "text-2xl")}>
              {formattedRaised}
            </p>
            <p className="text-sm text-muted-foreground">raised of {formattedGoal}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-primary">{progress.roundedPercentage}%</p>
            {hasDonorCount ? (
              <p className="text-xs text-muted-foreground">{formatDonorCount(donorCount)} donors</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn("overflow-hidden rounded-full bg-secondary", compact ? "h-2" : "h-3")}
        role="progressbar"
        aria-labelledby={progressId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.roundedPercentage}
        aria-valuetext={progressLabel}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <span id={progressId} className="sr-only">
        {progressLabel}
      </span>
    </div>
  );
}

export default CampaignProgress;
