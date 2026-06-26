const https = require('https');

const candidateUrls = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', // Refrigerator 1
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf', // Refrigerator 2
    'https://images.unsplash.com/photo-1593113616828-6f22bca04804', // Football 1
    'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7', // Sports/Badminton
    'https://images.unsplash.com/photo-1550985616-10810253b84d', // Generic working ID from database (Bulb)
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2'  // Generic working ID from database (Cushion)
];

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
    const results = await Promise.all(candidateUrls.map(url => checkUrl(url)));
    results.forEach(b => console.log(`${b.status}: ${b.url}`));
}

run();
