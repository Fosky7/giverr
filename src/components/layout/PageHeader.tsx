import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Optional eyebrow / kicker text shown above the title. */
  eyebrow?: string;
  /** Main page title. */
  title: string;
  /** Optional supporting description rendered below the title. */
  description?: ReactNode;
  /** Centers the header content. Defaults to false (left-aligned). */
  centered?: boolean;
  /** Additional class names for the wrapper. */
  className?: string;
}

/**
 * Reusable page header for marketing and auth pages. Renders an optional
 * eyebrow label, a prominent title, and an optional description. Alignment
 * can be toggled via the `centered` prop.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  centered = false,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "space-y-3",
        centered && "flex flex-col items-center text-center",
        className
      )}
    >
      {eyebrow ? (
        <span className="inline-flex w-fit items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
          {eyebrow}
        </span>
      ) : null}

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>

      {description ? (
        <p className="max-w-2xl text-base text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export default PageHeader;
