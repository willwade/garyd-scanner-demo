const fs = require('fs');

// Find the built asset files
const assets = fs.readdirSync('dist/assets');
const jsFile = assets.find(f => f.startsWith('index-') && f.endsWith('.js'));
const cssFile = assets.find(f => f.startsWith('index-') && f.endsWith('.css'));

if (!jsFile || !cssFile) {
    console.error('Could not find built assets!');
    process.exit(1);
}

console.log('Found assets:', { js: jsFile, css: cssFile });

// Function to fix a book.html file
function fixBookHtml(inputPath, outputPath) {
    let html = fs.readFileSync(inputPath, 'utf-8');
    const originalLength = html.length;

    // Find and log the /src/main.ts reference
    const mainTsMatch = html.match(/<script[^>]*src="\/src\/main\.ts"[^>]*>/);
    if (mainTsMatch) {
        console.log(`✓ Found /src/main.ts in ${inputPath}`);
    } else {
        console.log(`✓ No /src/main.ts found in ${inputPath} (already fixed?)`);
    }

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

    const wasModified = html.length !== originalLength;
    fs.writeFileSync(outputPath, html);
    return wasModified;
}

// Fix both the root book.html and dist/book.html
console.log('\n=== Processing book.html files ===\n');

// Fix root book.html (for direct access)
console.log('1. Fixing root book.html...');
fixBookHtml('book.html', 'book.html');

// Fix dist/book.html (for dist deployment)
console.log('2. Fixing dist/book.html...');
fixBookHtml('book.html', 'dist/book.html');

console.log('\n✅ Fixed both book.html files with correct asset paths');
console.log(`   Script: ./assets/${jsFile}`);
console.log(`   Styles: ./assets/${cssFile}`);
