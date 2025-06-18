"use client";

import { useEffect, useState } from "react";
import MobileInfo from "./mobile-info";
import { Tabs } from "./tabs";
import { cn } from "@/app/utils";

export function Header() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsCollapsed(scrollPosition > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "p-3 lg:p-0 fixed lg:relative top-0 right-0 left-0 z-50 backdrop-blur-lg flex flex-col gap-4",
                isCollapsed && "gap-2 pb-0"
            )}
        >
            <MobileInfo isCollapsed={isCollapsed} />
            <Tabs />
        </header>
    );
}
