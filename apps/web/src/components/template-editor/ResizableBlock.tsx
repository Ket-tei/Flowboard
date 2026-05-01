import { useRef } from "react";
import { MIN_DURATION_MS, PX_PER_MS } from "@/lib/timeline";

interface ResizableBlockProps {
  widthPx: number;
  color: string;
  label: string;
  sublabel?: string;
  onResize?: (newWidthPx: number) => void;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ResizableBlock({
  widthPx,
  color,
  label,
  sublabel,
  onResize,
  onClick,
  children,
  style: extraStyle = {},
}: ResizableBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const minW = MIN_DURATION_MS * PX_PER_MS;

  const onMouseDown = (side: "left" | "right") => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthPx;

    const move = (ev: MouseEvent) => {
      const delta = side === "right" ? ev.clientX - startX : startX - ev.clientX;
      const newW = Math.max(minW, startW + delta);
      onResize?.(newW);
    };

    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const handleReveal = (show: boolean) => {
    if (!ref.current) return;
    ref.current.querySelectorAll<HTMLElement>(".te-resize-handle").forEach((h) => {
      h.style.opacity = show ? "1" : "0";
    });
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => handleReveal(true)}
      onMouseLeave={() => handleReveal(false)}
      style={{
        position: "relative",
        width: widthPx,
        minWidth: minW,
        height: 48,
        borderRadius: 6,
        background: color,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 6,
        cursor: "default",
        overflow: "hidden",
        flexShrink: 0,
        ...extraStyle,
      }}
    >
      {/* Left resize handle */}
      <div
        className="te-resize-handle"
        onMouseDown={onMouseDown("left")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 7,
          height: "100%",
          cursor: "ew-resize",
          background: "rgba(255,255,255,0.18)",
          borderRadius: "4px 0 0 4px",
          opacity: 0,
          transition: "opacity 0.12s",
          zIndex: 2,
        }}
      />

      {/* Right resize handle */}
      <div
        className="te-resize-handle"
        onMouseDown={onMouseDown("right")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 7,
          height: "100%",
          cursor: "ew-resize",
          background: "rgba(255,255,255,0.18)",
          borderRadius: "0 4px 4px 0",
          opacity: 0,
          transition: "opacity 0.12s",
          zIndex: 2,
        }}
      />

      {children ?? (
        <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </div>
          {sublabel && (
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.65)",
                whiteSpace: "nowrap",
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
