import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-1 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {actions ? <div className="mt-2 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">{actions}</div> : null}
    </div>
  );
}
