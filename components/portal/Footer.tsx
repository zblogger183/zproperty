import Link from "next/link";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "./SocialIcons";
import { NewsletterSignup } from "./NewsletterSignup";

const PROPERTIES_LINKS = [
  { label: "Houses for Sale in Lahore", href: "/buy/lahore?type=house" },
  { label: "Flats for Sale in Karachi", href: "/buy/karachi?type=flat" },
  { label: "Plots for Sale in Islamabad", href: "/buy/islamabad?type=residential_plot" },
  { label: "Houses for Rent in Lahore", href: "/rent/lahore?type=house" },
  { label: "Commercial for Sale in Karachi", href: "/commercial/karachi" },
  { label: "Properties in Peshawar", href: "/buy/peshawar" },
  { label: "Properties in Rawalpindi", href: "/buy/rawalpindi" },
  { label: "New Projects", href: "/new-projects" },
  { label: "All Listings", href: "/" },
];

const TOOLS_LINKS = [
  { label: "EMI Calculator", href: "/tools/emi-calculator" },
  { label: "Construction Cost Calculator", href: "/tools/construction-cost" },
  { label: "Area Converter", href: "/tools/area-converter" },
  { label: "ROI Calculator", href: "/tools/roi-calculator" },
  { label: "Rent vs Buy", href: "/tools/rent-vs-buy" },
  { label: "Stamp Duty Calculator", href: "/tools/stamp-duty" },
  { label: "Area Guides", href: "/area-guide/lahore/dha-phase-6" },
  { label: "Forum", href: "/forum" },
  { label: "Blog", href: "/blog" },
];

const CITY_LINKS = [
  { label: "Properties in Lahore", href: "/buy/lahore" },
  { label: "Properties in Karachi", href: "/buy/karachi" },
  { label: "Properties in Islamabad", href: "/buy/islamabad" },
  { label: "Properties in Rawalpindi", href: "/buy/rawalpindi" },
  { label: "Properties in Faisalabad", href: "/buy/faisalabad" },
  { label: "Properties in Multan", href: "/buy/multan" },
  { label: "Properties in Peshawar", href: "/buy/peshawar" },
  { label: "Properties in Quetta", href: "/buy/quetta" },
  { label: "DHA Lahore", href: "/buy/lahore/dha" },
  { label: "Bahria Town Lahore", href: "/buy/lahore/bahria-town" },
  { label: "DHA Karachi", href: "/buy/karachi/dha" },
  { label: "Clifton Karachi", href: "/buy/karachi/clifton" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Advertise", href: "/advertise" },
  { label: "Careers", href: "/careers" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
];

const AGENT_LINKS = [
  { label: "Register as Agent", href: "/register" },
  { label: "Agent Dashboard", href: "/dashboard" },
  { label: "Post a Listing", href: "/dashboard/listings/new" },
  { label: "Subscription Plans", href: "/dashboard/subscription" },
  { label: "Verify CNIC", href: "/dashboard/settings" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YoutubeIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
];

const FOOTER_LINK_CLASS = "block py-0.5 text-sm text-secondary transition hover:text-white";

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="bg-primary-mid px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-base font-bold text-white">Get property alerts across Pakistan</p>
            <p className="mt-0.5 text-sm text-white/70">New listings straight to your inbox</p>
          </div>
          <NewsletterSignup />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xl font-bold text-primary">
              Z
            </span>
            <span className="text-lg font-bold text-white">ZProperty</span>
          </Link>
          <p className="mt-2 text-sm text-white/60">Pakistan&apos;s Real Estate Growth Ecosystem</p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            Find verified properties for sale and rent across Pakistan.
          </p>
          <div className="mt-4 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-mid text-white transition hover:bg-secondary hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <div className="mt-4 text-xs text-white/60">
            <p>📧 info@zproperty.pk</p>
            <p>📞 WhatsApp: +92-300-1234567</p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">Properties</h3>
          {PROPERTIES_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">Tools & Resources</h3>
          {TOOLS_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">Popular Cities</h3>
          {CITY_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">Company</h3>
          {COMPANY_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          ))}

          <h3 className="mb-2 mt-4 text-sm font-bold text-white">For Agents</h3>
          {AGENT_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-primary-mid">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 md:flex-row">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} ZProperty.pk — All rights reserved
          </p>
          <p className="text-xs text-white/60">Pakistan&apos;s trusted real estate marketplace</p>
          <div className="flex gap-4 text-xs text-secondary">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
