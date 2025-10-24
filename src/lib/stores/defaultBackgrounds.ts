export interface DefaultBackground {
  id: string;
  name: string;
  url: string;
  description: string;
  category: "gradient" | "solid" | "nature";
}

export const DEFAULT_BACKGROUNDS: DefaultBackground[] = [
  {
    id: "gradient-navy-vignette",
    name: "Navy Blue Vignette",
    url: `${import.meta.env.BASE_URL}backgrounds/navy-blue-with-a-vignette-color-background-y1st36rfjpha19vo.jpg`,
    description: "Deep navy blue with elegant vignette effect",
    category: "gradient",
  },
  {
    id: "gradient-color-1",
    name: "Soft Color Gradient",
    url: `${import.meta.env.BASE_URL}backgrounds/color-background-5feqyvu7kgtmpk0d.jpg`,
    description: "Soft pastel color gradient",
    category: "gradient",
  },
  {
    id: "gradient-color-2",
    name: "Warm Gradient",
    url: `${import.meta.env.BASE_URL}backgrounds/color-background-5i5xkrdqeiq9xmzo.jpg`,
    description: "Warm color gradient for a cozy feel",
    category: "gradient",
  },
  {
    id: "nature-lotus",
    name: "Serene Lotus",
    url: `${import.meta.env.BASE_URL}backgrounds/serene-pink-lotus-flower-emerging-from-water-amidst-rocks-p683sc3bf9ym5jsw.jpg`,
    description: "Serene pink lotus flower emerging from water",
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
