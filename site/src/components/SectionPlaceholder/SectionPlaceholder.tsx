interface SectionPlaceholderProps {
    label: string;
}

export function SectionPlaceholder({ label }: SectionPlaceholderProps) {
    return (
        <section className="py-12 min-h-[200px]">
            <div className="max-w-[1200px] mx-auto px-8">
                <span className="font-mono text-text-dim text-sm tracking-wider">
                    {label}
                </span>
            </div>
        </section>
    );
}
