import {
  liquidMetalFragmentShader,
  ShaderMount,
  type PaperShaderElement,
} from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/liquid-metal-button.css";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

interface ButtonDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [shaderFailed, setShaderFailed] = useState(false);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderMount | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);
  const isHoveredRef = useRef(false);
  const timeouts = useRef(new Set<number>());

  const dimensions = useMemo<ButtonDimensions>(
    () => (viewMode === "icon"
      ? { width: 46, height: 46, innerWidth: 42, innerHeight: 42 }
      : { width: 142, height: 46, innerWidth: 138, innerHeight: 42 }),
    [viewMode],
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = shaderRef.current;
    if (!container) return undefined;

    try {
      const paperShaderContainer = container as HTMLDivElement & PaperShaderElement;
      paperShaderContainer.paperShaderMount = undefined;
      shaderMount.current = new ShaderMount(
        paperShaderContainer,
        liquidMetalFragmentShader,
        {
          u_colorBack: [0.008, 0.014, 0.035, 1],
          u_colorTint: [0.025, 0.22, 0.92, 0.78],
          u_repetition: 4,
          u_softness: 0.38,
          u_shiftRed: 0.12,
          u_shiftBlue: 0.72,
          u_distortion: 0.18,
          u_contour: 0.16,
          u_angle: 45,
          u_scale: 8,
          u_shape: 1,
          u_offsetX: 0.1,
          u_offsetY: -0.1,
        },
        undefined,
        reducedMotion ? 0 : 0.6,
      );
      setShaderFailed(false);
    } catch (error) {
      console.error("Failed to initialize the liquid metal button shader:", error);
      setShaderFailed(true);
    }

    return () => {
      shaderMount.current?.dispose();
      shaderMount.current = null;
      timeouts.current.forEach((timeout) => window.clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, [dimensions]);

  function schedule(callback: () => void, delay: number) {
    const timeout = window.setTimeout(() => {
      timeouts.current.delete(timeout);
      callback();
    }, delay);
    timeouts.current.add(timeout);
  }

  function handlePointerEnter() {
    isHoveredRef.current = true;
    setIsHovered(true);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shaderMount.current?.setSpeed(1);
    }
  }

  function handlePointerLeave() {
    isHoveredRef.current = false;
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6,
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse" || event.button === 0) {
      setIsPressed(true);
    }
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (shaderMount.current && !reducedMotion) {
      shaderMount.current.setSpeed(2.4);
      schedule(() => {
        shaderMount.current?.setSpeed(isHoveredRef.current ? 1 : 0.6);
      }, 300);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = event.clientX === 0 ? rect.width / 2 : event.clientX - rect.left;
      const y = event.clientY === 0 ? rect.height / 2 : event.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((current) => [...current, ripple]);
      schedule(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, 600);
    }

    onClick?.();
  }

  return (
    <div className="liquid-metal-button">
      <div className="liquid-metal-button__perspective">
        <div
          className="liquid-metal-button__frame"
          data-view-mode={viewMode}
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <div
            className={`liquid-metal-button__surface${shaderFailed ? " is-fallback" : ""}${isPressed ? " is-pressed" : ""}`}
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <div
              className="liquid-metal-button__inner"
              style={{ width: dimensions.innerWidth, height: dimensions.innerHeight }}
            />
            <div
              ref={shaderRef}
              className="liquid-metal-button__shader"
              style={{ width: dimensions.width, height: dimensions.height }}
            />
          </div>

          <button
            ref={buttonRef}
            type="button"
            className="liquid-metal-button__hit-area"
            onClick={handleClick}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={() => setIsPressed(false)}
            onPointerCancel={() => setIsPressed(false)}
            aria-label={viewMode === "icon" ? label : undefined}
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <span className="liquid-metal-button__content">
              {viewMode === "icon" ? <Sparkles size={16} /> : label}
            </span>
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="liquid-metal-button__ripple"
                style={{ left: ripple.x, top: ripple.y }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
