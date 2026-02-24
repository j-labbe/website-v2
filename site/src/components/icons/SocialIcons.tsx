import { FaXTwitter } from "react-icons/fa6";
import { IoLogoGithub, IoLogoLinkedin, IoMail } from "react-icons/io5";

interface IconProps {
    size?: number;
    className?: string;
}

export function GitHubIcon({ size = 20, className }: IconProps) {
    return <IoLogoGithub size={size} className={className} aria-hidden="true" />;
}

export function LinkedInIcon({ size = 20, className }: IconProps) {
    return <IoLogoLinkedin size={size} className={className} aria-hidden="true" />;
}

export function MailIcon({ size = 20, className }: IconProps) {
    return <IoMail size={size} className={className} aria-hidden="true" />;
}

export function XIcon({ size = 20, className }: IconProps) {
    return <FaXTwitter size={size} className={className} aria-hidden="true" />;
}
