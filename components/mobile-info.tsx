"use client";

import { Github } from "@/app/logos/Github";
import { cn } from "@/app/utils";
import { FileText, Mail } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

interface MobileInfoProps {
    isCollapsed: boolean;
}

const MobileInfo = memo(function MobileInfo({ isCollapsed }: MobileInfoProps) {
    return (
        <div className="lg:hidden">
            <div
                className={
                    "bg-gray-900/35 backdrop-blur-lg p-4 rounded-xl relative flex flex-col"
                }
            >
                <div className="flex items-center gap-4 w-full">
                    <figure
                        className={cn(
                            "overflow-hidden relative h-20 aspect-square rounded-xl border-2 border-forest-500 shadow-lg transition-all duration-300 ease-in-out",
                            isCollapsed && "h-12 rounded-md"
                        )}
                    >
                        <Image
                            src="/zach_m.webp"
                            alt="Portrait of Zach Melendez"
                            height={2049}
                            width={1536}
                            className="object-cover"
                        />
                    </figure>
                    <div className="flex-1 flex items-center gap-3">
                        <div className="flex flex-row items-center justify-between w-full">
                            <div className="flex flex-col">
                                <h2 className="text-lg font-semibold text-white tracking-tight">
                                    Zach Melendez
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Full-Stack Engineer
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <a
                                    href="mailto:zach@zmelendez.com"
                                    className="p-2"
                                    title="Email me"
                                >
                                    <Mail className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />
                                </a>
                                <a
                                    href="https://res.cloudinary.com/drmatz1gd/image/upload/v1708753008/public/Zach_M_-_Dev_Resume_dm6eso.pdf"
                                    target="_blank"
                                    className="p-2"
                                    title="View Resume"
                                >
                                    <FileText className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />
                                </a>
                                <a
                                    href="https://github.com/zacmelendez"
                                    target="_blank"
                                    className="p-2"
                                    title="GitHub Profile"
                                >
                                    <Github className="w-4 lg:w-5 h-4 lg:h-5 fill-forest-400" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MobileInfo;
