export function Divider() {
    return (
        <div
            role="separator"
            aria-hidden="true"
            className="max-w-[1200px] mx-auto px-8"
        >
            <div className="h-px bg-[linear-gradient(to_right,transparent,var(--color-border),transparent)]" />
        </div>
    );
}
