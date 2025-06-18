export function ZMLogo(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 30 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M1 20L7 28L29 8L23 0L1 20Z" fill="#3E503C" />
            <path d="M0 0L6 8H29L23 0H0Z" fill="#7F886A" />
            <path d="M1 20L7 28H30L24 20H1Z" fill="#7F886A" />
        </svg>
    );
}
