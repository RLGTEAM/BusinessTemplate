/**
 * Regenerates the placeholder images referenced by the demo business.json:
 * src/assets/images/*.png and public/og-default.png.
 *
 * Uses sharp, which ships with Astro. Run with: npx tsx scripts/generate-placeholders.ts
 * Replace these files with real client photos in production — keep the filenames
 * or update business.json accordingly.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));

function placeholderSvg(width: number, height: number, from: string, to: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}"/>
          <stop offset="1" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <circle cx="${width * 0.75}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.25}" fill="#ffffff" opacity="0.12"/>
      <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${Math.min(width, height) * 0.35}" fill="#000000" opacity="0.08"/>
    </svg>`,
  );
}

const palette = {
  primary: "#7c5cbf",
  secondary: "#2b2140",
  accent: "#e8b04b",
};

interface Spec {
  path: string;
  width: number;
  height: number;
  from: string;
  to: string;
}

const specs: Spec[] = [
  {
    path: "src/assets/images/hero.png",
    width: 1200,
    height: 900,
    from: palette.primary,
    to: palette.secondary,
  },
  {
    path: "src/assets/images/about.png",
    width: 1000,
    height: 750,
    from: palette.secondary,
    to: palette.primary,
  },
  {
    path: "public/og-default.png",
    width: 1200,
    height: 630,
    from: palette.primary,
    to: palette.secondary,
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    path: `src/assets/images/gallery-${i + 1}.png`,
    width: 800,
    height: 800,
    from: i % 2 === 0 ? palette.primary : palette.accent,
    to: palette.secondary,
  })),
];

for (const spec of specs) {
  const target = join(root, spec.path);
  mkdirSync(dirname(target), { recursive: true });
  const svg = placeholderSvg(spec.width, spec.height, spec.from, spec.to);
  await sharp(svg).png({ compressionLevel: 9 }).toFile(target);
  console.log(`✓ ${spec.path}`);
}
