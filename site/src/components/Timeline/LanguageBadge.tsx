import { getLanguageColor } from "../../utils/languageColors";

interface LanguageBadgeProps {
    language: string;
}

export function LanguageBadge({ language }: LanguageBadgeProps) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: getLanguageColor(language) }}
                aria-hidden="true"
            />
            <span className="text-xs font-mono text-text-dim">{language}</span>
        </span>
    );
}
