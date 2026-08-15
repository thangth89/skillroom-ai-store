export type SkillCategory = string;

export type SkillProduct = {
  slug: string;
  name: string;
  eyebrow: string;
  shortDescription: string;
  description: string;
  priceVnd: number;
  priceUsdCents: number | null;
  discountPercent: number;
  isFree: boolean;
  internationalCheckoutUrl: string | null;
  category: SkillCategory;
  version: string;
  videoSrc: string;
  tutorialVideoSrc?: string | null;
  accent: string;
  accentSoft: string;
  featured?: boolean;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
};
