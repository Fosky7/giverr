import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContactForm } from "@/hooks/useContactForm";
import { Loader2 } from "lucide-react";
import { AlertCircle, Check, Send } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Contact page. Renders a fully functional contact form with:
 * - Client-side validation (name, email format, message length)
 * - Loading spinner on submit
 * - Inline server error alerts
 * - Success state: thank-you message with option to send another
 * - Form disabled during submission to prevent double-clicks
 *
 * Replaces the previous no-op stub with the `useContactForm` hook.
 */
export function Contact() {
  const {
    values,
    fieldErrors,
    serverError,
    submitting,
    success,
    handleChange,
    handleSubmit,
    reset,
  } = useContactForm();

  return (
    <>
      <div className="container mx-auto px-4">
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
      </div>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Check className="h-8 w-8" />
                </span>
                <h2 className="mt-6 text-xl font-semibold text-foreground">
                  Message sent!
                </h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  We&apos;ve received your message and will get back to you
                  shortly.
                </p>
                <Button
                  variant="outline"
                  className="mt-8"
                  onClick={reset}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Server error alert (from the stub / future API) */}
                {serverError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={values.name}
                      onChange={handleChange("name")}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.name)}
                      className={cn(fieldErrors.name && "border-destructive")}
                    />
                    {fieldErrors.name ? (
                      <p className="text-sm text-destructive">
                        {fieldErrors.name}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={values.email}
                      onChange={handleChange("email")}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className={cn(
                        fieldErrors.email && "border-destructive",
                      )}
                    />
                    {fieldErrors.email ? (
                      <p className="text-sm text-destructive">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    placeholder="How can we help?"
                    value={values.message}
                    onChange={handleChange("message")}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.message)}
                    className={cn(
                      fieldErrors.message && "border-destructive",
                    )}
                  />
                  {fieldErrors.message ? (
                    <p className="text-sm text-destructive">
                      {fieldErrors.message}
                    </p>
                  ) : null}
                </div>

                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            )}
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