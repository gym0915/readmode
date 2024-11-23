import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const sizes = [16, 32];
const iconTypes = ['normal', 'gray'];

async function generateIcon(size: number, isGray: boolean) {
  const fontSize = Math.floor(size * 0.6);
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="white" rx="${size * 0.15}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${isGray ? '#9CA3AF' : '#2563EB'}"
        text-anchor="middle"
        dominant-baseline="central"
      >R</text>
    </svg>
  `;

  const outputDir = path.resolve(process.cwd(), 'src', 'assets', 'icons');
  await fs.mkdir(outputDir, { recursive: true });

  const suffix = isGray ? '-gray' : '';
  const outputPath = path.join(outputDir, `icon-${size}${suffix}.png`);

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function main() {
  for (const size of sizes) {
    for (const type of iconTypes) {
      await generateIcon(size, type === 'gray');
    }
  }
}

main().catch(console.error); 