"use client";

import { useBorderEffect } from "@/app/utils/useBorderEffect";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Footer } from "./footer";

type Project =
    | {
          title: string;
          description: string;
          year: string;
          image: string;
          repoUrl?: string;
          linkUrl?: string;
          technologies?: string[];
      }
    | {
          title: string;
          description: string;
          year: string;
          repoUrl?: string;
          linkUrl?: string;
          technologies?: string[];
      };

interface ProjectCardProps {
    project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
    const hasImage = "image" in project;

    const sourceRef = useRef<HTMLDivElement>(null);
    const {
        handleBlur,
        handleFocus,
        handleMouseMove,
        opacity,
        position,
        divRef,
    } = useBorderEffect();

    return (
        <article
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            ref={sourceRef}
            key={project.title}
            className="bg-gray-800/70 hover:bg-gray-800 rounded-2xl border border-gray-700 flex flex-col relative hover:scale-[1.02] transition-all"
        >
            <div
                ref={divRef}
                aria-hidden="true"
                style={{
                    opacity,
                    WebkitMaskImage: `radial-gradient(30% 100px at ${position.x}px ${position.y}px, #7f886a 85%, transparent)`,
                    height: (sourceRef.current?.clientHeight || 0) + 2,
                    width: (sourceRef.current?.clientWidth || 0) + 2,
                }}
                className={
                    "border-forest-500 pointer-events-none absolute -left-[1px] -top-[1px] z-10 h-12 w-full cursor-default rounded-2xl border-2 bg-none p-3.5 opacity-0 transition-opacity duration-500"
                }
            />
            {hasImage && (
                <div className="relative w-full aspect-[1200/630] ">
                    <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover rounded-t-2xl overflow-hidden"
                    />
                </div>
            )}
            <div className={"h-full p-4 lg:p-6 flex flex-col"}>
                <header className="flex items-start justify-between">
                    <h3 className="text-base lg:text-lg font-medium text-gray-100">
                        {project.title}
                    </h3>
                    <span className="text-xs lg:text-sm text-forest-400">
                        {project.year}
                    </span>
                </header>
                <p className="mt-3 lg:mt-4 text-sm">{project.description}</p>
                {project.technologies && (
                    <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-3 lg:mt-4">
                        {project.technologies.map((tech, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 text-xs font-medium bg-forest-400/10 text-forest-400 rounded-full"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                )}
                <div className={"flex gap-3 lg:gap-4 mt-auto"}>
                    {project.repoUrl && (
                        <a
                            href={project.repoUrl}
                            target="_blank"
                            className="mt-3 lg:mt-4 inline-flex items-center gap-1 lg:gap-2 text-sm text-forest-400 hover:underline group"
                        >
                            View Repo
                            <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out" />
                        </a>
                    )}
                    {project.linkUrl && (
                        <a
                            href={project.linkUrl}
                            target="_blank"
                            className="mt-3 lg:mt-4 inline-flex items-center gap-1.5 lg:gap-2 text-sm text-forest-400 hover:underline group"
                        >
                            View Project
                            <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out" />
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}

export const projects: Project[] = [
    // {
    //     title: "CheckMate",
    //     description:
    //         "Your intelligent pay period companion. Track income, manage bills, and stay on top of your finances with ease.",
    //     year: "2025",
    //     image: "/projects/checkmate.png",
    //     linkUrl: "https://checkmate-phi.vercel.app/",
    //     technologies: ["Next.JS", "TypeScript", "Supabase"],
    // },
    {
        title: "R6 Playbook",
        description:
            "Your ultimate resource for advanced Rainbow 6 Siege strategies, tactics, and team compositions. Elevate your game to the next level.",
        year: "2024",
        image: "/projects/r6playbook.png",
        linkUrl: "https://r6playbook.com",
        technologies: ["Next.JS", "TypeScript", "Supabase"],
    },
    // {
    //     title: "Tally",
    //     description:
    //         "Track your financial progress with Tally - a beautiful, secure personal net worth tracking app. Monitor assets, debts, and watch your wealth grow over time.",
    //     year: "2025",
    //     image: "/projects/tally.png",
    //     linkUrl: "https://tally-blush.vercel.app",
    //     repoUrl: "https://github.com/zacmelendez/tally",
    //     technologies: ["TypeScript", "Firebase", "Fastify"],
    // },
    {
        title: "Peadbo - Personal Advisory Board",
        description:
            "Assemble and manage a dream team to help you achieve your goals.",
        year: "2023",
        image: "/projects/peadbo.png",
        linkUrl: "https://peadbo.com",
        technologies: ["Next.JS", "TypeScript", "AWS Amplify"],
    },
    {
        title: "American Correctional Association",
        description:
            "The American Correctional Association is a non-profit organization that provides training and certification for correctional professionals.",
        year: "2025",
        image: "/projects/aca.png",
        linkUrl: "https://aca.org",
        technologies: ["Next.JS", "TypeScript", "Prismic"],
    },
    {
        title: "Crypto Discord Bot",
        description:
            "A Discord bot that allowed users to connect their crypto wallets and interact with the bot.",
        year: "2022",
        repoUrl: "https://github.com/zacmelendez/hbdiscord",
        technologies: ["Node.JS", "TypeScript", "Discord.JS"],
    },
    {
        title: "Job Scraper",
        description:
            "A job scraper that scrapes job listings from several companies which I was hoping to work for and saves them to a database.",
        year: "2023",
        repoUrl: "https://github.com/zacmelendez/job-scraper-ui",
        technologies: ["Svelte", "TypeScript", "Python"],
    },
];

export function Projects() {
    const projectsWithImages = projects.filter((project) => "image" in project);
    const projectsWithoutImages = projects.filter(
        (project) => !("image" in project)
    );

    return (
        <section className="flex-1 overflow-y-auto p-4 lg:p-10 flex flex-col gap-4 lg:gap-6 pb-20 md:pb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                Projects
            </h2>
            {[projectsWithImages, projectsWithoutImages].map((i, j) => (
                <div
                    key={j}
                    className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6"
                >
                    {i.map((project) => (
                        <ProjectCard key={project.title} project={project} />
                    ))}
                </div>
            ))}
            <Footer />
        </section>
    );
}
