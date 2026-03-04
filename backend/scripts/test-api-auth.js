const jwt = require('jsonwebtoken');
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const userId = 'cmmak32s50000a29'; // The ID we found
const secret = process.env.JWT_SECRET;
const token = jwt.sign({ userId }, secret, { expiresIn: '1h' });

const userEmail = 'qasim@jacquelinetsuma.com';
const status = JSON.stringify({ "$in": ["pending", "approved"] });

const url = `http://localhost:3001/api/entities/Verification?user_email=${encodeURIComponent(userEmail)}&status=${encodeURIComponent(status)}`;

const options = {
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

http.get(url, options, (res) => {
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
