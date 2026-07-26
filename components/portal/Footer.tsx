import Link from "next/link";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "./SocialIcons";

const QUICK_LINKS = [
  { label: "Buy", href: "/buy/lahore" },
  { label: "Rent", href: "/rent/lahore" },
  { label: "New Projects", href: "/new-projects" },
  { label: "Agents", href: "/agents" },
  { label: "Blog", href: "/blog" },
  { label: "Tools", href: "/tools" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Advertise", href: "/advertise" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy-policy" },
];

const CITY_LINKS = [
  { label: "Lahore", href: "/buy/lahore" },
  { label: "Karachi", href: "/buy/karachi" },
  { label: "Islamabad", href: "/buy/islamabad" },
  { label: "Rawalpindi", href: "/buy/rawalpindi" },
  { label: "Faisalabad", href: "/buy/faisalabad" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YoutubeIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
];

export function Footer() {
  return (
    <footer className="bg-primary pb-6 pt-12 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xl font-bold text-primary">
              S
            </span>
            <span className="text-lg font-bold text-white">SarZameenz</span>
          </Link>
          <p className="mt-3 text-sm text-white/70">Pakistan&apos;s Real Estate Growth Ecosystem</p>
          <div className="mt-4 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-white transition hover:text-secondary"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Quick Links" links={QUICK_LINKS} />
        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="Cities" links={CITY_LINKS} />
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-primary-mid px-4 pt-6">
        <p className="text-sm text-white/70">© 2025 SarZameenz.com</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-white/70 transition hover:text-secondary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
