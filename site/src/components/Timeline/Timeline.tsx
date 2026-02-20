import { useRef, useEffect, useCallback } from 'react';
import type { ProjectsFile } from '@jacklabbe/shared';
import { groupByMonth } from '../../utils/dateUtils';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { TimelineCard } from './TimelineCard';
import { DateSpine } from './DateSpine';

interface TimelineProps {
  projects: ProjectsFile;
}

/**
 * Hook that returns a ref callback. When the element enters the viewport,
 * the 'visible' class is added for the fade-in animation.
 */
function useInViewRef(): (node: HTMLDivElement | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observerRef.current?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return useCallback((node: HTMLDivElement | null) => {
    if (node) {
      observerRef.current?.observe(node);
    }
  }, []);
}

export function Timeline({ projects }: TimelineProps) {
  const months = groupByMonth(projects.projects);
  const sectionIds = months.map((m) => 'month-' + m.key);
  const activeMonth = useScrollSpy(sectionIds);
  const inViewRef = useInViewRef();

  return (
    <section aria-label="Project timeline">
      {/* Section heading */}
      <div className="mb-6">
        <span className="font-mono text-text-dim text-sm">// projects</span>
        <div className="mt-2 h-px bg-[linear-gradient(to_right,var(--color-border),transparent)]" />
      </div>

      {/* Two-column layout: main content + date spine */}
      <div className="flex gap-6 overflow-visible">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-10">
          {months.map((month) => (
            <div key={month.key} id={'month-' + month.key}>
              <h3 className="font-bold font-mono text-text-bright text-sm mb-3 pb-2 border-b border-border">
                {month.label}
              </h3>
              <div className="space-y-3">
                {month.projects.map((project) => (
                  <div
                    key={`${month.key}-${project.id}`}
                    ref={inViewRef}
                    className="stagger-item"
                  >
                    <TimelineCard project={project} monthKey={month.key} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Date spine sidebar */}
        <DateSpine
          months={months.map((m) => ({ key: m.key, label: m.label }))}
          activeMonth={activeMonth}
        />
      </div>
    </section>
  );
}
