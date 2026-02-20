import styles from './SkipToContent.module.css';

export function SkipToContent() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Skip to content
    </a>
  );
}
