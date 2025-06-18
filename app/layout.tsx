import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Tabs } from "@/components/tabs";
import { ReactScan } from "./react-scan";
import { ViewTransitions } from "next-view-transitions";
import { Metadata, Viewport } from "next";

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
                url: "https://res.cloudinary.com/drmatz1gd/image/upload/v1708754284/open_graph_rqf9dy.png",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Zach Melendez - Software Engineer",
        description:
            "Zach is a full stack software engineer, specializing in React, Next.JS, and AWS.",
        images: [],
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
                    className={`${inter.className} bg-gray-900 text-gray-300 h-screen overflow-hidden flex flex-col lg:flex-row`}
                >
                    <div className="flex-1 flex flex-col min-h-0">
                        <div
                            aria-hidden
                            className="absolute inset-0 pointer-events-none"
                        >
                            <div className="absolute -top-20 -left-32 w-96 h-96 bg-forest-600/30 blur-3xl rounded-full animate-pulse"></div>
                        </div>

                        <Tabs />
                        {children}
                    </div>

                    <Sidebar />
                </body>
                <ReactScan />
            </html>
        </ViewTransitions>
    );
}
