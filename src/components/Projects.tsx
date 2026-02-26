import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import { useBorderEffect } from "@/utils/useBorderEffect";
import { ArrowUpRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Footer } from "./Footer";

interface ProjectCardProps {
    project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
    const hasImage = "image" in project;

    const sourceRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const {
        handleBlur,
        handleFocus,
        handleMouseMove,
        opacity,
        position,
        divRef,
    } = useBorderEffect();

    useLayoutEffect(() => {
        const el = sourceRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setSize({
                width: el.offsetWidth + 2,
                height: el.offsetHeight + 2,
            });
        });
        ro.observe(el);
        setSize({ width: el.offsetWidth + 2, height: el.offsetHeight + 2 });
        return () => ro.disconnect();
    }, []);

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
                    height: size.height,
                    width: size.width,
                }}
                className={
                    "border-forest-500 pointer-events-none absolute -left-[1px] -top-[1px] z-10 h-12 w-full cursor-default rounded-2xl border-2 bg-none p-3.5 opacity-0 transition-opacity duration-500"
                }
            />
            {hasImage && (
                <div className="relative w-full aspect-[1200/630] ">
                    <img
                        src={project.image}
                        alt={project.title}
                        className="object-cover rounded-t-2xl overflow-hidden w-full h-full"
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