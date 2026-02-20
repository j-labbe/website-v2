import styles from './Hero.module.css';
import { HeroSkeleton } from './HeroSkeleton';

interface HeroProps {
  isLoading: boolean;
}

export function Hero({ isLoading }: HeroProps) {
  if (isLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div
          className={`${styles.photo} staggerItem`}
          style={{ '--stagger-index': 0 } as React.CSSProperties}
        >
          <img src="/headshot.webp" alt="Jack Labbe" />
        </div>
        <div className={styles.content}>
          <h1
            className={`${styles.name} staggerItem`}
            style={{ '--stagger-index': 1 } as React.CSSProperties}
          >
            Jack Labbe
          </h1>
          <p
            className={`${styles.tagline} staggerItem`}
            style={{ '--stagger-index': 2 } as React.CSSProperties}
          >
            Software / AI Engineer
          </p>
          <a
            href="mailto:contact@jacklabbe.com"
            className={`${styles.contactButton} staggerItem`}
            style={{ '--stagger-index': 3 } as React.CSSProperties}
          >
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}
