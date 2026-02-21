import { GitHubIcon, LinkedInIcon, MailIcon, XIcon } from '../icons/SocialIcons';

const socialLinks = [
  { href: 'https://github.com/jacklabbe', label: 'GitHub', Icon: GitHubIcon },
  { href: 'https://linkedin.com/in/jacklabbe', label: 'LinkedIn', Icon: LinkedInIcon },
  { href: 'mailto:contact@jacklabbe.com', label: 'Email', Icon: MailIcon },
  { href: 'https://x.com/jacklabbe', label: 'X', Icon: XIcon },
] as const;

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-[1200px] mx-auto px-8 flex justify-between items-center">
        <span className="text-text-dim text-sm">&copy; 2026 Jack Labbe</span>
        <div className="flex gap-4 items-center">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-dim transition-colors duration-[120ms] flex hover:text-accent focus-visible:outline-2 focus-visible:outline-accent-secondary focus-visible:outline-offset-2 focus-visible:rounded-lg"
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
