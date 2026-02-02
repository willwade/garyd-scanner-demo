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

// Read book.html
let html = fs.readFileSync('book.html', 'utf-8');

// Find and log the /src/main.ts reference
const mainTsMatch = html.match(/<script[^>]*src="\/src\/main\.ts"[^>]*>/);
if (mainTsMatch) {
    console.log('Found /src/main.ts script tag');
} else {
    console.log('Warning: /src/main.ts not found in book.html');
}

// Replace /src/main.ts with the correct asset path
html = html.replace(
    /<script type="module" src="\/src\/main\.ts"><\/script>/,
    `<script type="module" src="./assets/${jsFile}"></script>`
);

// Add CSS link after the main script tag
html = html.replace(
    /(<script type="module" src="\.\/assets\/index-[^"]+"><\/script>)/,
    `$1\n    <link rel="stylesheet" crossorigin href="./assets/${cssFile}">`
);

console.log('✅ Fixed dist/book.html with correct asset paths');
console.log(`   Script: ./assets/${jsFile}`);
console.log(`   Styles: ./assets/${cssFile}`);

// Write to dist/book.html
fs.writeFileSync('dist/book.html', html);
