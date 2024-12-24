import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const sizes = [16, 32, 48, 64, 96, 128, 256];
const iconTypes = ['normal', 'gray'];

async function generateIcon(size: number, isGray: boolean) {
  const borderRadius = Math.min(25, size * 0.25);
  const fontSize = size * 0.9;
  const yOffset = size * 0.82;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect 
      width="${size}" 
      height="${size}" 
      rx="${borderRadius}" 
      fill="${isGray ? '#64748B' : '#5B00CC'}"
    />
    <text
      x="${size/2}"
      y="${yOffset}"
      dominant-baseline="central"
      text-anchor="middle"
      font-family="Arial Black, sans-serif"
      font-size="${fontSize}"
      font-weight="900"
      fill="#FFFFFF"
      style="user-select: none"
    >R</text>
  </svg>`;

  const outputDir = path.resolve(process.cwd(), 'src', 'assets', 'icons');
  await fs.mkdir(outputDir, { recursive: true });

  const suffix = isGray ? '-gray' : '';
  const outputPath = path.join(outputDir, `icon-${size}${suffix}.png`);

  // 优化图片质量设置
  await sharp(Buffer.from(svg))
    .resize(size, size, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      position: 'center'
    })
    .png({
      quality: 100,
      compressionLevel: 9
    })
    .toFile(outputPath);

  // 保存SVG源文件
  if (size === 128 && !isGray) {
    const svgPath = path.join(outputDir, 'logo.svg');
    await fs.writeFile(svgPath, svg);
  }
}

async function main() {
  console.log('开始生成图标...');
  for (const size of sizes) {
    for (const type of iconTypes) {
      await generateIcon(size, type === 'gray');
      console.log(`已生成 ${size}x${size} ${type} 图标`);
    }
  }
  console.log('图标生成完成！');
}

main().catch(console.error); 