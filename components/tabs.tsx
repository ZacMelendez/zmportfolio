"use client";

import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { ZMLogo } from "@/app/logos/ZMLogo";

export function Tabs() {
    const pathname = usePathname();

    const tabs = [
        { id: "about", label: "About", href: "/about" },
        { id: "projects", label: "Projects", href: "/projects" },
    ];

    return (
        <nav className="flex items-center justify-center lg:justify-start gap-6 lg:gap-8 px-6 lg:px-10 pb-2 lg:py-4 overflow-x-auto lg:backdrop-blur-lg">
            <ZMLogo className="w-6 h-6 hidden lg:flex" />
            {tabs.map((tab) => (
                <Link
                    key={tab.id}
                    href={tab.href}
                    className={`tab-btn whitespace-nowrap py-2 relative ${
                        pathname === tab.href ? "text-white" : "text-gray-400"
                    } hover:text-white`}
                >
                    <span className="peer">{tab.label}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-forest-500 transition-all peer-hover:w-full"></span>
                </Link>
            ))}
        </nav>
    );
}
