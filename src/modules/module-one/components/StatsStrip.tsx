import React from "react";

import { cn } from "@/lib/utils";
import type { StatItem } from "../types";

interface StatsStripProps extends React.HTMLAttributes<HTMLElement> {
  stats: StatItem[];
}

export function StatsStrip({ stats, className, ...props }: StatsStripProps) {
  return (
    <section
      className={cn("bg-background px-4 py-10 sm:px-6 lg:px-8", className)}
      aria-label="Giverr platform impact statistics"
      {...props}
    >
      <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted/40 p-5 text-center sm:text-left">
              <dt className="text-sm font-medium leading-6 text-muted-foreground">{stat.label}</dt>
              <dd className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </dd>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default StatsStrip;
