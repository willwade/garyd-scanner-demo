const fs = require('fs');
const path = require('path');

// Find the built asset files
const assets = fs.readdirSync('dist/assets');
const jsFile = assets.find(f => f.startsWith('index-') && f.endsWith('.js'));
const cssFile = assets.find(f => f.startsWith('index-') && f.endsWith('.css'));

if (!jsFile || !cssFile) {
    console.error('Could not find built assets!');
    process.exit(1);
}

console.log('Found assets:', { js: jsFile, css: cssFile });

// Copy switches folder to dist/
console.log('\n=== Copying switch images to dist/ ===');
try {
  const switchSource = 'public/switches';
  const switchDest = 'dist/switches';

  if (fs.existsSync(switchSource)) {
    // Create dist/switches directory
    fs.mkdirSync(switchDest, { recursive: true });

    // Copy all PNG files
    const files = fs.readdirSync(switchSource);
    const pngFiles = files.filter(f => f.endsWith('.png'));

    pngFiles.forEach(file => {
      fs.copyFileSync(
        path.join(switchSource, file),
        path.join(switchDest, file)
      );
      console.log(`✓ Copied ${file}`);
    });
    console.log(`✅ Copied ${pngFiles.length} switch images to dist/switches/`);
  } else {
    console.log('⚠️  Warning: public/switches not found, skipping');
  }
} catch (err) {
  console.error('Error copying switches:', err.message);
}

// Function to fix a book.html file
function fixBookHtml(inputPath, outputPath) {
    let html = fs.readFileSync(inputPath, 'utf-8');

    // Replace /src/main.ts with the correct asset path
    html = html.replace(
        /<script type="module" src="\/src\/main\.ts"><\/script>/,
        `<script type="module" src="./assets/${jsFile}"></script>`
    );

    // Add CSS link after the main script tag if not already present
    if (!html.includes(`href="./assets/${cssFile}"`)) {
        html = html.replace(
            /(<script type="module" src="\.\/assets\/index-[^"]+"><\/script>)/,
            `$1\n    <link rel="stylesheet" crossorigin href="./assets/${cssFile}">`
        );
    }

    fs.writeFileSync(outputPath, html);
}

// Fix only dist/book.html for production deployment
// Root book.html stays with /src/main.ts for development
console.log('\n=== Processing book.html for deployment ===\n');

console.log('Fixing dist/book.html for production...');
fixBookHtml('book.html', 'dist/book.html');

console.log('\n✅ Build complete!');
console.log(`   Script: ./assets/${jsFile}`);
console.log(`   Styles: ./assets/${cssFile}`);
console.log(`   Switches: dist/switches/*.png (${fs.readdirSync('dist/switches').length} files)`);
