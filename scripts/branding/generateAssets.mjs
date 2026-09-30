import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const svg = readFileSync('resources/agent-club.svg');
const targets = {
  'resources/app.png': 1024,
  'resources/app_dev.png': 1024,
  'resources/icon.png': 512,
  'resources/aionui_logo_no_border.png': 512,
  'packages/desktop/src/renderer/assets/logos/brand/app.png': 512,
  'public/pwa/icon-512.png': 512,
  'public/pwa/icon-192.png': 192,
  'public/pwa/icon-180.png': 180,
  'mobile/assets/images/icon.png': 1024,
};
for (const [file, size] of Object.entries(targets)) await sharp(svg).resize(size, size).png().toFile(file);
writeFileSync('packages/desktop/src/renderer/assets/logo.svg', svg);
writeFileSync('resources/aionui_logo_black_bg.svg', svg);
const png = await sharp(svg).resize(256, 256).png().toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
writeFileSync('resources/app.ico', Buffer.concat([ico, png]));
if (process.platform === 'darwin') {
  const iconset = 'out/agent-club.iconset';
  mkdirSync(iconset, { recursive: true });
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      await sharp(svg)
        .resize(size * scale, size * scale)
        .png()
        .toFile(`${iconset}/icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`);
    }
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', 'resources/app.icns']);
}
