"use client";

import { useEffect, useState } from "react";

export const CursorGlow = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Only add mouse tracking on screens larger than mobile
        const mediaQuery = window.matchMedia("(min-width: 1024px)");

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

    return (
        <div aria-hidden className="fixed inset-0 pointer-events-none">
            <div
                className="absolute w-96 h-96 bg-forest-600/30 blur-3xl rounded-full animate-pulse"
                style={{
                    transform: `translate(${
                        // Only apply mouse position on lg screens and up
                        window.innerWidth >= 1024
                            ? `${mousePosition.x - 192}px, ${
                                  mousePosition.y - 192
                              }px`
                            : "-128px, -80px" // Fixed position for mobile
                    })`,
                    transition: "transform 0.2s ease-out",
                }}
            />
        </div>
    );
};
