#!/usr/bin/env node

/**
 * Font Download Helper Script
 *
 * This script helps download fonts from Google Fonts and convert them to WOFF2 format
 * for local hosting in the Wochenschau project.
 *
 * Usage:
 *   node scripts/download-fonts.js
 *
 * Requirements:
 *   - Node.js 16+
 *   - Internet connection
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Font configuration
const FONTS_TO_DOWNLOAD = [
  {
    name: 'Inter',
    folder: 'inter',
    weights: [300, 400, 500, 600, 700],
    type: 'sans-serif',
  },
  {
    name: 'Playfair Display',
    folder: 'playfair-display',
    weights: [400, 500, 600, 700],
    type: 'serif',
  },
  {
    name: 'Roboto',
    folder: 'roboto',
    weights: [300, 400, 500, 700],
    type: 'sans-serif',
  },
  {
    name: 'Montserrat',
    folder: 'montserrat',
    weights: [300, 400, 500, 600, 700],
    type: 'sans-serif',
  },
  {
    name: 'Lora',
    folder: 'lora',
    weights: [400, 500, 600, 700],
    type: 'serif',
  },
  {
    name: 'Dancing Script',
    folder: 'dancing-script',
    weights: [400, 500, 600, 700],
    type: 'cursive',
  },
  {
    name: 'Pacifico',
    folder: 'pacifico',
    weights: [400],
    type: 'cursive',
  },
  {
    name: 'Fira Code',
    folder: 'fira-code',
    weights: [300, 400, 500, 600, 700],
    type: 'monospace',
  },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fonts');

// Utility functions
function getWeightName(weight) {
  const names = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };
  return names[weight] || 'Regular';
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function getGoogleFontsCss(fontName, weights) {
  return new Promise((resolve, reject) => {
    // Construct Google Fonts API URL
    const family = fontName.replace(/\s+/g, '+');
    const weightsParam = weights.join(';');
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weightsParam}&display=swap`;

    https.get(url, {
      headers: {
        // User agent for modern browsers (gets WOFF2)
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

function extractFontUrlsFromCss(css) {
  const urlRegex = /url\((https:\/\/[^)]+\.woff2)\)/g;
  const urls = [];
  let match;

  while ((match = urlRegex.exec(css)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

async function downloadFont(fontConfig) {
  console.log(`\n📥 Downloading ${fontConfig.name}...`);

  const fontDir = path.join(OUTPUT_DIR, fontConfig.folder);
  ensureDirectoryExists(fontDir);

  try {
    // Get CSS from Google Fonts
    const css = await getGoogleFontsCss(fontConfig.name, fontConfig.weights);

    // Extract font URLs
    const fontUrls = extractFontUrlsFromCss(css);

    if (fontUrls.length === 0) {
      console.log(`⚠️  No font URLs found for ${fontConfig.name}`);
      return;
    }

    // Download each font file
    for (let i = 0; i < fontUrls.length && i < fontConfig.weights.length; i++) {
      const url = fontUrls[i];
      const weight = fontConfig.weights[i];
      const weightName = getWeightName(weight);
      const fileName = `${fontConfig.name.replace(/\s+/g, '')}-${weightName}.woff2`;
      const outputPath = path.join(fontDir, fileName);

      try {
        await downloadFile(url, outputPath);
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  ✓ ${fileName} (${sizeKB} KB)`);
      } catch (err) {
        console.log(`  ✗ ${fileName} - ${err.message}`);
      }
    }

    console.log(`✓ Completed ${fontConfig.name}`);
  } catch (err) {
    console.error(`✗ Failed to download ${fontConfig.name}:`, err.message);
  }
}

async function generateFontsCss() {
  console.log('\n📝 Generating fonts.css...');

  let cssContent = `/*
 * Local Fonts CSS
 *
 * Generated automatically by scripts/download-fonts.js
 * Do not edit manually - regenerate by running the script
 */\n\n`;

  for (const fontConfig of FONTS_TO_DOWNLOAD) {
    const fontDir = path.join(OUTPUT_DIR, fontConfig.folder);

    if (!fs.existsSync(fontDir)) {
      continue;
    }

    cssContent += `/* ${fontConfig.name} - ${fontConfig.type} */\n`;

    for (const weight of fontConfig.weights) {
      const weightName = getWeightName(weight);
      const fileName = `${fontConfig.name.replace(/\s+/g, '')}-${weightName}.woff2`;
      const filePath = path.join(fontDir, fileName);

      if (fs.existsSync(filePath)) {
        cssContent += `@font-face {\n`;
        cssContent += `  font-family: '${fontConfig.name}';\n`;
        cssContent += `  src: url('/fonts/${fontConfig.folder}/${fileName}') format('woff2');\n`;
        cssContent += `  font-weight: ${weight};\n`;
        cssContent += `  font-style: normal;\n`;
        cssContent += `  font-display: swap;\n`;
        cssContent += `}\n\n`;
      }
    }
  }

  const outputPath = path.join(__dirname, '..', 'src', 'assets', 'fonts.css');
  const assetsDir = path.dirname(outputPath);
  ensureDirectoryExists(assetsDir);

  fs.writeFileSync(outputPath, cssContent);
  console.log(`✓ Generated ${outputPath}`);
}

async function main() {
  console.log('🎨 Font Download Helper for Wochenschau\n');
  console.log('This script will download fonts from Google Fonts');
  console.log('and save them locally in WOFF2 format.\n');

  // Ensure output directory exists
  ensureDirectoryExists(OUTPUT_DIR);

  // Download all fonts
  for (const fontConfig of FONTS_TO_DOWNLOAD) {
    await downloadFont(fontConfig);
  }

  // Generate fonts.css
  await generateFontsCss();

  console.log('\n✅ All done!');
  console.log('\nNext steps:');
  console.log('1. Import fonts.css in your main.ts:');
  console.log("   import './assets/fonts.css';");
  console.log('2. Remove Google Fonts links from index.html');
  console.log('3. Update ExportSheet.svelte to use local fonts');
  console.log('\nSee FONTS_LOCAL_SETUP.md for detailed instructions.');
}

// Run the script
main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
