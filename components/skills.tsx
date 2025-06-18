import { Server, Cloud } from "lucide-react";
import { cn } from "@/app/utils";
import {
    React as ReactLogo,
    Typescript,
    Docker,
    GraphQL,
    AWS,
    Jest,
    Python,
    Git,
} from "@/app/logos";
import { JSX, SVGProps } from "react";

interface Skill {
    name: string;
    icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
    category: "Frontend" | "Backend" | "DevOps" | "Testing";
}

const skills: Skill[] = [
    {
        name: "TypeScript",
        icon: Typescript,
        category: "Frontend",
    },
    {
        name: "React / Next.js",
        icon: ReactLogo,
        category: "Frontend",
    },
    {
        name: "GraphQL",
        icon: GraphQL,
        category: "Backend",
    },
    {
        name: "Docker",
        icon: Docker,
        category: "DevOps",
    },
    {
        name: "Python",
        icon: Python,
        category: "Backend",
    },
    {
        name: "AWS",
        icon: AWS,
        category: "DevOps",
    },
    {
        name: "Jest",
        icon: Jest,
        category: "Testing",
    },
    {
        name: "Git",
        icon: Git,
        category: "DevOps",
    },
];

const categoryStyles = {
    Frontend: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Backend: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    DevOps: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    Testing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function Skills() {
    return (
        <section className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                Technical Skills
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
                {skills.map((skill) => (
                    <div
                        key={skill.name}
                        className="group aspect-square relative bg-gray-800/50 rounded-2xl p-3 lg:p-4 border border-gray-700 hover:border-forest-500/50 hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-forest-500/5"
                    >
                        <div className="flex flex-col items-center text-center gap-2 lg:gap-3">
                            <div className="text-forest-400 p-2 lg:p-3 rounded-xl flex-1 aspect-square h-full w-full">
                                <div className="h-full w-full p-4 lg:p-6">
                                    <skill.icon className="aspect-square h-full fill-forest-500" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm lg:text-base font-medium text-gray-200 truncate">
                                    {skill.name}
                                </h4>
                                <div className="flex justify-center flex-wrap gap-1 lg:gap-1.5 mt-1 lg:mt-1.5">
                                    <span
                                        className={cn(
                                            "text-xs px-1.5 lg:px-2 py-0.5 rounded-full border",
                                            categoryStyles[skill.category]
                                        )}
                                    >
                                        {skill.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
