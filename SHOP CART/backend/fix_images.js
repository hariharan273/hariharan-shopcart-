const fs = require('fs');
const path = require('path');

const replacements = {
    '1511707171634-5f897ff02ff9': '1598327105666-5b89351aff97', // OnePlus/Realme -> Pixel 8
    '1496181130204-7552cc145cd6': '1588872657578-7efd1f1555ed', // ASUS Laptop -> Lenovo Laptop
    '1592840062788-ac498511739f': '1615663245857-ac93bb7c39e7', // Controller -> Mouse
    '1603487201963-7c202c745006': '1531310197839-ccf54634509e', // Sandals/Towels -> Loafers
    '1571175432230-01a2887f31d6': '1558618666-fcd25c85cd64', // Refrigerators -> Working Refrigerator
    '1544224013-0309995535c5': '1574269909862-7e1d70bb8078', // Rice Cooker -> Microwave
    '1608606749716-e41c4a01e38a': '1578500494198-246f612d3b3d', // Ganesha -> Ceramic Vase
    '1617883861745-d15f40e9fce5': '1587329310686-91414b8e3cb7', // Badminton
    '1508098682722-e99c43a406b2': '1593113616828-6f22bca04804'  // Football
};

const filesToUpdate = [
    path.join(__dirname, 'database.js'),
    path.join(__dirname, '..', 'frontend', 'products.html')
];

for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modifications = 0;
        
        for (const [oldId, newId] of Object.entries(replacements)) {
            const regex = new RegExp(oldId, 'g');
            const matches = content.match(regex);
            if (matches) {
                modifications += matches.length;
                content = content.replace(regex, newId);
            }
        }
        
        if (modifications > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${modifications} occurrences in ${path.basename(filePath)}`);
        } else {
            console.log(`No occurrences found in ${path.basename(filePath)}`);
        }
    } else {
        console.error(`File not found: ${filePath}`);
    }
}
