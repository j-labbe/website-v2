import type { ProjectEntry } from "@jacklabbe/shared";
import { IoLockClosed } from "react-icons/io5";
import { formatDateRange } from "../../utils/dateUtils";
import { LanguageBadge } from "./LanguageBadge";

interface TimelineCardProps {
    project: ProjectEntry;
    monthKey: string;
}

export function TimelineCard({ project }: TimelineCardProps) {
    const isPublic = !project.isPrivate;

    return (
        <div className="timeline-card bg-surface border border-border rounded-lg p-4 max-sm:p-5">
            {isPublic ? (
                <>
                    <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-hover font-semibold text-text-bright"
                    >
                        {project.name}
                    </a>
                    {project.description && <p className="mt-1 text-sm text-text-dim">{project.description}</p>}
                </>
            ) : (
                <span className="font-semibold text-text-dim cursor-default">
                    <IoLockClosed className="inline-block mb-1.5 mr-1.5" aria-hidden="true" />
                    Private Repo
                </span>
            )}

            {project.languages.length > 0 && (
                <div className="mt-3 max-sm:mt-4 flex flex-wrap gap-2">
                    {project.languages.map((lang) => (
                        <LanguageBadge key={lang} language={lang} />
                    ))}
                </div>
            )}

            <div className="mt-3 max-sm:mt-4 flex items-center gap-3 text-xs font-mono text-text-dim flex-wrap">
                <span className="whitespace-nowrap">
                    {project.totalCommits} commit
                    {project.totalCommits !== 1 ? "s" : ""}
                </span>
                <span aria-hidden="true">&middot;</span>
                <span className="whitespace-nowrap">{formatDateRange(project.createdAt, project.lastActiveAt)}</span>
            </div>
        </div>
    );
}
