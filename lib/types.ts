export type SkillCategory = "Aquascape" | "Automotive" | "Product Video";

export type SkillProduct = {
  slug: string;
  name: string;
  eyebrow: string;
  shortDescription: string;
  description: string;
  price: number;
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
