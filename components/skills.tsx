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
}

const skills: Skill[] = [
    {
        name: "TypeScript",
        icon: Typescript,
    },
    {
        name: "React / Next.js",
        icon: (props: SVGProps<SVGSVGElement>) =>
            ReactLogo({
                ...props,
                className: cn(props.className, "stroke-forest-500"),
            }),
    },
    {
        name: "GraphQL",
        icon: GraphQL,
    },
    {
        name: "Docker",
        icon: Docker,
    },
    {
        name: "Python",
        icon: Python,
    },
    {
        name: "AWS",
        icon: AWS,
    },
    {
        name: "Jest",
        icon: Jest,
    },
    {
        name: "Git",
        icon: Git,
    },
];

export function Skills() {
    return (
        <section className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8 pb-40 md:pb-10">
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
                                    <skill.icon className="w-full h-full fill-forest-500" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm lg:text-base font-medium text-gray-200 truncate">
                                    {skill.name}
                                </h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
