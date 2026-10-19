import { useEffect, useRef, useState } from "react";

type Dot = { x: number; y: number; gridX: number; gridY: number; index: number; neighbors: number[] };

export default function InteractiveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
      setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let width = 0;
    let height = 0;
    const spacing = 48;
    const radius = 1;
    const mouseRadius = 160;
    let dots: Dot[] = [];

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Build the grid of dots with a spatial lookup map so we can find
      // each dot's neighbors in O(1) instead of O(n²) per frame.
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      const grid: (Dot | null)[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(null),
      );

      dots = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;
          const dot: Dot = { x, y, gridX: x, gridY: y, index: dots.length, neighbors: [] };
          grid[row][col] = dot;
          dots.push(dot);
        }
      }

      // Wire up neighbors: right, down, down-right, down-left.
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dot = grid[row][col];
          if (!dot) continue;
          const right = col + 1 < cols ? grid[row][col + 1] : null;
          const down = row + 1 < rows ? grid[row + 1][col] : null;
          const downRight = col + 1 < cols && row + 1 < rows ? grid[row + 1][col + 1] : null;
          const downLeft = col - 1 >= 0 && row + 1 < rows ? grid[row + 1][col - 1] : null;
          for (const n of [right, down, downRight, downLeft]) {
            if (n) {
              dot.neighbors.push(n.index);
            }
          }
        }
      }
    };

    const renderFrame = () => {
      animationFrameId = null;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseActive = mx > -500;

      // Compute current positions (displaced by mouse) for all dots.
      const positions: { x: number; y: number; opacity: number }[] = [];
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        let px = dot.gridX;
        let py = dot.gridY;
        let opacity = 0.3;

        if (mouseActive) {
          const dx = mx - dot.gridX;
          const dy = my - dot.gridY;
          const distSq = dx * dx + dy * dy;
          if (distSq < mouseRadius * mouseRadius) {
            const dist = Math.sqrt(distSq);
            const force = (mouseRadius - dist) / mouseRadius;
            const angle = Math.atan2(dy, dx);
            px = dot.gridX - Math.cos(angle) * force * 48;
            py = dot.gridY - Math.sin(angle) * force * 48;
            opacity = 0.3 + force * 0.7;
          }
        }
        positions.push({ x: px, y: py, opacity });
      }

      // Constellation lines — always visible between grid neighbors.
      const lineDist = spacing * 1.45;
      ctx.lineWidth = 0.4;
      for (let i = 0; i < dots.length; i++) {
        const a = positions[i];
        for (const j of dots[i].neighbors) {
          const b = positions[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < lineDist) {
            const lineOpacity = (1 - dd / lineDist) * 0.18 * Math.min(a.opacity, b.opacity);
            if (lineOpacity > 0.005) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw the dots on top.
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

    };

    const scheduleRender = () => {
      if (animationFrameId !== null) return;
      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        renderFrame();
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      scheduleRender();
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      scheduleRender();
    };

    const handleResize = () => {
      setupCanvas();
      scheduleRender();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);
    setupCanvas();
    renderFrame();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMobile, prefersReducedMotion]);

  if (isMobile || prefersReducedMotion) {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
