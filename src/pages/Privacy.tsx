import { PageHeader } from "@/components/layout/PageHeader";
import { Separator } from "@/components/ui/separator";

interface PolicySection {
  heading: string;
  paragraphs: string[];
}

const LAST_UPDATED = "January 1, 2025";

const SECTIONS: PolicySection[] = [
  {
    heading: "1. Introduction",
    paragraphs: [
      "Rayze (\"we\", \"us\", or \"our\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our crowdfunding platform.",
      "By using Rayze, you agree to the collection and use of information in accordance with this policy.",
    ],
  },
  {
    heading: "2. Information We Collect",
    paragraphs: [
      "We collect information you provide directly, such as your name, email address, and campaign details when you create an account or launch a campaign.",
      "We also collect certain information automatically, including usage data, device information, and cookies to improve your experience on the platform.",
    ],
  },
  {
    heading: "3. How We Use Your Information",
    paragraphs: [
      "We use your information to operate and maintain the platform, process contributions, communicate with you about campaigns, and comply with legal obligations.",
      "We may also use aggregated, anonymized data to understand how the platform is used and to improve our services.",
    ],
  },
  {
    heading: "4. Sharing Your Information",
    paragraphs: [
      "We do not sell your personal information. We may share information with trusted service providers who help us operate the platform, and only to the extent necessary to provide those services.",
      "We may disclose information where required by law or to protect the rights, property, or safety of Rayze, our users, or others.",
    ],
  },
  {
    heading: "5. Data Security",
    paragraphs: [
      "We implement reasonable technical and organizational measures to protect your information. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "6. Your Rights",
    paragraphs: [
      "Depending on your location, you may have the right to access, correct, or delete your personal information. To exercise these rights, please contact us using the details on our Contact page.",
    ],
  },
  {
    heading: "7. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.",
    ],
  },
];

/**
 * Privacy Policy page. Content-only legal page referenced from the Footer.
 */
export function Privacy() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description={`Last updated: ${LAST_UPDATED}`}
      />

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          {SECTIONS.map((section, index) => (
            <div key={section.heading} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {index < SECTIONS.length - 1 ? (
                <Separator className="mt-8" />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Privacy;
