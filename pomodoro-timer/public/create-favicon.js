const { createCanvas } = require('canvas');
const fs = require('fs');
const { execSync } = require('child_process');

// Create a canvas for the favicon
const size = 64;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Set background color (optional - for better visibility)
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, size, size);

// Draw the tomato emoji
ctx.font = `${size * 0.8}px Arial`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🍅', size / 2, size / 2);

// Save as PNG first
const pngBuffer = canvas.toBuffer('image/png');
fs.writeFileSync('tomato-favicon.png', pngBuffer);

console.log('PNG favicon created successfully!');

// Convert PNG to ICO using ImageMagick (if available)
try {
    execSync('convert tomato-favicon.png -define icon:auto-resize=16,32,48,64 favicon.ico');
    console.log('ICO favicon created successfully!');
} catch (error) {
    console.error('Error converting to ICO format. Make sure ImageMagick is installed.');
    console.log('You can manually convert the PNG to ICO using an online converter.');
}
