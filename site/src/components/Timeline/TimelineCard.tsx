import type { ProjectEntry } from '@jacklabbe/shared';
import { LanguageBadge } from './LanguageBadge';
import { formatDateRange } from '../../utils/dateUtils';

interface TimelineCardProps {
  project: ProjectEntry;
  monthKey: string;
}

export function TimelineCard({ project }: TimelineCardProps) {
  const isPublic = !project.isPrivate;

  return (
    <div className="timeline-card bg-surface border border-border rounded-lg p-4">
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
          {project.description && (
            <p className="mt-1 text-sm text-text-dim">{project.description}</p>
          )}
        </>
      ) : (
        <span className="font-semibold text-text-dim border-l-2 border-accent-secondary pl-2">
          Private Repo
        </span>
      )}

      {project.languages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {project.languages.map((lang) => (
            <LanguageBadge key={lang} language={lang} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs font-mono text-text-dim">
        <span>
          {project.totalCommits} commit{project.totalCommits !== 1 ? 's' : ''}
        </span>
        <span aria-hidden="true">&middot;</span>
        <span>{formatDateRange(project.createdAt, project.lastActiveAt)}</span>
      </div>
    </div>
  );
}
