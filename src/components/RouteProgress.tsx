"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * RouteProgress — Premium top-bar loading indicator (like YouTube / GitHub).
 * Shows a thin animated bar at the top of the viewport during route transitions.
 * Zero dependencies. Uses Next.js App Router hooks.
 */
export default function RouteProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevPathRef = useRef(pathname);

    const startProgress = useCallback(() => {
        setVisible(true);
        setProgress(0);

        // Fast start, then slow progression (like real loading)
        let current = 0;
        const tick = () => {
            current += Math.random() * 15 + 5;
            if (current > 90) current = 90; // Never reach 100 until done
            setProgress(current);
            if (current < 90) {
                timerRef.current = setTimeout(tick, 200 + Math.random() * 300);
            }
        };
        timerRef.current = setTimeout(tick, 50);
    }, []);

    const completeProgress = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setProgress(100);
        // Fade out after completion
        setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, 400);
    }, []);

    // Detect route changes
    useEffect(() => {
        if (prevPathRef.current !== pathname) {
            completeProgress();
            prevPathRef.current = pathname;
        }
    }, [pathname, searchParams, completeProgress]);

    // Intercept link clicks to start progress immediately
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            if (!target) return;

            const href = target.getAttribute("href");
            if (!href) return;

            // Only handle internal navigation links
            if (
                href.startsWith("/") &&
                !href.startsWith("/api/") &&
                !target.hasAttribute("download") &&
                target.target !== "_blank" &&
                !e.ctrlKey && !e.metaKey && !e.shiftKey
            ) {
                // Don't start if navigating to same page
                if (href !== pathname) {
                    startProgress();
                }
            }
        };

        document.addEventListener("click", handleClick, { capture: true });
        return () => document.removeEventListener("click", handleClick, { capture: true });
    }, [pathname, startProgress]);

    if (!visible && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
            style={{ height: "3px" }}
        >
            <div
                style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #00A868, #10b981, #00A868)",
                    boxShadow: "0 0 10px rgba(0, 168, 104, 0.5), 0 0 5px rgba(0, 168, 104, 0.3)",
                    transition: progress === 100
                        ? "width 0.2s ease-out, opacity 0.4s ease-out 0.2s"
                        : "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: progress === 100 ? 0 : 1,
                    borderRadius: "0 2px 2px 0",
                }}
            />
            {/* Shimmer effect at the end of the bar */}
            {visible && progress < 100 && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "80px",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4))",
                        transform: `translateX(${progress < 90 ? "0" : "-20px"})`,
                        animation: "routeProgressShimmer 1.5s ease-in-out infinite",
                    }}
                />
            )}
        </div>
    );
}
