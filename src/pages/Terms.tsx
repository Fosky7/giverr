import { PageHeader } from "@/components/layout/PageHeader";
import { Separator } from "@/components/ui/separator";

interface TermsSection {
  heading: string;
  paragraphs: string[];
}

const LAST_UPDATED = "January 1, 2025";

const SECTIONS: TermsSection[] = [
  {
    heading: "1. Acceptance of Terms",
    paragraphs: [
      "By accessing or using Rayze (the \"Platform\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.",
    ],
  },
  {
    heading: "2. Eligibility",
    paragraphs: [
      "You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account, launch a campaign, or make a contribution on Rayze.",
    ],
  },
  {
    heading: "3. Accounts",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
      "You agree to provide accurate and complete information and to keep it up to date.",
    ],
  },
  {
    heading: "4. Campaigns",
    paragraphs: [
      "Campaign creators are solely responsible for the accuracy of their campaigns and for fulfilling any commitments made to backers.",
      "Rayze does not guarantee that any campaign will reach its funding goal or that funds raised will be used as described. We reserve the right to remove campaigns that violate these terms or applicable law.",
    ],
  },
  {
    heading: "5. Contributions",
    paragraphs: [
      "Contributions are made at your own risk. Backers should carefully review campaign details before contributing.",
      "Refund policies are determined by campaign type and applicable law. Rayze is not responsible for disputes between creators and backers.",
    ],
  },
  {
    heading: "6. Prohibited Conduct",
    paragraphs: [
      "You agree not to use the Platform for any unlawful purpose, to misrepresent a campaign, to infringe the rights of others, or to interfere with the operation of the Platform.",
    ],
  },
  {
    heading: "7. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Rayze shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.",
    ],
  },
  {
    heading: "8. Changes to These Terms",
    paragraphs: [
      "We may modify these Terms of Service at any time. Continued use of the Platform after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
];

/**
 * Terms of Service page. Content-only legal page referenced from the Footer.
 */
export function Terms() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <PageHeader
          title="Terms of Service"
          description={`Last updated: ${LAST_UPDATED}`}
        />

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
  );
}

export default Terms;
