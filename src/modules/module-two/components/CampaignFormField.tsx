import React from "react";

import { cn } from "@/lib/utils";

export interface CampaignFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function CampaignFormField({
  id,
  label,
  helperText,
  error,
  required = false,
  children,
  className,
  ...props
}: CampaignFormFieldProps) {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children}

      {helperText ? (
        <p id={helperId} className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm leading-5 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function getCampaignFieldDescribedBy(id: string, helperText?: string, error?: string): string | undefined {
  const ids = [helperText ? `${id}-helper` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export default CampaignFormField;
