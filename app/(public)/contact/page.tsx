import type { Metadata } from "next";
import { Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/portal/ContactForm";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact SarZameenz.com — Get in Touch",
  description: "Get in touch with the SarZameenz.com team for support, partnerships, or general enquiries.",
};

const CONTACT_METHODS = [
  { Icon: Mail, title: "Email", detail: "support@sarzameenz.com" },
  { Icon: MessageCircle, title: "WhatsApp", detail: "+92 300 1234567" },
  { Icon: MapPin, title: "Head Office", detail: "Lahore, Pakistan" },
  { Icon: Clock, title: "Hours", detail: "Mon–Sat, 9am–6pm" },
];

export default function ContactUsPage() {
  return (
    <>
      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">Contact Us</h1>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2">
        <div className="rounded-xl border border-primary bg-white p-6">
          {CONTACT_METHODS.map(({ Icon, title, detail }) => (
            <div key={title} className="mb-5 flex items-start gap-3 last:mb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-black">{title}</p>
                <p className="text-sm text-primary-mid">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </>
  );
}
