import { Github } from "@/app/logos/Github";
import { Mail, FileText } from "lucide-react";
import { SocialLink } from "./social-link";
import { ReactNode } from "react";
import Image from "next/image";
import { Footer } from "./footer";

interface SocialLinkConfig {
    href: string;
    title: string;
    icon: ReactNode;
    external?: boolean;
}

export function Sidebar() {
    return (
        <aside
            className={
                "fixed lg:relative w-[85vw] lg:w-full lg:max-w-sm border-l border-gray-800  p-6 lg:p-8 hidden lg:flex flex-col lg:h-full bg-gray-900/95 backdrop-blur-lg transition-all duration-300 ease-in-out z-40 h-full top-0 lg:right-0"
            }
        >
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="space-y-6 lg:space-y-8 flex flex-col items-center text-center">
                    <div className="flex flex-col items-center gap-4 w-full">
                        <figure className="overflow-hidden w-[75%] aspect-square rounded-2xl border-2 border-forest-500 shadow-lg object-cover">
                            <Image
                                src="/zach_m.webp"
                                alt="Portrait of Zach Melendez"
                                height={2049}
                                width={1536}
                                className="object-cover"
                            />
                        </figure>
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
                        {socials.map((link, i) => (
                            <SocialLink key={i} {...link} />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </aside>
    );
}

const socials: SocialLinkConfig[] = [
    {
        href: "mailto:zach@zmelendez.com",
        title: "Email me",
        icon: <Mail className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />,
    },
    {
        href: "https://res.cloudinary.com/drmatz1gd/image/upload/v1708753008/public/Zach_M_-_Dev_Resume_dm6eso.pdf",
        title: "View Resume",
        icon: <FileText className="w-4 lg:w-5 h-4 lg:h-5 text-forest-400" />,
        external: true,
    },
    {
        href: "https://github.com/zacmelendez",
        title: "GitHub Profile",
        icon: <Github className="w-4 lg:w-5 h-4 lg:h-5 fill-forest-400" />,
        external: true,
    },
];
