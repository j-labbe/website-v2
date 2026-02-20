import styles from './Divider.module.css';

export function Divider() {
  return (
    <div role="separator" aria-hidden="true" className={styles.divider}>
      <div className={styles.line} />
    </div>
  );
}
