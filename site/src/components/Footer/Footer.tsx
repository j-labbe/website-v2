import styles from './Footer.module.css';
import { GitHubIcon, LinkedInIcon, MailIcon, XIcon } from '../icons/SocialIcons';

const socialLinks = [
  { href: 'https://github.com/jacklabbe', label: 'GitHub', Icon: GitHubIcon },
  { href: 'https://linkedin.com/in/jacklabbe', label: 'LinkedIn', Icon: LinkedInIcon },
  { href: 'mailto:contact@jacklabbe.com', label: 'Email', Icon: MailIcon },
  { href: 'https://x.com/jacklabbe', label: 'X', Icon: XIcon },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <span className={styles.copyright}>&copy; 2026 Jack Labbe</span>
        <div className={styles.socials}>
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
