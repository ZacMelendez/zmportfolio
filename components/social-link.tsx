"use client";
import { useBorderEffect } from "@/app/utils/useBorderEffect";
import { ReactNode, useRef } from "react";

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
    const { handleMouseMove, divRef, opacity, position } = useBorderEffect();

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
                    height: (sourceRef.current?.clientHeight || 0) + 2,
                    width: (sourceRef.current?.clientWidth || 0) + 2,
                }}
            />
            {icon}
        </a>
    );
}
