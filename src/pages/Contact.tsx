import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Local shape of the placeholder contact form. */
interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

const INITIAL_STATE: ContactFormState = {
  name: "",
  email: "",
  message: "",
};

interface ContactDetail {
  label: string;
  value: string;
  Icon: typeof Mail;
}

const CONTACT_DETAILS: ContactDetail[] = [
  { label: "Email", value: "hello@rayze.app", Icon: Mail },
  { label: "Phone", value: "+1 (555) 012-3456", Icon: Phone },
  { label: "Office", value: "123 Community Ave, Suite 200", Icon: MapPin },
];

/**
 * Contact page. Renders a placeholder contact form (name, email, message)
 * with a no-op submit stub plus static contact details. Content-only, no
 * backend wiring in Module 1.
 */
export function Contact() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO (later module): Send the message via a backend endpoint / email
    // service. This is intentionally a no-op stub for now.
    // eslint-disable-next-line no-console
    console.info("Contact message (stub, not sent):", form);
  };

  return (
    <>
      <PageHeader
        title="Contact us"
        description="Questions, feedback, or partnership ideas? We'd love to hear from you."
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <MessageSquare className="h-4 w-4" />
            Get in touch
          </span>
        }
      />

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                />
              </div>

              <Button type="submit" size="lg">
                <Mail className="mr-2 h-5 w-5" />
                Send message
              </Button>
            </form>
          </div>

          {/* Static details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Reach us directly
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prefer another channel? Use the details below.
              </p>
            </div>

            <ul className="space-y-4">
              {CONTACT_DETAILS.map(({ label, value, Icon }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
