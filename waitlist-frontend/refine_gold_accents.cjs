const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Waitlist.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Revert ALL text-[#D4AF37] to text-white. 
// This clears the overwhelming gold text (inputs, paragraphs, little links, etc.)
content = content.replace(/text-\[#D4AF37\]/g, 'text-white');

// 2. Change specific paragraph/description elements to text-[#899BB1] (grayish-blue)
// This creates a sleek contrast against #0B101E without being pure white everywhere.
content = content.replace(/<p className="text-white text-sm mb-8 leading-relaxed">/g, '<p className="text-[#899BB1] text-sm mb-8 leading-relaxed">');
content = content.replace(/<p className="text-sm text-white">Be the first/g, '<p className="text-sm text-[#899BB1]">Be the first');
content = content.replace(/<p className="text-white mb-1">We sent a/g, '<p className="text-[#899BB1] mb-1">We sent a');
content = content.replace(/<p className="text-white text-sm mb-8">Click the link/g, '<p className="text-[#899BB1] text-sm mb-8">Click the link');
content = content.replace(/<p className="text-white mb-8 leading-relaxed">/g, '<p className="text-[#899BB1] mb-8 leading-relaxed">');

// 3. Change asterisks back to gold (from text-yellow-500)
content = content.replace(/text-yellow-500/g, 'text-[#D4AF37]');

// 4. Change main headers to gold to act as accents
content = content.replace(/<h2 className="text-3xl font-bold text-white mb-2">Check your inbox<\/h2>/g, '<h2 className="text-3xl font-bold text-[#D4AF37] mb-2">Check your inbox</h2>');
content = content.replace(/<h2 className="text-3xl font-bold text-white mb-2">Unable to connect<\/h2>/g, '<h2 className="text-3xl font-bold text-[#D4AF37] mb-2">Unable to connect</h2>');
content = content.replace(/<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 tracking-tight whitespace-nowrap">Check your waitlist status<\/h1>/g, '<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-8 tracking-tight whitespace-nowrap">Check your waitlist status</h1>');

// 5. Check error message color (was red-400 originally, became white in step 1 if the script touched it)
content = content.replace(/<motion\.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-white text-sm mt-6 mb-2">/g, '<motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-6 mb-2">');

// 6. Fix the "Back to waitlist" links
content = content.replace(/className="mt-4 text-white hover:text-white text-sm transition-colors"/g, 'className="mt-4 text-[#899BB1] hover:text-white text-sm transition-colors"');
content = content.replace(/className="mt-6 text-white hover:text-white text-sm transition-colors flex items-center"/g, 'className="mt-6 text-[#899BB1] hover:text-white text-sm transition-colors flex items-center"');
content = content.replace(/className="absolute -top-12 -left-4 sm:-left-12 text-white hover:text-white transition-colors flex items-center gap-2 text-sm"/g, 'className="absolute -top-12 -left-4 sm:-left-12 text-[#899BB1] hover:text-white transition-colors flex items-center gap-2 text-sm"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully adjusted color accents to be more luxurious and less overwhelming.');
