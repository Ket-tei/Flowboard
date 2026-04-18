import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /**
   * 0, 100, 200... pour échelonner les reveals
   */
  delayMs?: number;
  /**
   * Par défaut: n'anime qu'une seule fois.
   */
  once?: boolean;
};

export function Reveal({ children, className, delayMs = 0, once = true }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const style = useMemo<CSSProperties | undefined>(
    () => (delayMs ? { transitionDelay: `${delayMs}ms` } : undefined),
    [delayMs]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      // Déclenche un peu plus tôt: on "agrandit" la zone d'observation vers le bas.
      { threshold: 0.05, rootMargin: "0px 0px 20% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "transition-all duration-700 will-change-transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

