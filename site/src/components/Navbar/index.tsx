export const Navbar: React.FC = () => (
    <nav className="sticky top-0 z-100 py-4" aria-label="Main navigation" data-scrolled="false">
        <div className="max-w-[1200px] mx-auto px-8 flex justify-end items-center">
            <a
                href="mailto:jack.labbe@icloud.com"
                className="inline-flex items-center justify-center px-6 py-2 bg-accent/40 backdrop-blur-xl backdrop-saturate-150 text-white rounded-full font-sans font-semibold text-sm no-underline transition-all duration-200 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-accent-secondary focus-visible:outline-offset-2 ring-1 ring-white/10"
            >
                Contact
            </a>
        </div>
    </nav>
);
