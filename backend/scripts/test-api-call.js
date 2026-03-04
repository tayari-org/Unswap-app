const http = require('http');

const userEmail = 'qasim@jacquelinetsuma.com';
const status = JSON.stringify({ "$in": ["pending", "approved"] });

const url = `http://localhost:3001/api/entities/Verification?user_email=${encodeURIComponent(userEmail)}&status=${encodeURIComponent(status)}`;

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data);
        process.exit(0);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
