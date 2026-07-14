import type { ModuleOneContent } from "./types";

export const moduleOneContent = {
  brandName: "Giverr",
  navItems: [
    {
      label: "How it works",
      href: "#how-it-works",
      ariaLabel: "Jump to how Giverr works",
    },
    {
      label: "For NGOs",
      href: "#for-ngos",
      ariaLabel: "Jump to Giverr tools for NGOs",
    },
    {
      label: "Trust",
      href: "#trust",
      ariaLabel: "Jump to Giverr trust and transparency information",
    },
    {
      label: "Explore campaigns",
      href: "#campaign-management",
      ariaLabel: "Open Giverr campaign management and campaign directory",
    },
  ],
  hero: {
    label: "Fundraising made clear, fast, and trusted",
    title: "Create campaigns and raise funds from the public efficiently.",
    description:
      "Giverr helps individuals, community groups, and NGOs launch credible fundraising campaigns, share urgent needs, and turn public support into measurable impact.",
    primaryCta: {
      label: "Start a campaign",
      href: "#campaign-management",
      ariaLabel: "Start a fundraising campaign in Giverr campaign management",
    },
    secondaryCta: {
      label: "Explore campaigns",
      href: "#campaign-management",
      ariaLabel: "Explore fundraising campaigns in Giverr campaign management",
    },
    socialProof: "Built for transparent giving, verified stories, and community-led support.",
    visualLabel: "Live campaign dashboard preview",
    ariaLabel: "Giverr landing page introduction",
  },
  featuredCampaign: {
    label: "Featured campaign",
    title: "Emergency learning kits for displaced children",
    description:
      "Help a local NGO deliver school supplies, digital learning materials, and safe classroom support to children affected by displacement.",
    category: "Education relief",
    beneficiaryType: "NGO campaign",
    status: "Verified",
    goal: 50000,
    raised: 34800,
    donors: 612,
    daysLeft: 18,
    organizer: "BrightStart Aid Network",
    location: "Accra, Ghana",
    href: "#campaign-management",
    visualLabel: "Education relief campaign preview",
    ariaLabel: "View featured education relief campaign in campaign management",
  },
  stats: [
    {
      label: "Campaigns launched",
      value: "2,400+",
      description: "Community, medical, education, and NGO campaigns supported.",
      iconName: "campaigns",
    },
    {
      label: "Funds mobilized",
      value: "$8.6M+",
      description: "Raised through transparent public giving experiences.",
      iconName: "funds",
    },
    {
      label: "Donor confidence",
      value: "96%",
      description: "Donors say clear updates help them give with confidence.",
      iconName: "trust",
    },
  ],
  features: [
    {
      label: "Launch quickly",
      title: "Campaign pages that are ready to share",
      description:
        "Create a compelling fundraiser with goals, story details, donation prompts, and progress signals designed to motivate action.",
      visualLabel: "01",
      points: ["Guided campaign setup", "Mobile-ready public pages"],
      ariaLabel: "Launch fundraising campaigns quickly",
    },
    {
      label: "Built for NGOs",
      title: "Tools for teams, programs, and impact reporting",
      description:
        "Organize fundraising around causes, publish updates, and show supporters exactly how their donations move your mission forward.",
      visualLabel: "02",
      points: ["Organization-friendly profiles", "Program and cause storytelling"],
      ariaLabel: "Fundraising tools designed for NGOs",
    },
    {
      label: "Grow reach",
      title: "Turn supporters into campaign advocates",
      description:
        "Use simple sharing paths and donor-friendly campaign previews to help every supporter amplify your fundraiser.",
      visualLabel: "03",
      points: ["Shareable campaign links", "Clear donor calls to action"],
      ariaLabel: "Grow public fundraising reach",
    },
    {
      label: "Keep donors informed",
      title: "Public updates that build trust",
      description:
        "Post progress notes, milestones, and impact updates so donors understand the outcome of their support.",
      visualLabel: "04",
      points: ["Milestone updates", "Transparent progress tracking"],
      ariaLabel: "Keep Giverr donors informed with public campaign updates",
    },
  ],
  processSteps: [
    {
      label: "Step 01",
      title: "Create your profile",
      description:
        "Set up as an individual, community group, or NGO so supporters know who is behind the campaign.",
      ariaLabel: "Create your Giverr profile",
    },
    {
      label: "Step 02",
      title: "Tell your story",
      description:
        "Add the beneficiary, funding goal, timeline, evidence, and campaign visuals donors need before giving.",
      ariaLabel: "Tell your fundraising story",
    },
    {
      label: "Step 03",
      title: "Share the campaign",
      description:
        "Publish a campaign link that is easy to share across communities, social channels, and donor networks.",
      ariaLabel: "Share a Giverr campaign with the public",
    },
    {
      label: "Step 04",
      title: "Receive donations",
      description:
        "Give donors a straightforward contribution journey designed for clarity and confidence.",
      ariaLabel: "Receive donations through your campaign",
    },
    {
      label: "Step 05",
      title: "Update supporters",
      description:
        "Post progress notes, milestones, and impact updates so donors can follow the outcome of their giving.",
      ariaLabel: "Update campaign supporters",
    },
  ],
  trustItems: [
    {
      label: "Verification",
      title: "Clear campaign information",
      description:
        "Campaign pages are structured to highlight who is raising funds, what the goal is, and how support will be used.",
      visualLabel: "Verified context",
      ariaLabel: "Clear fundraising campaign information",
    },
    {
      label: "Transparency",
      title: "Goals, raised amounts, and donor signals",
      description:
        "Visible progress indicators help supporters understand campaign momentum before they contribute.",
      visualLabel: "Progress clarity",
      ariaLabel: "Transparent campaign progress indicators",
    },
    {
      label: "Secure readiness",
      title: "Designed for safe donation flows",
      description:
        "The landing experience is ready for secure checkout integration with clear contribution expectations and receipt records.",
      visualLabel: "Payment confidence",
      ariaLabel: "Secure donation flow readiness",
    },
    {
      label: "Updates",
      title: "Public accountability after donations",
      description:
        "Creators can keep trust high by sharing milestones, impact notes, and status changes after funds are received.",
      visualLabel: "Impact updates",
      ariaLabel: "Public campaign updates for accountability",
    },
  ],
  finalCta: {
    title: "Ready to turn compassion into measurable support?",
    description:
      "Start with a campaign page that looks credible, shares beautifully, and gives donors the clarity they need to act.",
    primaryCta: {
      label: "Create your first campaign",
      href: "#campaign-management",
      ariaLabel: "Create your first Giverr campaign in campaign management",
    },
    secondaryCta: {
      label: "Partner as an NGO",
      href: "#for-ngos",
      ariaLabel: "Learn how NGOs can partner with Giverr",
    },
  },
  footerDescription:
    "Helping individuals and NGOs create trusted fundraising campaigns and move communities to action.",
  footerGroups: [
    {
      title: "Platform",
      links: [
        {
          label: "Start a campaign",
          href: "#campaign-management",
          ariaLabel: "Start a campaign in Giverr campaign management",
        },
        {
          label: "Explore campaigns",
          href: "#campaign-management",
          ariaLabel: "Explore campaigns in Giverr campaign management",
        },
        {
          label: "How it works",
          href: "#how-it-works",
          ariaLabel: "Learn how Giverr works",
        },
      ],
    },
    {
      title: "For fundraisers",
      links: [
        {
          label: "For individuals",
          href: "#campaign-management",
          ariaLabel: "Start individual fundraising in Giverr campaign management",
        },
        {
          label: "For NGOs",
          href: "#for-ngos",
          ariaLabel: "Learn about NGO fundraising on Giverr",
        },
        {
          label: "Trust and safety",
          href: "#trust",
          ariaLabel: "Learn about Giverr trust and safety",
        },
      ],
    },
    {
      title: "Company",
      links: [
        {
          label: "About Giverr",
          href: "#top",
          ariaLabel: "Learn about Giverr",
        },
        {
          label: "Contact",
          href: "#campaign-management",
          ariaLabel: "Contact Giverr through campaign management",
        },
        {
          label: "Privacy",
          href: "#top",
          ariaLabel: "Read Giverr privacy information",
        },
      ],
    },
  ],
} satisfies ModuleOneContent;
