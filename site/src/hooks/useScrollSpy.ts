import { useState, useEffect, useRef } from 'react';

/**
 * IntersectionObserver-based scroll spy hook.
 * Returns the ID of the most visible section among the provided section IDs.
 */
export function useScrollSpy(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsRef = useRef<string[]>(sectionIds);

  // Only update ref (and trigger re-observe) when IDs actually change
  const idsKey = JSON.stringify(sectionIds);

  useEffect(() => {
    idsRef.current = sectionIds;

    const ratioMap = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ratioMap.set(entry.target.id, entry.intersectionRatio);
          } else {
            ratioMap.delete(entry.target.id);
          }
        }

        // Find the section with highest intersection ratio
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratioMap) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        setActiveId(bestId);
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    const elements: Element[] = [];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    }

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return activeId;
}
