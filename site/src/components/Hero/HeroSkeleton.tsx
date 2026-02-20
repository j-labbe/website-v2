import styles from './HeroSkeleton.module.css';

export function HeroSkeleton() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.photoPlaceholder}>
          <div className={`${styles.photoShape} skeleton`} />
        </div>
        <div className={styles.content}>
          <div className={`${styles.namePlaceholder} skeleton`} />
          <div className={`${styles.taglinePlaceholder} skeleton`} />
          <div className={`${styles.buttonPlaceholder} skeleton`} />
        </div>
      </div>
    </section>
  );
}
