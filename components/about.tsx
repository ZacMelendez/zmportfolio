import { cn } from "@/app/utils";
import { ArrowRight } from "lucide-react";
import { Link } from "next-view-transitions";

const experienceItems: {
    title: string;
    period: string;
    description: string[];
    status: "current" | "inactive";
}[] = [
    {
        title: "Software Engineer @ CBS Interactive",
        period: "2023 - Present",
        description: [
            "Building TypeScript/React applications for production data management",
            "Developing Python APIs with AWS RDS and GraphQL integration",
            "Implementing DevOps with Docker and AWS CI/CD pipelines",
        ],
        status: "current",
    },
    {
        title: "IoT Development Engineer @ Henkel Corporation",
        period: "2021 - 2023",
        description: [
            "Managed Azure Cloud environment with IoT/Event Hub integration",
            "Built Python IoT Modules for production data collection",
        ],
        status: "inactive",
    },
    {
        title: "Full Stack Developer @ Peadbo",
        period: "2022 - 2023",
        description: [
            "Built NextJS/TypeScript web app with AWS backend",
            "Created Node/Python APIs for external data integration",
        ],
        status: "inactive",
    },
    {
        title: "Volunteer Developer @ LIFE CO. Church",
        period: "2023 - 2024",
        description: [
            "Developed JavaScript filtering system for WebFlow",
            "Migrated services to AWS SAM architecture",
        ],
        status: "inactive",
    },
];

export function About() {
    return (
        <section className="flex-1 overflow-y-auto p-10 space-y-8 pb-40 md:pb-10">
            <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-white tracking-tight">
                    Hi, I'm Zach - Full-Stack Software Engineer
                </h2>
                <div className="leading-relaxed text-gray-300 w-3/4 flex flex-col gap-2">
                    <p>
                        I'm a full-stack engineer crafting websites and
                        applications with clean, intuitive designs and
                        lightning-fast performance.
                    </p>
                    <p>
                        Outside of coding, I'm a passionate pickleball player,
                        love diving into video games, and am always on the hunt
                        for great music to listen to.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-medium text-white tracking-tight">
                    Experience
                </h3>
                <ul className="relative pl-10">
                    <div className="absolute left-[1.125rem] top-1.5 bottom-1.5 w-0.5 bg-forest-500/40"></div>

                    {experienceItems.map((item, index) => (
                        <li
                            key={index}
                            className={cn(
                                "relative",
                                index !== experienceItems.length - 1 && "pb-6"
                            )}
                        >
                            <div className="absolute -left-7 top-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center">
                                {item.status === "current" ? (
                                    <>
                                        <span className="absolute inline-flex h-full w-full animate-slow-ping rounded-full bg-forest-500 opacity-75"></span>
                                        <div className="relative w-2.5 h-2.5 bg-forest-500 rounded-full"></div>
                                    </>
                                ) : (
                                    <div className="w-2.5 h-2.5 rounded-full bg-forest-600" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="font-medium text-gray-200">
                                    {item.title}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {item.period}
                                </p>
                                <ul className="list-inside list-['-_'] pl-4 text-sm text-gray-300 space-y-1">
                                    {item.description.map((desc, i) => (
                                        <li key={i}>{desc}</li>
                                    ))}
                                </ul>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <Link
                href="/projects"
                className="justify-end flex items-center gap-2 text-lg text-forest-500 hover:text-forest-400 transition-colors"
            >
                View My Projects
                <ArrowRight className="w-4 h-4" />
            </Link>
        </section>
    );
}
