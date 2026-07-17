// src/components/campaign/CampaignFormStepper.tsx
//
// Visual step indicator for the multi-step Create Campaign wizard. Renders one
// node per step with three visual states driven entirely by design tokens:
//   * completed → filled primary circle with a check icon
//   * current   → primary-ringed circle with the step number
//   * upcoming  → muted circle with the step number
//
// Purely presentational: the orchestrator passes the ordered step metadata and
// the active index. Connector bars between nodes fill as steps complete.

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StepperStep {
  /** Stable id for the step (matches the form schema step id). */
  id: string;
  /** Short, human-readable label shown under the node. */
  title: string;
  /** Optional helper text shown on wider screens. */
  description?: string;
}

interface CampaignFormStepperProps {
  /** Ordered list of steps to render. */
  steps: readonly StepperStep[];
  /** Zero-based index of the currently active step. */
  currentStep: number;
  /** Optional click handler allowing navigation back to a completed step. */
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * Accessible step progress indicator. Uses an ordered list so assistive tech
 * announces "step N of M" naturally, and marks the current node with
 * aria-current.
 */
export function CampaignFormStepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: CampaignFormStepperProps) {
  return (
    <nav aria-label="Campaign creation progress" className={cn("w-full", className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = Boolean(onStepClick) && index < currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={isClickable ? () => onStepClick?.(index) : undefined}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary ring-4 ring-primary/15",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer hover:opacity-90"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  <span className="sr-only">
                    {`Step ${index + 1}: ${step.title}`}
                    {isCompleted
                      ? " (completed)"
                      : isCurrent
                        ? " (current)"
                        : ""}
                  </span>
                </button>

                <div className="hidden text-center sm:block">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isCurrent || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description ? (
                    <p className="mt-0.5 hidden max-w-[10rem] text-[11px] leading-tight text-muted-foreground lg:block">
                      {step.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Connector bar between nodes. */}
              {index < steps.length - 1 ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-4",
                    index < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default CampaignFormStepper;
