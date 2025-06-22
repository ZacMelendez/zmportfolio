"use client";

import { useEffect, useState } from "react";

export const CursorGlow = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Only add mouse tracking on screens larger than mobile
        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        setIsMobile(mediaQuery.matches);
        const updateMousePosition = (e: MouseEvent) => {
            if (mediaQuery.matches) {
                setMousePosition({ x: e.clientX, y: e.clientY });
            }
        };

        window.addEventListener("mousemove", updateMousePosition);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
        };
    }, []);

    return !isMobile ? null : (
        <div aria-hidden className="fixed inset-0 pointer-events-none">
            <div
                className="absolute w-96 h-96 bg-forest-600/30 blur-3xl rounded-full animate-pulse"
                style={{
                    transform: `translate(${`${mousePosition.x - 192}px, ${
                        mousePosition.y - 192
                    }px`})`,
                    transition: "transform 0.2s ease-out",
                }}
            />
        </div>
    );
};
