import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  align: "left" | "right";
  alt?: boolean;
  hoverDemo?: boolean;
};

export function SectionDemo({ title, description, children, align, alt, hoverDemo }: Props) {
  return (
    <section className={cn("py-20 sm:py-28", alt && "bg-gray-50/60")}>
      <Reveal>
        <div
          className={cn(
            "mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16",
            align === "right" && "lg:[direction:rtl] lg:*:[direction:ltr]"
          )}
        >
          <Reveal delayMs={80} className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-gray-500">
              {description}
            </p>
          </Reveal>

          <Reveal delayMs={140}>
            <div
              className={cn(
                "group relative",
                hoverDemo && "transition-transform duration-300 hover:-translate-y-1"
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute -inset-6 -z-10 rounded-[28px] opacity-0 blur-3xl transition-all duration-300",
                  // Glow gris clair fondu derrière la card (plus visible)
                  "bg-[radial-gradient(ellipse_75%_55%_at_50%_55%,rgba(156,163,175,0.55),transparent_70%)]",
                  hoverDemo && "group-hover:opacity-100 group-hover:scale-105"
                )}
              />
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5 transition-shadow duration-300",
                  hoverDemo && "group-hover:shadow-2xl group-hover:shadow-gray-900/10"
                )}
              >
                {children}
              </div>
            </div>
          </Reveal>
        </div>
      </Reveal>
    </section>
  );
}
