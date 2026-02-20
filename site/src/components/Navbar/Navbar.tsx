import { useEffect, useRef } from 'react';
import styles from './Navbar.module.css';

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
      className={styles.navbar}
      aria-label="Main navigation"
      data-scrolled="false"
    >
      <div className={styles.inner}>
        <a
          href="mailto:contact@jacklabbe.com"
          className={styles.contactButton}
        >
          Contact
        </a>
      </div>
    </nav>
  );
}
