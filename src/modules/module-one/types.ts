export interface NavItem {
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface CtaLink {
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface HeroContent {
  label: string;
  title: string;
  description: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  socialProof: string;
  visualLabel: string;
  ariaLabel?: string;
}

export interface CampaignPreview {
  label: string;
  title: string;
  description: string;
  category: string;
  beneficiaryType: string;
  status: string;
  goal: number;
  raised: number;
  donors: number;
  daysLeft: number;
  organizer: string;
  location: string;
  href: string;
  visualLabel: string;
  ariaLabel?: string;
}

export interface StatItem {
  label: string;
  value: string;
  description: string;
  iconName?: string;
}

export interface FeatureItem {
  label: string;
  title: string;
  description: string;
  visualLabel: string;
  points: string[];
  ariaLabel?: string;
}

export interface ProcessStep {
  label: string;
  title: string;
  description: string;
  ariaLabel?: string;
}

export interface TrustItem {
  label: string;
  title: string;
  description: string;
  visualLabel: string;
  ariaLabel?: string;
}

export interface FooterLink {
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface FooterGroup {
  title: string;
  links: FooterLink[];
}

export interface FinalCtaContent {
  title: string;
  description: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
}

export interface ModuleOneContent {
  brandName: string;
  navItems: NavItem[];
  hero: HeroContent;
  featuredCampaign: CampaignPreview;
  stats: StatItem[];
  features: FeatureItem[];
  processSteps: ProcessStep[];
  trustItems: TrustItem[];
  finalCta: FinalCtaContent;
  footerDescription: string;
  footerGroups: FooterGroup[];
}
