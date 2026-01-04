const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Create a beautiful app icon with gradient and photo/calendar theme
async function generateIcon() {
  const size = 1024;

  // Create SVG with gradient background and icon
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${size}" height="${size}" rx="200" fill="url(#bg)"/>

      <!-- Photo frame (white) -->
      <rect x="200" y="180" width="624" height="500" rx="40" fill="white" opacity="0.95"/>

      <!-- Photo placeholder (gradient) -->
      <rect x="240" y="220" width="544" height="340" rx="20" fill="url(#accent)" opacity="0.8"/>

      <!-- Mountain silhouette in photo -->
      <polygon points="240,560 400,400 500,480 650,350 784,560" fill="white" opacity="0.3"/>

      <!-- Sun in photo -->
      <circle cx="680" cy="300" r="50" fill="white" opacity="0.4"/>

      <!-- Calendar dots at bottom -->
      <circle cx="340" cy="620" r="25" fill="white" opacity="0.9"/>
      <circle cx="440" cy="620" r="25" fill="white" opacity="0.9"/>
      <circle cx="540" cy="620" r="25" fill="white" opacity="0.9"/>
      <circle cx="640" cy="620" r="25" fill="white" opacity="0.9"/>

      <!-- Timeline line -->
      <line x1="200" y1="780" x2="824" y2="780" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.6"/>

      <!-- Timeline dots -->
      <circle cx="280" cy="780" r="20" fill="white" opacity="0.9"/>
      <circle cx="450" cy="780" r="20" fill="white" opacity="0.9"/>
      <circle cx="620" cy="780" r="20" fill="white" opacity="0.9"/>
      <circle cx="744" cy="780" r="20" fill="white" opacity="0.9"/>
    </svg>
  `;

  // Generate main icon (1024x1024)
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  console.log('Created icon.png (1024x1024)');

  // Generate adaptive icon (same as icon)
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));

  console.log('Created adaptive-icon.png');

  // Generate favicon (48x48)
  await sharp(Buffer.from(svg))
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));

  console.log('Created favicon.png (48x48)');
}

// Create splash screen icon
async function generateSplashIcon() {
  const size = 512;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="splash" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Photo frame -->
      <rect x="80" y="60" width="352" height="300" rx="30" fill="url(#splash)"/>

      <!-- Inner photo area -->
      <rect x="110" y="90" width="292" height="200" rx="15" fill="white" opacity="0.2"/>

      <!-- Mountain -->
      <polygon points="110,290 200,180 270,230 370,140 402,290" fill="white" opacity="0.3"/>

      <!-- Sun -->
      <circle cx="350" cy="140" r="30" fill="white" opacity="0.4"/>

      <!-- Calendar dots -->
      <circle cx="160" cy="330" r="15" fill="white" opacity="0.8"/>
      <circle cx="220" cy="330" r="15" fill="white" opacity="0.8"/>
      <circle cx="280" cy="330" r="15" fill="white" opacity="0.8"/>
      <circle cx="340" cy="330" r="15" fill="white" opacity="0.8"/>

      <!-- Timeline -->
      <line x1="100" y1="420" x2="412" y2="420" stroke="url(#splash)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="140" cy="420" r="12" fill="url(#splash)"/>
      <circle cx="230" cy="420" r="12" fill="url(#splash)"/>
      <circle cx="320" cy="420" r="12" fill="url(#splash)"/>
      <circle cx="372" cy="420" r="12" fill="url(#splash)"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));

  console.log('Created splash-icon.png (512x512)');
}

async function main() {
  console.log('Generating app icons...\n');

  await generateIcon();
  await generateSplashIcon();

  console.log('\nAll icons generated successfully!');
}

main().catch(console.error);
