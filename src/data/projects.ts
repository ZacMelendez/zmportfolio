export type Project =
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
