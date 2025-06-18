import Image from "next/image";

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

export const projects: Project[] = [
    {
        title: "CheckMate",
        description:
            "Your intelligent pay period companion. Track income, manage bills, and stay on top of your finances with ease.",
        year: "2025",
        image: "/projects/checkmate.png",
        linkUrl: "https://checkmate-phi.vercel.app/",
        technologies: ["Next.JS", "TypeScript", "Supabase"],
    },
    {
        title: "R6 Playbook",
        description:
            "Your ultimate resource for advanced Rainbow 6 Siege strategies, tactics, and team compositions. Elevate your game to the next level.",
        year: "2024",
        image: "/projects/r6playbook.png",
        linkUrl: "https://r6playbook.com",
        technologies: ["Next.JS", "TypeScript", "Supabase"],
    },
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
        linkUrl: "https://acawebsite.vercel.app",
        technologies: ["Next.JS", "TypeScript", "Prismic"],
    },
    {
        title: "Crypto Discord Bot",
        description:
            "A Discord bot that allowed users to connect their crypto wallets and interact with the bot.",
        year: "2022",
        repoUrl: "https://github.com/ZacMelendez/hbdiscord",
        technologies: ["Node.JS", "TypeScript", "Discord.JS"],
    },
];

export function Projects() {
    const projectsWithImages = projects.filter((project) => "image" in project);
    const projectsWithoutImages = projects.filter(
        (project) => !("image" in project)
    );

    return (
        <section className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 lg:space-y-8 pb-40 md:pb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                Projects
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                {projectsWithImages.map((project, index) => (
                    <article
                        key={index}
                        className="bg-gray-800/70 hover:bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 transition-colors"
                    >
                        <div className="relative w-full aspect-[1200/630]">
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-4 lg:p-6">
                            <header className="flex items-center justify-between">
                                <h3 className="text-base lg:text-lg font-medium text-gray-100">
                                    {project.title}
                                </h3>
                                <span className="text-xs lg:text-sm text-forest-400">
                                    {project.year}
                                </span>
                            </header>
                            <p className="mt-3 lg:mt-4 text-sm">
                                {project.description}
                            </p>
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
                            <div className="flex gap-3 lg:gap-4 mt-3 lg:mt-4">
                                {project.repoUrl && (
                                    <a
                                        href={project.repoUrl}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-sm text-forest-400 hover:underline"
                                    >
                                        View Repo
                                        <i
                                            data-lucide="arrow-right"
                                            className="w-3 h-3 lg:w-4 lg:h-4"
                                        ></i>
                                    </a>
                                )}
                                {project.linkUrl && (
                                    <a
                                        href={project.linkUrl}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-sm text-forest-400 hover:underline"
                                    >
                                        View Project
                                        <i
                                            data-lucide="arrow-right"
                                            className="w-3 h-3 lg:w-4 lg:h-4"
                                        ></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                {projectsWithoutImages.map((project, index) => (
                    <article
                        key={index}
                        className="bg-gray-800/70 hover:bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 transition-colors"
                    >
                        <div className="p-4 lg:p-6">
                            <header className="flex items-center justify-between">
                                <h3 className="text-base lg:text-lg font-medium text-gray-100">
                                    {project.title}
                                </h3>
                                <span className="text-xs lg:text-sm text-forest-400">
                                    {project.year}
                                </span>
                            </header>
                            <p className="mt-3 lg:mt-4 text-sm">
                                {project.description}
                            </p>
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
                            <div className="flex gap-3 lg:gap-4 mt-3 lg:mt-4">
                                {project.repoUrl && (
                                    <a
                                        href={project.repoUrl}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-sm text-forest-400 hover:underline"
                                    >
                                        View Repo
                                        <i
                                            data-lucide="arrow-right"
                                            className="w-3 h-3 lg:w-4 lg:h-4"
                                        ></i>
                                    </a>
                                )}
                                {project.linkUrl && (
                                    <a
                                        href={project.linkUrl}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 lg:gap-2 text-sm text-forest-400 hover:underline"
                                    >
                                        View Project
                                        <i
                                            data-lucide="arrow-right"
                                            className="w-3 h-3 lg:w-4 lg:h-4"
                                        ></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
