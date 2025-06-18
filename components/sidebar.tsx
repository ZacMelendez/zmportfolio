"use client";

import { ZMLogo } from "@/app/logos";
import { Github, Mail, FileText, Info, XIcon } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-xl transition-all duration-300 group"
                data-state={isOpen ? "open" : "closed"}
            >
                <div className="relative h-6 w-6 flex-shrink-0">
                    <div className="absolute inset-0 transform transition-all duration-300 ease-in-out group-data-[state=closed]:rotate-0 group-data-[state=open]:rotate-90 group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0">
                        <Info className="h-6 w-6 text-forest-500" />
                    </div>
                    <div className="absolute inset-0 transform transition-all duration-300 ease-in-out group-data-[state=closed]:rotate-90 group-data-[state=open]:rotate-0 group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100">
                        <XIcon className="h-6 w-6 text-forest-500" />
                    </div>
                </div>
            </button>

            <aside
                className={`
                    fixed lg:relative w-[85vw] lg:w-full lg:max-w-sm border-l border-gray-800 
                    p-6 lg:p-8 flex flex-col lg:h-full bg-gray-900/95 backdrop-blur-lg
                    transition-all duration-300 ease-in-out z-40 h-full top-0
                    ${isOpen ? "right-0" : "-right-[85vw]"}
                    lg:right-0
                `}
            >
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="space-y-6 lg:space-y-8 flex flex-col items-center text-center">
                        <div className="flex flex-col items-center gap-4 w-full">
                            <img
                                src="/zach_m.jpg"
                                className="w-[75%] aspect-square rounded-2xl border-2 border-forest-500 shadow-lg object-cover"
                                alt="Portrait of Zach Melendez"
                            />
                            <div className="flex items-center gap-3">
                                <ZMLogo className="w-8 lg:w-10 h-8 lg:h-10" />
                                <div className="flex flex-col items-start">
                                    <h2 className="text-xl lg:text-2xl font-semibold text-white tracking-tight">
                                        Zach Melendez
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Full-Stack Engineer
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <a
                                href="mailto:zach@zmelendez.com"
                                className="p-2.5 lg:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-forest-500/50 hover:bg-gray-800/80 transition-all duration-300"
                                title="Email me"
                            >
                                <Mail className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />
                            </a>
                            <a
                                href="https://res.cloudinary.com/drmatz1gd/image/upload/v1708753008/public/Zach_M_-_Dev_Resume_dm6eso.pdf"
                                target="_blank"
                                className="p-2.5 lg:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-forest-500/50 hover:bg-gray-800/80 transition-all duration-300"
                                title="View Resume"
                            >
                                <FileText className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />
                            </a>
                            <a
                                href="https://github.com/zacmelendez"
                                target="_blank"
                                className="p-2.5 lg:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-forest-500/50 hover:bg-gray-800/80 transition-all duration-300"
                                title="GitHub Profile"
                            >
                                <Github className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />
                            </a>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4 lg:mt-0">
                    © {new Date().getFullYear()} Zach Melendez
                </p>
            </aside>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
