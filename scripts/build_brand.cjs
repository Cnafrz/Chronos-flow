const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildBrand() {
  console.log("Installing sharp for image processing...");
  execSync("npm install sharp --no-save", { stdio: 'inherit' });
  const sharp = require('sharp');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#000000"/>
  <g transform="translate(512, 512)">
    <!-- C (Left Arc) -->
    <path d="M 150,-200 A 250,250 0 1,0 150,200" fill="none" stroke="#FFFFFF" stroke-width="120" stroke-linecap="round"/>
    <!-- F Top Bar -->
    <line x1="-150" y1="-200" x2="250" y2="-200" stroke="#FFFFFF" stroke-width="120" stroke-linecap="round"/>
    <!-- F Middle Bar -->
    <line x1="-250" y1="20" x2="100" y2="20" stroke="#FFFFFF" stroke-width="120" stroke-linecap="round"/>
  </g>
</svg>`;

  const transparentSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(512, 512)">
    <path d="M 150,-200 A 250,250 0 1,0 150,200" fill="none" stroke="#000000" stroke-width="120" stroke-linecap="round"/>
    <line x1="-150" y1="-200" x2="250" y2="-200" stroke="#000000" stroke-width="120" stroke-linecap="round"/>
    <line x1="-250" y1="20" x2="100" y2="20" stroke="#000000" stroke-width="120" stroke-linecap="round"/>
  </g>
</svg>`;

  // Create assets dir
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  if (!fs.existsSync('public')) fs.mkdirSync('public');
  if (!fs.existsSync('icons')) fs.mkdirSync('icons');
  if (!fs.existsSync('scripts')) fs.mkdirSync('scripts');

  // Save SVGs
  fs.writeFileSync('public/logo.svg', svgContent);
  fs.writeFileSync('public/logo-transparent.svg', transparentSvgContent);

  console.log("Generating 1024x1024 Icon PNGs...");
  
  // Base App Icon (Black background)
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon-only.png'); // Capacitor assets needs a square icon

  // App Icon for capacitor
  fs.copyFileSync('assets/icon-only.png', 'assets/icon.png');
  fs.copyFileSync('assets/icon-only.png', 'assets/splash.png'); // Splash screen fallback
  fs.copyFileSync('assets/icon-only.png', 'public/logo.png');
  fs.copyFileSync('assets/icon-only.png', 'icons/icon.png');
  
  // Also create logo.jpg in case it's hardcoded somewhere
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .jpeg()
    .toFile('public/logo.jpg');

  console.log("Running @capacitor/assets to generate Android assets...");
  try {
    execSync("npx @capacitor/assets generate --android", { stdio: 'inherit' });
  } catch(e) {
    console.error("Capacitor assets failed, but we have the base icon.", e.message);
  }

  console.log("Branding generation complete.");
}

buildBrand().catch(console.error);
