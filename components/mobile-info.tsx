import { Github } from "@/app/logos/Github";
import { FileText, Mail } from "lucide-react";

export default function MobileInfo() {
    return (
        <div className="md:hidden">
            <div className="bg-gray-900/35 backdrop-blur-lg p-4 m-4 rounded-xl relative flex flex-col transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-4 w-full">
                    <img
                        src="/zach_m.jpg"
                        className="max-h-24 aspect-square rounded-xl border-2 border-forest-500 shadow-lg object-cover"
                        alt="Portrait of Zach Melendez"
                    />
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start">
                            <h2 className="text-lg font-semibold text-white tracking-tight">
                                Zach Melendez
                            </h2>
                            <p className="text-sm text-gray-400">
                                Full-Stack Engineer
                            </p>
                            <div className="flex gap-3 justify-center mt-2">
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
}
