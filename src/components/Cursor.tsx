import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue, useTransform, useReducedMotion, animate } from "framer-motion";

export default function Cursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [idlePulse, setIdlePulse] = useState(false);
  const lastMoveRef = useRef<number>(Date.now());
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Magnetic offset — when the pointer is near an interactive element, the
  // dot springs toward the element's center. We add this offset to the raw
  // pointer position so the spring physics still feel natural.
  const magnetX = useMotionValue(0);
  const magnetY = useMotionValue(0);
  const magnetSpring = { damping: 18, stiffness: 220, mass: 0.25 };
  const magnetXSpring = useSpring(magnetX, magnetSpring);
  const magnetYSpring = useSpring(magnetY, magnetSpring);

  // Composed target: raw pointer + magnetic pull.
  const targetX = useTransform([mouseX, magnetXSpring], ([x, mx]: number[]) => x + mx);
  const targetY = useTransform([mouseY, magnetYSpring], ([y, my]: number[]) => y + my);

  // Main cursor dot.
  const dotSpring = prefersReducedMotion
    ? { damping: 100, stiffness: 1000, mass: 0.1 }
    : { damping: 20, stiffness: 640, mass: 0.12 };
  const cursorX = useSpring(targetX, dotSpring);
  const cursorY = useSpring(targetY, dotSpring);

  // State-driven scale (click/hover shrink, idle pulse).
  const stateScale = useMotionValue(1);
  useEffect(() => {
    if (isClicking) stateScale.set(0.5);
    else if (isHovering) stateScale.set(0.6);
    else stateScale.set(1);
  }, [isClicking, isHovering, stateScale]);

  // Idle pulse: oscillate scale when idle for 2.5s.
  const pulse = useMotionValue(1);
  useEffect(() => {
    if (idlePulse && !prefersReducedMotion) {
      const controls = animate(pulse, [1, 1.7, 1], {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut",
      });
      return () => controls.stop();
    } else {
      pulse.set(1);
    }
  }, [idlePulse, prefersReducedMotion, pulse]);

  // Composed scale: state × idle pulse.
  const dotScale = useTransform([stateScale, pulse], ([a, b]: number[]) => a * b);

  useEffect(() => {
    document.documentElement.classList.toggle("custom-cursor-active", !isMobile);
    return () => document.documentElement.classList.remove("custom-cursor-active");
  }, [isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    checkMobile();

    let candidateRects: DOMRect[] = [];
    let lastCandidateRefresh = Number.NEGATIVE_INFINITY;
    const refreshCandidates = () => {
      candidateRects = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a, button, [data-snap="true"], .cursor-pointer, input, [role="button"]',
        ),
        (element) => element.getBoundingClientRect(),
      );
      lastCandidateRefresh = window.performance.now();
    };
    const invalidateCandidates = () => {
      lastCandidateRefresh = Number.NEGATIVE_INFINITY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Magnetic snap: find the nearest interactive element within range and
      // pull the dot toward its center. The pull strength falls off with
      // distance so it feels like a soft gravity well, not a hard snap.
      const MAGNET_RANGE = 90;
      let pullX = 0;
      let pullY = 0;
      if (!prefersReducedMotion) {
        const now = window.performance.now();
        if (now - lastCandidateRefresh > 200) refreshCandidates();
        let bestDist = MAGNET_RANGE;
        let bestRect: DOMRect | null = null;
        for (const r of candidateRects) {
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const d = Math.hypot(e.clientX - cx, e.clientY - cy);
          if (d < bestDist && r.width > 0 && r.height > 0) {
            bestDist = d;
            bestRect = r;
          }
        }
        if (bestRect) {
          const r = bestRect;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = cx - e.clientX;
          const dy = cy - e.clientY;
          const dist = Math.hypot(dx, dy);
          const strength = 1 - dist / MAGNET_RANGE;
          pullX = dx * strength * 0.85;
          pullY = dy * strength * 0.85;
        }
      }
      magnetX.set(pullX);
      magnetY.set(pullY);

      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);
      lastMoveRef.current = Date.now();
      setIdlePulse(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .cursor-pointer, [data-snap="true"]')) setIsHovering(true);
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .cursor-pointer, [data-snap="true"]')) setIsHovering(false);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleDocumentEnter = () => setIsVisible(true);
    const handleDocumentLeave = () => {
      setIsVisible(false);
      magnetX.set(0);
      magnetY.set(0);
    };

    // Decay magnet when the pointer stops so the cursor settles.
    const decayTimer = window.setInterval(() => {
      if (Date.now() - lastMoveRef.current > 80) {
        magnetX.set(0);
        magnetY.set(0);
      }
      if (Date.now() - lastMoveRef.current > 2500 && isVisible) {
        setIdlePulse(true);
      }
    }, 80);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", invalidateCandidates, { passive: true });
    window.addEventListener("scroll", invalidateCandidates, { passive: true });
    document.addEventListener("mouseenter", handleDocumentEnter);
    document.addEventListener("mouseleave", handleDocumentLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", invalidateCandidates);
      window.removeEventListener("scroll", invalidateCandidates);
      document.removeEventListener("mouseenter", handleDocumentEnter);
      document.removeEventListener("mouseleave", handleDocumentLeave);
      window.clearInterval(decayTimer);
    };
  }, [mouseX, mouseY, isVisible, prefersReducedMotion, magnetX, magnetY]);

  if (isMobile) return null;

  const shared = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    translateX: "-50%" as const,
    translateY: "-50%" as const,
    pointerEvents: "none" as const,
    mixBlendMode: "difference" as const,
  };

  return (
    <motion.div
      className="custom-cursor"
      style={{
        ...shared,
        x: cursorX,
        y: cursorY,
        width: 14,
        height: 14,
        borderRadius: "100%",
        backgroundColor: "white",
        zIndex: 160,
        opacity: isVisible ? 1 : 0,
        scale: dotScale,
      }}
    />
  );
}
