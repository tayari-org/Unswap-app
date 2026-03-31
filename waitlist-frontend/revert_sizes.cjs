const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Waitlist.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Reverse text-xl to text-sm
content = content.replace(/text-xl/g, 'text-sm');

// Reverse Check Status title
content = content.replace(/text-4xl sm:text-5xl lg:text-6xl/g, 'text-2xl sm:text-3xl lg:text-4xl');

// Reverse text-5xl to text-3xl
content = content.replace(/text-5xl/g, 'text-3xl');

// Reverse Button padding/size
content = content.replace(/py-5 px-6 rounded-xl transition-all text-2xl/g, 'py-3.5 rounded-xl transition-all');
content = content.replace(/py-5 px-6 rounded-xl text-2xl transition-all/g, 'py-4 rounded-xl text-lg transition-all');

// Ensure select padding isn't inadvertently stripped (though it didn't use text-2xl so it should be fine).
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully reverted Waitlist.jsx text sizes.');
