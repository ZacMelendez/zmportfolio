import { Github } from "@/app/logos/Github";
import { Mail, FileText } from "lucide-react";

export function Sidebar() {
    return (
        <aside
            className={
                "fixed lg:relative w-[85vw] lg:w-full lg:max-w-sm border-l border-gray-800  p-6 lg:p-8 flex flex-col lg:h-full bg-gray-900/95 backdrop-blur-lg transition-all duration-300 ease-in-out z-40 h-full top-0 lg:right-0"
            }
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
                            <div className="flex flex-col items-center">
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
                            <Github className="w-4 lg:w-5 h-4 lg:h-5 fill-forest-400" />
                        </a>
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4 lg:mt-0">
                © {new Date().getFullYear()} Zach Melendez
            </p>
        </aside>
    );
}
