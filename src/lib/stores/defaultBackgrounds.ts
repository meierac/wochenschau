export interface DefaultBackground {
  id: string;
  name: string;
  url: string;
  description: string;
  category: "gradient" | "solid" | "nature";
}

export const DEFAULT_BACKGROUNDS: DefaultBackground[] = [
  {
    id: "gradient-1",
    name: "Gradient 1",
    url: `${import.meta.env.BASE_URL}backgrounds/Gradient_1.webp`,
    description: "Soft multi-tone gradient",
    category: "gradient",
  },
  {
    id: "gradient-2",
    name: "Gradient 2",
    url: `${import.meta.env.BASE_URL}backgrounds/Gradient_2.webp`,
    description: "Warm sunset gradient",
    category: "gradient",
  },
  {
    id: "gradient-3",
    name: "Gradient 3",
    url: `${import.meta.env.BASE_URL}backgrounds/Gradient_3.webp`,
    description: "Cool blue/purple gradient",
    category: "gradient",
  },
  {
    id: "gradient-4",
    name: "Gradient 4",
    url: `${import.meta.env.BASE_URL}backgrounds/Gradient_4.webp`,
    description: "Vibrant contrast gradient",
    category: "gradient",
  },
  {
    id: "gradient-5",
    name: "Gradient 5",
    url: `${import.meta.env.BASE_URL}backgrounds/Gradient_5.webp`,
    description: "Pastel airy gradient",
    category: "gradient",
  },
  {
    id: "gradient-6",
    name: "Gradient 6",
    url: `${import.meta.env.BASE_URL}backgrounds/Gradient_6.webp`,
    description: "Deep atmospheric gradient",
    category: "gradient",
  },
  {
    id: "nature-bergsee",
    name: "Bergsee",
    url: `${import.meta.env.BASE_URL}backgrounds/Bergsee.webp`,
    description: "Mountain lake scenery",
    category: "nature",
  },
  {
    id: "nature-mountain",
    name: "Mountain",
    url: `${import.meta.env.BASE_URL}backgrounds/Mountain.webp`,
    description: "Majestic mountain landscape",
    category: "nature",
  },
];

export function getBackgroundsByCategory(
  category: DefaultBackground["category"],
): DefaultBackground[] {
  return DEFAULT_BACKGROUNDS.filter((bg) => bg.category === category);
}

export function getBackgroundById(id: string): DefaultBackground | undefined {
  return DEFAULT_BACKGROUNDS.find((bg) => bg.id === id);
}

export function getAllCategories(): DefaultBackground["category"][] {
  const categories = new Set<DefaultBackground["category"]>();
  DEFAULT_BACKGROUNDS.forEach((bg) => categories.add(bg.category));
  return Array.from(categories);
}
