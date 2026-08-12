export type SkillCategory = string;

export type SkillProduct = {
  slug: string;
  name: string;
  eyebrow: string;
  shortDescription: string;
  description: string;
  priceUsdCents: number | null;
  isFree: boolean;
  lemonCheckoutUrl: string | null;
  category: SkillCategory;
  version: string;
  videoSrc: string;
  accent: string;
  accentSoft: string;
  featured?: boolean;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
};
