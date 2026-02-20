import styles from './SectionPlaceholder.module.css';

interface SectionPlaceholderProps {
  label: string;
}

export function SectionPlaceholder({ label }: SectionPlaceholderProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.label}>{label}</span>
      </div>
    </section>
  );
}
