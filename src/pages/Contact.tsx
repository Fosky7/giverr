import { useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RetryState } from "@/components/feedback/RetryState";

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

// Async-style lifecycle for the submit stub. Structured so wiring a real
// endpoint later only means replacing the body of `sendMessage`.
type SendStatus = "idle" | "sending" | "sent" | "error";

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
 * Contact page. Renders a contact form (name, email, message) with an
 * async-style submit stub that surfaces sending / sent / error feedback. On a
 * (future) send failure it shows an inline <RetryState> so the user can retry
 * without losing their input. Backend wiring is intentionally a no-op for now.
 */
export function Contact() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Placeholder "send" operation. Currently a no-op that resolves, structured
   * so a real endpoint (edge function / email service) drops straight in here.
   */
  const sendMessage = async (payload: ContactFormState): Promise<void> => {
    // TODO (later module): POST to a backend endpoint / email service.
    // eslint-disable-next-line no-console
    console.info("Contact message (stub, not sent):", payload);
    // Simulate an async round-trip without any real network call.
    await new Promise((resolve) => setTimeout(resolve, 400));
  };

  const submit = async () => {
    // Guard against overlapping submits leaving the button stuck.
    if (status === "sending") return;

    setStatus("sending");
    setErrorMessage(null);

    try {
      await sendMessage(form);
      setStatus("sent");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "We couldn't send your message. Please try again."
      );
      setStatus("error");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const resetForm = () => {
    setForm(INITIAL_STATE);
    setStatus("idle");
    setErrorMessage(null);
  };

  const isSending = status === "sending";

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
          {/* Form / status */}
          <div className="lg:col-span-2">
            {status === "sent" ? (
              <div className="space-y-6">
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-4 text-sm text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>
                    Thanks for reaching out! Your message has been received and
                    we'll get back to you soon.
                  </span>
                </div>
                <Button variant="outline" onClick={resetForm}>
                  Send another message
                </Button>
              </div>
            ) : status === "error" ? (
              <RetryState
                className="mx-0 max-w-none items-start text-left"
                title="Message not sent"
                description={errorMessage}
                onRetry={submit}
                retrying={isSending}
              />
            ) : (
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
                      disabled={isSending}
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
                      disabled={isSending}
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
                    disabled={isSending}
                  />
                </div>

                <Button type="submit" size="lg" disabled={isSending}>
                  {isSending ? (
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
