import { useEffect, useRef } from 'react';

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '0';
    sentinel.style.height = '1px';
    sentinel.style.width = '1px';
    sentinel.style.pointerEvents = 'none';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        nav.setAttribute(
          'data-scrolled',
          String(!entry.isIntersecting)
        );
      },
      { threshold: 1.0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-100 bg-bg/80 backdrop-blur-[12px] border-b border-transparent transition-[border-color] duration-250 ease py-4"
      aria-label="Main navigation"
      data-scrolled="false"
    >
      <div className="max-w-[1200px] mx-auto px-8 flex justify-end items-center">
        <a
          href="mailto:contact@jacklabbe.com"
          className="inline-flex items-center justify-center px-6 py-2 bg-accent text-bg rounded-full font-sans font-semibold text-sm no-underline transition-opacity duration-[120ms] hover:opacity-85 focus-visible:outline-2 focus-visible:outline-accent-secondary focus-visible:outline-offset-2"
        >
          Contact
        </a>
      </div>
    </nav>
  );
}
