"use client";
import { Link } from "next-view-transitions";

export const Footer = () => (
    <span className="flex justify-center items-center gap-2 text-xs text-gray-500 text-center mt-8 lg:mt-0">
        <p>© {new Date().getFullYear()} Zach Melendez</p>|
        <Link href="/quote" className="hover:text-forest-400 transition-colors">
            View Pricing
        </Link>
    </span>
);
