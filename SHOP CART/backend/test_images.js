const fs = require('fs');
const https = require('https');

const dbContent = fs.readFileSync('database.js', 'utf8');
const urls = [...new Set(dbContent.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g))];

console.log(`Found ${urls.length} unique Unsplash URLs. Testing them...`);

async function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ url, ok: true, status: res.statusCode });
            } else {
                resolve({ url, ok: false, status: res.statusCode });
            }
        }).on('error', (e) => {
            resolve({ url, ok: false, status: e.message });
        });
    });
}

async function run() {
    const results = await Promise.all(urls.map(url => checkUrl(url)));
    const broken = results.filter(r => !r.ok);
    console.log('\n--- BROKEN URLs ---');
    broken.forEach(b => console.log(`${b.status}: ${b.url}`));
    console.log('\n--- WORKING URLs ---');
    results.filter(r => r.ok).slice(0, 5).forEach(b => console.log(`${b.status}: ${b.url}`));
    console.log(`\nTotal Broken: ${broken.length}`);
}

run();
