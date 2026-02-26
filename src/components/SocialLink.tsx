import { useBorderEffect } from "@/utils/useBorderEffect";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

interface SocialLinkProps {
    href: string;
    title: string;
    icon: ReactNode;
    external?: boolean;
}

export function SocialLink({
    href,
    title,
    icon,
    external = false,
}: SocialLinkProps) {
    const sourceRef = useRef<HTMLAnchorElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const { handleMouseMove, divRef, opacity, position } = useBorderEffect();

    useLayoutEffect(() => {
        const el = sourceRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setSize({
                width: el.offsetWidth + 2,
                height: el.offsetHeight + 2,
            });
        });
        ro.observe(el);
        setSize({ width: el.offsetWidth + 2, height: el.offsetHeight + 2 });
        return () => ro.disconnect();
    }, []);

    return (
        <a
            href={href}
            className="p-2.5 lg:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-800/80 transition-all duration-300 relative"
            title={title}
            {...(external && { target: "_blank" })}
            onMouseMove={handleMouseMove}
            ref={sourceRef}
        >
            <div
                ref={divRef}
                className={
                    "border-forest-500 pointer-events-none absolute -left-[1px] -top-[1px] z-10 h-12 w-full cursor-default rounded-xl border-2 bg-none p-3.5 opacity-0 transition-opacity duration-500"
                }
                style={{
                    opacity,
                    WebkitMaskImage: `radial-gradient(30% 100px at ${position.x}px ${position.y}px, #7f886a 85%, transparent)`,
                    height: size.height,
                    width: size.width,
                }}
            />
            {icon}
        </a>
    );
}
