import { useRef, useState, useEffect } from "react";

interface Position {
    x: number;
    y: number;
}

export const useBorderEffect = () => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleGlobalMouseMove);
        return () =>
            window.removeEventListener("mousemove", handleGlobalMouseMove);
    }, []);

    useEffect(() => {
        if (!divRef.current || isFocused) return;

        const rect = divRef.current.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };

        const distance = Math.sqrt(
            Math.pow(mousePos.x - center.x, 2) +
                Math.pow(mousePos.y - center.y, 2)
        );

        const maxDistance = 750;

        const newOpacity = Math.max(0, 1 - distance / maxDistance);
        setOpacity(newOpacity);

        setPosition({
            x: mousePos.x - rect.left,
            y: mousePos.y - rect.top,
        });
    }, [mousePos, isFocused]);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (!divRef.current || isFocused) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    return {
        handleBlur,
        handleFocus,
        handleMouseMove,
        isFocused,
        opacity,
        position,
        divRef,
    };
};
