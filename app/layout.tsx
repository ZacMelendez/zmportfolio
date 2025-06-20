import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ViewTransitions } from "next-view-transitions";
import { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { CursorGlow } from "./components/cursor-glow";
import { Suspense } from "react";
import { Provider } from "jotai";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
    themeColor: "#3E503C",
};

export const metadata: Metadata = {
    title: "Zach Melendez - Software Engineer",
    description:
        "Zach is a full stack software engineer, specializing in React, Next.JS, and AWS.",
    metadataBase: new URL("https://zmelendez.com"),
    openGraph: {
        title: "Zach Melendez - Software Engineer",
        description:
            "Zach is a full stack software engineer, specializing in React, Next.JS, and AWS.",
        url: "https://zmelendez.com",
        type: "website",
        images: [
            {
                url: "https://res.cloudinary.com/drmatz1gd/image/upload/v1750349730/zm_og_z0eeni.png",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Zach Melendez - Software Engineer",
        description:
            "Zach is a full stack software engineer, specializing in React, Next.JS, and AWS.",
        images: [
            {
                url: "https://res.cloudinary.com/drmatz1gd/image/upload/v1750349730/zm_og_z0eeni.png",
            },
        ],
    },
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ViewTransitions>
            <html lang="en" className="dark">
                <body
                    className={`${inter.className} bg-gray-900 text-gray-300 lg:h-screen min-h-[600px] lg:overflow-y-scroll flex flex-col lg:flex-row`}
                >
                    <div className="flex-1 flex flex-col min-h-screen">
                        <Suspense>
                            <CursorGlow />
                        </Suspense>
                        <Header />
                        <div className="mt-52 lg:mt-0 overflow-y-auto z-40">
                            <Provider>{children}</Provider>
                        </div>
                    </div>

                    <Sidebar />
                </body>
            </html>
        </ViewTransitions>
    );
}
