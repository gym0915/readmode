import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const sizes = [16, 32, 48, 128];
const iconTypes = ['normal', 'gray'];

async function generateIcon(size: number, isGray: boolean) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${isGray ? '#9CA3AF' : '#3B82F6'}"/>
        <stop offset="100%" style="stop-color:${isGray ? '#6B7280' : '#9333EA'}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="white"/>
    <g transform="scale(0.8) translate(2.4 2.4)">
      <path 
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        stroke="url(#gradient)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>`;

  const outputDir = path.resolve(process.cwd(), 'src', 'assets', 'icons');
  await fs.mkdir(outputDir, { recursive: true });

  const suffix = isGray ? '-gray' : '';
  const outputPath = path.join(outputDir, `icon-${size}${suffix}.png`);

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);

  // 同时保存一份SVG文件
  if (size === 24 && !isGray) {
    const svgPath = path.join(outputDir, 'logo.svg');
    await fs.writeFile(svgPath, svg);
  }
}

async function main() {
  for (const size of sizes) {
    for (const type of iconTypes) {
      await generateIcon(size, type === 'gray');
    }
  }
}

main().catch(console.error); 