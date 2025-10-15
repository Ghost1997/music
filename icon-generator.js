// Icon Generator Script
// Run: node icon-generator.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = 'public/logo.png'; // Change this to your logo path
const outputDir = 'public/icons';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  console.log('\nPlease create a logo.png file in the public folder, or update the inputFile path in this script.');
  console.log('The logo should be a square PNG image (recommended: 1024x1024 or larger)');
  process.exit(1);
}

// Generate icons
console.log('Generating PWA icons...\n');

const generateIcon = async (size) => {
  try {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 139, g: 92, b: 246, alpha: 1 } // #8b5cf6
      })
      .toFile(outputFile);
    
    console.log(`✓ Generated ${size}x${size} icon`);
  } catch (error) {
    console.error(`✗ Failed to generate ${size}x${size} icon:`, error.message);
  }
};

// Generate all icons
Promise.all(sizes.map(generateIcon))
  .then(() => {
    console.log('\n✓ All icons generated successfully!');
    console.log(`\nIcons saved to: ${outputDir}/`);
    console.log('\nNext steps:');
    console.log('1. Copy manifest.json to public/');
    console.log('2. Copy service-worker.js to public/');
    console.log('3. Update your index.html');
    console.log('4. Run: npm run build');
  })
  .catch((error) => {
    console.error('\n✗ Error generating icons:', error);
  });

// Alternative: Generate a simple colored icon if no logo exists
async function generateFallbackIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
      <path d="M ${size * 0.35} ${size * 0.3} L ${size * 0.35} ${size * 0.7} L ${size * 0.65} ${size * 0.5} Z" 
            fill="white" stroke="white" stroke-width="${size * 0.02}"/>
    </svg>
  `;
  
  const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
  
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputFile);
}

// If you don't have a logo, uncomment this to generate simple icons
/*
console.log('Generating fallback icons...\n');
Promise.all(sizes.map(generateFallbackIcon))
  .then(() => console.log('\n✓ Fallback icons generated!'))
  .catch(error => console.error('Error:', error));
*/