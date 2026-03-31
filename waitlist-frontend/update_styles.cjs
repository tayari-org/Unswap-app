const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Waitlist.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Make the image taller in portrait mode
content = content.replace('aspect-[4/3] lg:aspect-auto lg:h-[500px]', 'aspect-[3/4] lg:aspect-auto lg:h-[800px]');

// 2. Change text to gold
// Replace text-white with text-[#D4AF37] throughout for headings and labels
content = content.replace(/text-white/g, 'text-[#D4AF37]');
// Replace text-[#899BB1] (grayish) with a slightly muted gold or just gold for readability
content = content.replace(/text-\[#899BB1\]/g, 'text-[#D4AF37]');

// 3. Make fonts larger
// Replace text-sm with text-lg or text-xl
content = content.replace(/text-sm/g, 'text-xl');
// Change specific heading text sizes
content = content.replace(/text-3xl/g, 'text-5xl');
content = content.replace(/text-2xl sm:text-3xl lg:text-4xl/g, 'text-4xl sm:text-5xl lg:text-6xl');

// 4. Change button background to gold
content = content.replace(/bg-\[#3ABFF8\] hover:bg-\[#38b7ed\] text-\[#0A101C\]/g, 'bg-[#D4AF37] hover:bg-[#B5952F] text-black');
// Increase button padding & font size
content = content.replace(/py-3\.5 rounded-xl transition-all/g, 'py-5 px-6 rounded-xl transition-all text-2xl');
content = content.replace(/py-4 rounded-xl text-lg transition-all/g, 'py-5 px-6 rounded-xl text-2xl transition-all');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated Waitlist.jsx styles.');
