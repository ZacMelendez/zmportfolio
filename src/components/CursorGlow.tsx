import { useSyncExternalStore, useEffect, useState } from "react";

function subscribeToMedia(query: MediaQueryList, callback: () => void) {
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
}

export const CursorGlow = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const isDesktop = useSyncExternalStore(
        (callback) =>
            subscribeToMedia(
                window.matchMedia("(min-width: 1024px)"),
                callback
            ),
        () => window.matchMedia("(min-width: 1024px)").matches,
        () => false
    );

    useEffect(() => {
        if (!isDesktop) return;
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", updateMousePosition);
        return () =>
            window.removeEventListener("mousemove", updateMousePosition);
    }, [isDesktop]);

    return !isDesktop ? null : (
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