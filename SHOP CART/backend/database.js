const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'shopcart.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) console.error("Pragma error:", err);
        });
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            mobile TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            preferred_language TEXT DEFAULT 'en',
            role TEXT DEFAULT 'customer'
        )`);

        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            name_ta TEXT,
            name_te TEXT,
            description TEXT,
            price REAL,
            image_url TEXT,
            rating REAL,
            category TEXT,
            seller_id INTEGER,
            status TEXT DEFAULT 'approved',
            stock INTEGER DEFAULT 10
        )`);

        // Cart Table
        db.run(`CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Wishlist Table
        db.run(`CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            saved_price REAL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_amount REAL,
            payment_method TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Sellers Table
        db.run(`CREATE TABLE IF NOT EXISTS sellers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            seller_name TEXT,
            business_name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            gst_number TEXT,
            address TEXT,
            status TEXT DEFAULT 'pending',
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Order Items Table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            seller_id INTEGER,
            tracking_status TEXT DEFAULT 'Ordered',
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Complaints Table
        db.run(`CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_id INTEGER,
            subject TEXT,
            description TEXT,
            status TEXT DEFAULT 'Open',
            admin_resolution TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )`);

        // Fraud Alerts Table
        db.run(`CREATE TABLE IF NOT EXISTS fraud_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            seller_id INTEGER,
            old_price REAL,
            new_price REAL,
            percentage_change REAL,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Notifications Table
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Migration safety columns
        db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN name_ta TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN name_te TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN category TEXT`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN seller_id INTEGER`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'approved'`, () => {});
        db.run(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 10`, () => {});

        // Check if seeding is needed
        db.get("SELECT COUNT(*) AS count FROM sellers", (err, row) => {
            if (row && row.count === 0) {
                console.log('[DB] No data found. Seeding all data...');
                seedAllData();
            } else {
                // Ensure admin role is correct on existing db
                db.run("UPDATE users SET role = 'admin', password = '1234', name = 'masteradmin' WHERE email = 'ksnisha2006@gmail.com'", () => {
                    console.log('Updated existing admin user role.');
                });
            }
        });
    });
}

function seedAllData() {
    db.run("PRAGMA foreign_keys = OFF;", () => {
        const tables = ['notifications', 'fraud_alerts', 'complaints', 'order_items', 'orders', 'cart', 'wishlist', 'products', 'sellers', 'users'];
        let cleared = 0;
        tables.forEach(table => {
            db.run(`DELETE FROM ${table}`, [], () => {
                db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`, [], () => {
                    cleared++;
                    if (cleared === tables.length) {
                        proceedWithSeeding();
                    }
                });
            });
        });
    });

    function proceedWithSeeding() {
        db.serialize(() => {
            // ─── 1. USERS ───────────────────────────────────────────────────
            // id=1 Admin, id=2–9 Sellers, id=10–12 Customers
            const users = [
                [1, 'masteradmin',     '0000000000', 'ksnisha2006@gmail.com',  '1234',        'en', 'admin'],
                [2, 'Alpha Electronics','1111111111', 'seller1@shopcart.com',   'seller123',   'en', 'seller'],
                [3, 'Beta Fashion',     '2222222222', 'seller2@shopcart.com',   'seller123',   'en', 'seller'],
                [4, 'Gamma Audio',      '3333333333', 'seller3@shopcart.com',   'seller123',   'en', 'seller'],
                [5, 'Delta Home',       '4444444444', 'seller4@shopcart.com',   'seller123',   'en', 'seller'],
                [6, 'Omega Books',      '5555555555', 'seller5@shopcart.com',   'seller123',   'en', 'seller'],
                [7, 'Zeta Sports',      '6666666666', 'seller6@shopcart.com',   'seller123',   'en', 'seller'],
                [8, 'Nexus Phones',     '7777777777', 'seller7@shopcart.com',   'seller123',   'en', 'seller'],
                [9, 'Apex Wearables',  '8888888888', 'seller8@shopcart.com',   'seller123',   'en', 'seller'],
                [10,'Priya Sharma',    '9876543210', 'customer1@shopcart.com', 'customer123', 'en', 'customer'],
                [11,'Rahul Mehta',     '9876543211', 'customer2@shopcart.com', 'customer123', 'en', 'customer'],
                [12,'Sneha Verma',     '9876543212', 'customer3@shopcart.com', 'customer123', 'en', 'customer'],
            ];
            const uStmt = db.prepare("INSERT INTO users (id,name,mobile,email,password,preferred_language,role) VALUES (?,?,?,?,?,?,?)");
            users.forEach(u => uStmt.run(...u));
            uStmt.finalize();

            // ─── 2. SELLERS ─────────────────────────────────────────────────
            const sellers = [
                [1, 2, 'Alpha Electronics','Alpha Tech Store',      'seller1@shopcart.com','1111111111','22AAAAA1111A1Z1','Mumbai, Maharashtra',  'approved','seller123'],
                [2, 3, 'Beta Fashion',     'Beta Clothing Hub',     'seller2@shopcart.com','2222222222','22BBBBB2222B1Z2','Delhi, Delhi',          'approved','seller123'],
                [3, 4, 'Gamma Audio',      'Gamma Sound Beats',     'seller3@shopcart.com','3333333333','22CCCCC3333C1Z3','Bangalore, Karnataka',  'approved','seller123'],
                [4, 5, 'Delta Home',       'Delta Home Products',   'seller4@shopcart.com','4444444444','22DDDDD4444D1Z4','Chennai, Tamil Nadu',   'approved','seller123'],
                [5, 6, 'Omega Books',      'Omega Bookstore',       'seller5@shopcart.com','5555555555','22EEEEE5555E1Z5','Kolkata, West Bengal',  'approved','seller123'],
                [6, 7, 'Zeta Sports',      'Zeta Sports Arena',     'seller6@shopcart.com','6666666666','22FFFFF6666F1Z6','Hyderabad, Telangana',  'approved','seller123'],
                [7, 8, 'Nexus Phones',     'Nexus Digital World',   'seller7@shopcart.com','7777777777','22GGGGG7777G1Z7','Ahmedabad, Gujarat',    'approved','seller123'],
                [8, 9, 'Apex Wearables',   'Apex Watch Studio',     'seller8@shopcart.com','8888888888','22HHHHH8888H1Z8','Pune, Maharashtra',     'approved','seller123'],
                // Pending sellers (no user_id)
                [9, null,'Vortex Gaming Zone','Vortex Gaming',     'vortex@example.com', '9901234567','22IIIII9999I1Z9','Noida, Uttar Pradesh',  'pending', 'seller123'],
                [10,null,'Prime KitchenWare','Prime Kitchen',      'prime@example.com',  '9812345678','22JJJJJ0000J1Z0','Jaipur, Rajasthan',     'pending', 'seller123'],
            ];
            const sStmt = db.prepare("INSERT INTO sellers (id,user_id,seller_name,business_name,email,phone,gst_number,address,status,password) VALUES (?,?,?,?,?,?,?,?,?,?)");
            sellers.forEach(s => sStmt.run(...s));
            sStmt.finalize();

            // ─── 3. PRODUCTS ─────────────────────────────────────────────────
            // [name, name_ta, name_te, description, price, image_url, rating, category, seller_id, status, stock]
            const products = [
                ["Apple iPhone 15 Pro", "ஐபோன் 15 ப்ரோ", "ఐఫోన్ 15 ప్రో", "256GB Titanium, A17 Pro chip, 48MP camera system.", 134900, "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80", 4.9, "Smartphones", 8, "approved", 35],
                ["Samsung Galaxy S24 Ultra", "கேலக்ஸி S24", "గెలాక్సీ S24 అల్ట్రా", "512GB Titanium, built-in S Pen, AI-powered camera.", 129999, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80", 4.8, "Smartphones", 8, "approved", 22],
                ["Google Pixel 8 Pro", "பிக்சல் 8 ப்ரோ", "పిక్సెల్ 8 ప్రో", "128GB Obsidian, Tensor G3 chip, 7-year software support.", 106999, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80", 4.7, "Smartphones", 8, "approved", 18],
                ["OnePlus 12", "ஒன்பிளஸ் 12", "వన్‌ప్లస్ 12", "256GB, Snapdragon 8 Gen 3, Hasselblad camera system.", 64999, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80", 4.6, "Smartphones", 8, "approved", 40],
                ["Xiaomi Redmi Note 13 Pro", "ரெட்மி நோட் 13", "రెడ్మి నోట్ 13 ప్రో", "256GB, 200MP Camera, 120W HyperCharge.", 29999, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80", 4.4, "Smartphones", 8, "approved", 50],
                ["Realme 12 Pro+", "ரியல்மி 12 ப்ரோ+", "రియల్‌మి 12 ప్రో+", "Periscope Portrait Camera, Snapdragon 7s Gen 2.", 31999, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80", 4.5, "Smartphones", 8, "approved", 25],
                ["Motorola Edge 50 Pro", "மோட்டோரோலா எட்ஜ் 50", "మోటోరోలా ఎడ్జ్ 50 ప్రో", "IP68 Underwater Protection, 1.5K 144Hz Display.", 35999, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80", 4.3, "Smartphones", 8, "approved", 30],
                ["Vivo V30 Pro", "விவோ V30 ப்ரோ", "వివో V30 ప్రో", "ZEISS Professional Portrait, Slimmest 5000mAh Phone.", 41999, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80", 4.6, "Smartphones", 8, "approved", 28],
                ["Apple MacBook Pro M3", "மேக்புக் ப்ரோ M3", "మాక్‌బుక్ ప్రో M3", "14-inch, 16GB RAM, 512GB SSD, M3 Pro chip.", 198900, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80", 4.9, "Laptops", 2, "approved", 12],
                ["Dell XPS 15", "டெல் XPS 15", "డెల్ XPS 15", "Intel i9, 32GB RAM, 1TB SSD, OLED display.", 189999, "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80", 4.7, "Laptops", 2, "approved", 9],
                ["HP Spectre x360", "HP ஸ்பெக்டர் x360", "HP స్పెక్టర్ x360", "13.5-inch OLED, Intel i7, 16GB RAM, 2-in-1 convertible.", 159999, "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80", 4.6, "Laptops", 2, "approved", 14],
                ["Lenovo IdeaPad Slim 3", "லெனோவா ஐடியாபேட்", "లెనోవా ఐడియాప్యాడ్", "15.6-inch FHD, Ryzen 5, 8GB RAM, 512GB SSD.", 43990, "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80", 4.2, "Laptops", 2, "approved", 25],
                ["ASUS Vivobook 15", "ஆசஸ் விவோபுக்", "ఆసస్ వివోబుక్ 15", "Intel i5 12th Gen, 16GB RAM, 512GB SSD.", 49990, "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80", 4.3, "Laptops", 2, "approved", 20],
                ["Acer Aspire 5", "ஏசர் ஆஸ்பியர்", "ఏసర్ ఆస్పైర్ 5", "Intel i3 13th Gen, 8GB RAM, 512GB SSD, Win 11.", 37990, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80", 4.1, "Laptops", 2, "approved", 30],
                ["Apple MacBook Air M2", "மேக்புக் ஏர் M2", "మాక్‌బుక్ ఎయిర్ M2", "13.6-inch Liquid Retina, 8GB RAM, 256GB SSD.", 99900, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80", 4.8, "Laptops", 2, "approved", 15],
                ["MSI Cyborg 15", "MSI சைபோர்க்", "MSI సైబోర్గ్ 15", "Intel i7, RTX 4060, 16GB RAM, 512GB SSD, Gaming Laptop.", 94990, "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80", 4.5, "Laptops", 2, "approved", 8],
                ["Sony WH-1000XM5", "சோனி WH-1000XM5", "సోనీ WH-1000XM5", "Industry-leading ANC, 30-hour battery, Hi-Res audio.", 29990, "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80", 4.9, "Audio", 4, "approved", 30],
                ["Apple AirPods Pro 2", "ஏர்பாட்ஸ் ப்ரோ 2", "ఎయిర్‌పాడ్స్ ప్రో 2", "H2 chip, Adaptive Transparency, MagSafe charging case.", 24900, "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80", 4.8, "Audio", 4, "approved", 25],
                ["boAt Rockerz 450", "போட் ராக்கர்ஸ்", "బోట్ రాకర్జ్", "On-ear wireless, 15-hour battery, 40mm drivers.", 1499, "https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&q=80", 4.2, "Audio", 4, "approved", 60],
                ["JBL Tune 510BT", "JBL டியூன் 510BT", "JBL ట్యూన్ 510BT", "Pure Bass sound, 40-hour battery, Bluetooth 5.0.", 3499, "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80", 4.4, "Audio", 4, "approved", 45],
                ["Sennheiser HD 450BT", "சென்ஹைசர் HD 450BT", "సెన్‌హైజర్ HD 450BT", "Wireless Active Noise Cancelling, 30-hour battery.", 8990, "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80", 4.5, "Audio", 4, "approved", 15],
                ["OnePlus Buds 3", "ஒன்பிளஸ் பட்ஸ் 3", "వన్‌ప్లస్ బడ్స్ 3", "49dB Smart Adaptive ANC, Dual Drivers, LHDC 5.0.", 5499, "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=400&q=80", 4.6, "Audio", 4, "approved", 50],
                ["Bose QuietComfort Ultra", "போஸ் குயட்கம்போர்ட்", "బోస్ క్వైట్‌కంఫర్ట్ ఆల్ట్రా", "World-class noise cancellation, spatial audio, customtune.", 35900, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80", 4.9, "Audio", 4, "approved", 12],
                ["JBL Flip 6", "JBL பிளிப் 6", "JBL ఫ్లిప్ 6", "Portable Waterproof Speaker, 2-way speaker system.", 11999, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80", 4.7, "Audio", 4, "approved", 40],
                ["Apple Watch Series 9", "ஆப்பிள் வாட்ச் 9", "యాపిల్ వాచ్ 9", "GPS, 41mm, Midnight Aluminium, advanced health sensors.", 41900, "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80", 4.8, "Smartwatches", 9, "approved", 20],
                ["Samsung Galaxy Watch 6", "கேலக்ஸி வாட்ச் 6", "గెలాక్సీ వాచ్ 6", "44mm, BioActive sensor, sapphire crystal display.", 29999, "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80", 4.6, "Smartwatches", 9, "approved", 17],
                ["Noise ColorFit Ultra 3", "நாய்ஸ் கலர்ஃபிட்", "నాయిస్ కలర్‌ఫిట్", "1.96-inch AMOLED, always-on display, health tracking.", 3499, "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80", 4.2, "Smartwatches", 9, "approved", 55],
                ["Fire-Boltt Gladiator", "பயர்-போல்ட் கிளாடியேட்டர்", "ఫైర్-బోల్ట్ గ్లాడియేటర్", "1.96-inch display, Bluetooth calling, 123 sports modes.", 2499, "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80", 4.1, "Smartwatches", 9, "approved", 80],
                ["Amazfit GTR 4", "அமாஸ்ஃபிட் GTR 4", "అమేజ్‌ఫిట్ GTR 4", "Dual-band GPS, 14-day battery, Alexa built-in.", 16999, "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80", 4.5, "Smartwatches", 9, "approved", 22],
                ["OnePlus Watch 2", "ஒன்பிளஸ் வாட்ச் 2", "వన్‌ప్లస్ వాచ్ 2", "Dual-engine architecture, Wear OS by Google, 100-hour battery.", 24999, "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80", 4.7, "Smartwatches", 9, "approved", 15],
                ["Fitbit Charge 6", "ஃபிட்பிட் சார்ஜ் 6", "ఫిట్‌బిట్ ఛార్జ్ 6", "Fitness tracker, built-in GPS, heart rate on gym equipment.", 14999, "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80", 4.4, "Smartwatches", 9, "approved", 30],
                ["boAt Wave Call", "போட் வேவ் கால்", "బోట్ వేవ్ కాల్", "Smartwatch with Bluetooth calling, 1.69-inch HD display.", 1799, "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80", 4, "Smartwatches", 9, "approved", 70],
                ["Sony Bravia 55-inch 4K TV", "சோனி பிராவியா 55\"", "సోనీ బ్రావియా 55\"", "OLED, Dolby Vision, Google TV, HDMI 2.1, X1 Ultimate.", 129990, "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80", 4.8, "TVs", 4, "approved", 7],
                ["Mi Smart TV 43-inch 4K", "மி ஸ்மார்ட் TV 43\"", "మి స్మార్ట్ TV 43\"", "4K Android TV, Vivid Picture Engine, Dolby Audio.", 28999, "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80", 4.5, "TVs", 4, "approved", 15],
                ["OnePlus 50-inch 4K TV", "ஒன்பிளஸ் 50\"", "వన్‌ప్లస్ 50 అంగుళాల TV", "Bezel-less Design, Dolby Audio, OxygenPlay 2.0.", 36999, "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80", 4.4, "TVs", 4, "approved", 18],
                ["Samsung 43-inch Crystal 4K", "சாம்சங் 43\"", "శాంసంగ్ 43 అంగుళాల TV", "Crystal Processor 4K, HDR10+, Smart Hub.", 31990, "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80", 4.6, "TVs", 4, "approved", 20],
                ["LG 55-inch UHD Smart TV", "LG 55\"", "LG 55 అంగుళాల UHD TV", "WebOS, AI ThinQ, 4K Upscaling, HDR10 Pro.", 44990, "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80", 4.5, "TVs", 4, "approved", 12],
                ["Sony PlayStation 5 Slim", "பிளேஸ்டேஷன் 5 ஸ்லிம்", "ప్లేస్టేషన్ 5 స్లిమ్", "PS5 Slim Console with 1TB SSD storage, 4K gaming, Ray Tracing.", 44990, "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80", 4.8, "Gaming", 2, "approved", 25],
                ["Nintendo Switch OLED", "நிண்டெண்டோ ஸ்விட்ச்", "నింటెండో స్విచ్ OLED", "7-inch OLED screen, 64GB storage, vibrant colors.", 32490, "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80", 4.7, "Gaming", 2, "approved", 15],
                ["Microsoft Xbox Series X", "எக்ஸ்பாக்ஸ் சீரிஸ் X", "ఎక్స్‌బాక్స్ సిరీస్ X", "True 4K gaming, 12 teraflops, 1TB SSD.", 49990, "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&q=80", 4.8, "Gaming", 2, "approved", 10],
                ["Cosmic Byte Wireless Controller", "காஸ்மிக் பைட் கன்ட்ரோலர்", "కాస్మిక్ బైట్ వైర్‌లెస్ కంట్రోలర్", "Wireless gamepad for PC, Android, PS3, dual vibration.", 1699, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80", 4.2, "Gaming", 2, "approved", 40],
                ["Logitech G502 Hero Mouse", "லாஜிடெக் மவுஸ்", "లాజిటెక్ G502 హీరో మౌస్", "25K gaming sensor, 11 programmable buttons, RGB.", 4295, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80", 4.6, "Gaming", 2, "approved", 50],
                ["Nike Air Max 270", "நைக் ஏர் மேக்ஸ்", "నైక్ ఎయిర్ మాక్స్", "Men's lifestyle sneakers, large heel Air unit.", 12500, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", 4.6, "Footwear", 3, "approved", 45],
                ["Adidas Ultraboost 23", "அல்ட்ராபூஸ்ட் 23", "అల్ట్రాబూస్ట్ 23", "BOOST midsole, Primeknit+ upper, Continental rubber.", 16999, "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80", 4.7, "Footwear", 3, "approved", 30],
                ["Puma Classic Sneakers", "பியூமா ஸ்னீக்கர்ஸ்", "பூமா క్లాసిక్ స్నీకర్స్", "Suede upper, classic design, rubber outsole.", 5999, "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&q=80", 4.4, "Footwear", 3, "approved", 35],
                ["Reebok Running Shoes", "ரீபாக் ரன்னிங் ஷூஸ்", "రీబాక్ రన్నింగ్ షూస్", "Floatride Energy foam, breathable mesh upper.", 7999, "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&q=80", 4.3, "Footwear", 3, "approved", 40],
                ["Red Tape Casual Loafers", "ரெட் டேப் லோஃபர்ஸ்", "రెడ్ టేప్ క్యాజువల్ లోఫర్స్", "Slip-on style, memory foam insole, genuine leather.", 2499, "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=400&q=80", 4.2, "Footwear", 3, "approved", 50],
                ["Sparx Men's Sandals", "ஸ்பார்க்ஸ் சாண்டல்ஸ்", "స్పార్క్స్ పురుషుల శాండల్స్", "Comfortable everyday sandals, strap closure, durable.", 999, "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=400&q=80", 4.1, "Footwear", 3, "approved", 60],
                ["Levi's 511 Slim Fit Jeans", "லீவிஸ் 511 ஜீன்ஸ்", "లెవిస్ 511 జీన్స్", "Classic slim fit, Throttle dark blue, 99% cotton.", 3999, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80", 4.5, "Clothing", 3, "approved", 50],
                ["Allen Solly Cotton Polo", "ஆலன் சோலி போலோ", "అలెన్ సోలీ కాటన్ పోలో", "Men's solid polo shirt, cotton blend, regular fit.", 1299, "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80", 4.3, "Clothing", 3, "approved", 60],
                ["Zara Women's Floral Dress", "சாரா புளோரல் டிரஸ்", "జారా మహిళల ఫ్లోరల్ డ్రెస్", "A-line floral print dress with long sleeves and collar.", 3590, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80", 4.4, "Clothing", 3, "approved", 25],
                ["Puma Sports Tracksuit", "பியூமா டிராக்சூட்", "పూమా స్పోర్ட்ஸ் ట్రాక్‌సూట్", "Polyester blend tracksuit, zip closure jacket, slim pants.", 4999, "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80", 4.5, "Clothing", 3, "approved", 30],
                ["Peter England Cotton Shirt", "பீட்டர் இங்கிலாந்து சட்டை", "పీటర్ ఇంగ్లాండ్ కాటన్ షర్ట్", "Slim fit formal shirt, check pattern, easy iron.", 1699, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80", 4.2, "Clothing", 3, "approved", 40],
                ["Van Heusen Innerwear Pack", "வேன் ஹியூசன்", "వాన్ హ్యూసెన్ ఇన్నర్‌వేర్ ప్యాక్", "Pack of 3 premium combed cotton briefs.", 899, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80", 4.4, "Clothing", 3, "approved", 70],
                ["Philips Air Fryer XXL", "பிலிப்ஸ் ஏர் ஃப்ரையர்", "ఫిలిప్స్ ఎయిర్ ఫ్రైయర్", "1.4kg capacity, Rapid Air, 90% less fat.", 12999, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80", 4.6, "Home Appliances", 5, "approved", 22],
                ["iRobot Roomba i3+", "ரூம்பா i3+", "రూంబా i3+", "Robot vacuum, clean base auto dirt disposal, smart mapping.", 44999, "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80", 4.6, "Home Appliances", 5, "approved", 8],
                ["Voltas 1.5 Ton Split AC", "வோல்டாஸ் ஏசி 1.5 டன்", "వోల్టాస్ 1.5 టన్ స్ప్లిట్ AC", "3 Star Inverter Split AC, Copper Condenser, PM 2.5 filter.", 38990, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 4.5, "Home Appliances", 5, "approved", 20],
                ["LG 1.5 Ton Split AC", "LG ஏசி 1.5 டன்", "LG 1.5 టన్ స్ప్లిట్ AC", "5 Star Dual Inverter Split AC, 4-in-1 convertible.", 45990, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 4.7, "Home Appliances", 5, "approved", 15],
                ["Daikin 1 Ton Split AC", "டைகின் ஏசி 1 டன்", "దైకిన్ 1 టన్ స్ప్లిట్ AC", "3 Star Inverter AC, PM 2.5 filter, Econo mode.", 32990, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 4.4, "Home Appliances", 5, "approved", 18],
                ["Samsung 236L Refrigerator", "சாம்சங் பிரிட்ஜ் 236லி", "శాంసంగ్ 236L రిఫ్రిజిరేటర్", "3 Star Digital Inverter Double Door Refrigerator.", 25990, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", 4.5, "Home Appliances", 5, "approved", 12],
                ["Whirlpool 190L Refrigerator", "வேர்ல்பூல் பிரிட்ஜ் 190லி", "వర్ల్‌పూల్ 190L రిఫ్రిజిరేటర్", "2 Star Direct Cool Single Door Refrigerator.", 14990, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", 4.3, "Home Appliances", 5, "approved", 25],
                ["LG 687L Refrigerator", "LG பிரிட்ஜ் 687லி", "LG 687L డబుல் డోర్ రిఫ్రిజిరేటర్", "Frost Free Side-by-Side Refrigerator, Smart Diagnosis.", 84990, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", 4.8, "Home Appliances", 5, "approved", 5],
                ["LG 7kg Front Load Washer", "LG வாஷிங் மெஷின் 7கிலோ", "LG 7kg ఫ్రంట్ లోడ్ వాషింగ్ మెஷின்", "Fully Automatic Front Load with Inverter Direct Drive.", 29990, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80", 4.7, "Home Appliances", 5, "approved", 14],
                ["Samsung 6.5kg Top Load Washer", "சாம்சங் வாஷிங் மெஷின் 6.5கிலோ", "శాంసంగ్ 6.5kg వాషింగ్ మెషీన్", "Fully Automatic Top Load with Wobble technology.", 16490, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80", 4.4, "Home Appliances", 5, "approved", 20],
                ["Instant Pot Duo 7-in-1", "இன்ஸ்டன்ட் பாட்", "ఇన్‌స్టంట్ పాట్", "Pressure cooker, slow cooker, rice cooker, steamer.", 8999, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80", 4.7, "Kitchen", 5, "approved", 18],
                ["IFB 20L Convection Microwave", "IFB மைக்ரோவேவ் 20லி", "IFB 20L కన్వెక్షన్ మైక్రోవేవ్", "Convection microwave oven for baking, grilling, cooking.", 10990, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80", 4.5, "Kitchen", 5, "approved", 12],
                ["Samsung 23L Solo Microwave", "சாம்சங் மைக்ரோவேவ் 23லி", "శాంసంగ్ 23L సోలో మైక్రోవేవ్", "Solo microwave with Ceramic Enamel cavity, touch control.", 6990, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80", 4.4, "Kitchen", 5, "approved", 22],
                ["Panasonic 20L Solo Microwave", "பானாசோனிக் மைக்ரோவேவ் 20லி", "పానాసోనిక్ 20L సోలో మైక్రోవేవ్", "Solo microwave oven, compact design, 5 power levels.", 5990, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80", 4.3, "Kitchen", 5, "approved", 25],
                ["Pigeon 4 Plate Induction Cooktop", "பீஜியன் இண்டக்ஷன்", "పిజియన్ ఇండక్షన్ కుక్‌టాப்", "Push button control, 7 segments LED display.", 2199, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80", 4.1, "Kitchen", 5, "approved", 40],
                ["Prestige Iris 750W Mixer Grinder", "பிரெஸ்டீஜ் மிக்ஸி", "ప్రెస్టీజ్ మిక్సీ గ్రైండర్ 750W", "3 stainless steel jars, 1 juicer jar, powerful motor.", 3499, "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80", 4.3, "Kitchen", 5, "approved", 35],
                ["Kent 16025 150W Hand Blender", "கென்ட் பிளெண்டர்", "కెంట్ 150W హ్యాండ్ బ్లెండర్", "5 speed control, turbo function, stainless steel beaters.", 1299, "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80", 4.2, "Kitchen", 5, "approved", 45],
                ["Havells 1.2L Electric Kettle", "ஹவெல்ஸ் எலக்ட்ரிக் கெட்டில்", "ஹவெல்ஸ் 1.2L ఎలక్ట్రిక్ కెటిల్", "304 stainless steel interior, auto shut-off.", 1399, "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80", 4.4, "Kitchen", 5, "approved", 50],
                ["Philips Daily Collection Toaster", "பிலிப்ஸ் டோஸ்டர்", "ఫిలిప్స్ టోస్టர்", "2-slice toaster, 8 browning settings, compact design.", 1999, "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80", 4.4, "Kitchen", 5, "approved", 30],
                ["Prestige 1.5L Rice Cooker", "பிரெஸ்டீஜ் ரைஸ் குக்கர்", "ప్రెస్టీజ్ 1.5L రైస్ కుక్కర్", "Double wall body, keep warm function, additional cooking pan.", 1990, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80", 4.3, "Kitchen", 5, "approved", 20],
                ["Decornation Cushion Covers Pack", "குஷன் கவர்கள்", "కుషన్ కవర్ల ప్యాక్", "Set of 5 cotton cushion covers, 16x16 inches.", 499, "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80", 4.3, "Home decor", 5, "approved", 50],
                ["Story@Home Cotton Double Bedsheet", "பருத்தி பெட்ஷீட்", "కాటன் డబుల్ బెడ్‌షీట్", "Premium cotton double bedsheet with 2 pillow covers.", 899, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80", 4.4, "Home decor", 5, "approved", 40],
                ["Solimo Reversible Comforter", "கம்பளி போர்வை", "రివర్సిబుల్ కాంఫర్టర్", "Soft siliconized microfiber comforter, warm and cozy.", 1599, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80", 4.5, "Home decor", 5, "approved", 25],
                ["Collectible India Ganesha Figurine", "விநாயகர் சிலை", "గణేశ విగ్రహం", "Metal Ganesha idol on leaf, home decor showpiece.", 399, "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80", 4.6, "Home decor", 5, "approved", 60],
                ["Artisan Shoppe Ceramic Flower Vase", "பீங்கான் பூ ஜாடி", "సెరమిక్ పూల జాడీ", "Decorative white ceramic vase for home and office.", 599, "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80", 4.5, "Home decor", 5, "approved", 30],
                ["Kiera Grace Wood Wall Shelves", "மர சுவர் அலமாரி", "చెక్క గోడ షెల్ఫ్", "Set of 3 floating shelves for wall display.", 1299, "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80", 4.4, "Home decor", 5, "approved", 35],
                ["Decals Design Tree Wall Sticker", "சுவர் ஒட்டி", "వాల్ స్టిక్కర్ చెట్టు", "Large wall decal, family tree photo frames.", 299, "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80", 4.2, "Home decor", 5, "approved", 80],
                ["Fresh From Loom Door Curtains", "வாசல் திரைச்சீலைகள்", "తలుపు తెరలు", "Set of 2 polyester door curtains, 7 feet.", 599, "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80", 4.3, "Home decor", 5, "approved", 40],
                ["Bathla Mobidry Ironing Board", "இஸ்திரி பலகை", "ఐరనింగ్ బోర్డు", "Sturdy ironing table with heat-resistant iron holder.", 2499, "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80", 4.5, "Home decor", 5, "approved", 15],
                ["Orpat Adjustable Ironing Table", "இஸ்திரி மேஜை", "ఐరనింగ్ టేబుల్", "Foldable ironing table, height adjustable.", 1899, "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80", 4.2, "Home decor", 5, "approved", 20],
                ["Philips Base LED Bulb 12W", "பிலிப்ஸ் எல்.இ.டி பல்ப்", "ఫిలిప్స్ LED బల్బ్ 12W", "Cool day light B22 base LED bulb, energy saving.", 119, "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&q=80", 4.4, "Lighting", 5, "approved", 100],
                ["Wipro Smart LED Wi-Fi Bulb", "விப்ரோ ஸ்மார்ட் பல்ப்", "విప్రో స్మార్ட் LED బల్బ్", "9W smart bulb, compatible with Alexa and Google Assistant.", 699, "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&q=80", 4.5, "Lighting", 5, "approved", 50],
                ["Havells Pendant Decorative Light", "ஹவெல்ஸ் அலங்கார விளக்கு", "హావెల్స్ పెండెంట్ లైట్", "Single pendant light, glass shade, vintage design.", 1599, "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&q=80", 4.6, "Lighting", 5, "approved", 25],
                ["Philips Starry Night LED Strip", "பிலிப்ஸ் விளக்கு பட்டா", "ఫిలిప్స్ LED స్ట్రిప్ లైట్", "5m flexible LED strip light, warm white, with adapter.", 799, "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&q=80", 4.3, "Lighting", 5, "approved", 40],
                ["Murphy LED Downlight 9W", "எல்.இ.டி டவுன்லைட்", "LED డౌన్‌లైట్ 9W", "Slim round panel recessed light, white ceiling light.", 249, "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&q=80", 4.2, "Lighting", 5, "approved", 80],
                ["Deco Light Wooden Table Lamp", "மர மேஜை விளக்கு", "చెక్క టేబుல் లాంప్", "Handcrafted wooden table lamp for bedroom and living room.", 899, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80", 4.5, "Lighting", 5, "approved", 30],
                ["Solar Powered Outdoor Wall Light", "சூரிய சக்தி விளக்கு", "సౌర శక్తితో పనిచేసే గోడ లైట్", "Waterproof motion sensor solar light for garden/patio.", 499, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80", 4.1, "Lighting", 5, "approved", 60],
                ["Gesto Curtain String LED Lights", "அலங்கார விளக்கு சரம்", "కర్టెన్ స్ట్రింగ్ LED లైట్లు", "300 LED window curtain string lights, 8 modes.", 399, "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&q=80", 4.4, "Lighting", 5, "approved", 55],
                ["Bosch Hand Tool Kit 46-Pieces", "பாஷ் கருவி பெட்டி", "బాష్ హ్యాండ్ టూల్ కిట్", "Screwdriver bits, socket wrenches, hand tools in case.", 1999, "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80", 4.6, "Tools", 5, "approved", 20],
                ["Black+Decker Cordless Drill", "டிரில் மெஷின்", "బ్లాక్+డెక్కర్ కార్డ్‌లెస్ డ్రిల్", "12V cordless drill driver with 10mm chuck, battery & charger.", 2899, "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80", 4.5, "Tools", 5, "approved", 15],
                ["Stanley Adjustable Spanner 10-inch", "ஸ்டான்லி ஸ்பேனர்", "స్టాన్లీ అడ్జస్టబుల్ స్పానర్", "Chrome plated adjustable wrench, rust resistant.", 499, "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80", 4.4, "Tools", 5, "approved", 35],
                ["Gala Bucket Spin Mop", "சுழலும் துடைப்பம்", "గాలా బకెట్ స్పిన్ మాప్", "Microfiber spin mop with twin bucket system for floor cleaning.", 1199, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", 4.3, "Tools", 5, "approved", 40],
                ["Vileda Microfiber Cleaning Cloths", "துடைக்கும் துணி", "వైలెడా మైక్రోఫైబర్ క్లాత్స్", "Pack of 3 premium microfiber cloths for dusting and wiping.", 299, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", 4.4, "Tools", 5, "approved", 70],
                ["Colin Glass Cleaner Spray", "கண்ணாடி துடைப்பான்", "కోలిన్ గ్లాస్ క్లీనర్", "Glass and multi-surface cleaner spray, 500ml.", 95, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", 4.5, "Tools", 5, "approved", 100],
                ["Bathroom Cleaning Liquid Brush", "குளியலறை துடைப்பான்", "బాత్రూమ్ క్లీనింగ్ లిక్విడ్ బ్రష్", "Tough bristles scrub brush with liquid soap dispenser handle.", 199, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", 4.1, "Tools", 5, "approved", 80],
                ["Stanley 6-Piece Screwdriver Set", "திருப்புளி செட்", "స్టాన్లీ స్క్రూడ్రైవర్ సెట్", "Precision steel screwdrivers with comfortable grips.", 349, "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80", 4.4, "Tools", 5, "approved", 50],
                ["Kindle Paperwhite E-Reader", "கிண்டில் ரீடர்", "కిండిల్ ఈ-రీడర్", "6.8-inch display, adjustable warm light, 16GB.", 13999, "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=400&q=80", 4.8, "Books & Reading", 6, "approved", 30],
                ["Atomic Habits by James Clear", "அணு பழக்கவழக்கங்கள்", "అటామిక్ హ్యాబిట్స్", "Tiny Changes, Remarkable Results. Bestselling self-help book.", 450, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", 4.8, "Books & Reading", 6, "approved", 100],
                ["The Psychology of Money", "பணத்தின் உளவியல்", "ది సైకాలజీ ఆఫ్ మనీ", "Timeless lessons on wealth, greed, and happiness by Morgan Housel.", 299, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", 4.7, "Books & Reading", 6, "approved", 85],
                ["It Ends With Us by Colleen Hoover", "அது நம்மோடு முடிகிறது", "ఇట్ ఎండ్స్ విత్ అస్", "Bestselling romantic drama novel about love and relationships.", 299, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", 4.5, "Books & Reading", 6, "approved", 70],
                ["Sapiens: Brief History of Humankind", "சபியன்ஸ் வரலாறு", "సపియన్స్ హిస్టరీ", "Bestselling non-fiction book by Yuval Noah Harari.", 399, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", 4.7, "Books & Reading", 6, "approved", 50],
                ["Rework by Jason Fried", "மறுவேலை", "రీవర్క్", "Change the way you work forever. Practical business guide.", 499, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", 4.6, "Books & Reading", 6, "approved", 40],
                ["LEGO Technic Bugatti Chiron Model", "லெகோ புகாட்டி", "లెగో టెక్నిక్ బుగట్టి చిరోన్", "1:8 scale model car building kit for kids and adults.", 34999, "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80", 4.8, "Toys", 6, "approved", 10],
                ["Hot Wheels Track Builder Set", "ஹாட் வீல்ஸ் டிராக்", "హాట్ వీల్స్ ట్రాక్ బిల్డర్", "Stunt builder track set with launcher and toy cars.", 1999, "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&q=80", 4.5, "Toys", 6, "approved", 35],
                ["Nerf Elite Blaster", "நெர்ஃப் பிளாஸ்டர்", "నెర్ఫ్ ఎలైట్ బ్లాస్టర్", "Toy gun with 12 official foam darts, target practice.", 1499, "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&q=80", 4.4, "Toys", 6, "approved", 40],
                ["Fisher-Price Baby Rattle Set", "குழந்தை விளையாட்டு", "ఫిషర్-ప్రైస్ బేబీ రాటిల్ సెట్", "Set of 5 colorful rattles and teether toys for newborns.", 799, "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&q=80", 4.6, "Toys", 6, "approved", 50],
                ["Monopoly Classic Board Game", "மோனோபோலி போர்டு கேம்", "మోనోపోలి బోర్డు గేమ్", "Fast-dealing property trading game for families.", 999, "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&q=80", 4.7, "Toys", 6, "approved", 25],
                ["Rubik's 3x3 Speed Cube", "ரூபிக்ஸ் கியூப்", "రూబిక్స్ 3x3 స్పీడ్ క్యూబ్", "Standard Rubik's cube, stickerless design, smooth turns.", 299, "https://images.unsplash.com/photo-1591806336026-f825d72071a2?w=400&q=80", 4.5, "Toys", 6, "approved", 100],
                ["Yonex Astrox 88D Play", "யோனெக்ஸ் பேட்மிண்டன்", "యోనెక్స్ ఆస్ట్రాక్స్ 88D ప్లే", "Graphite badminton racket for powerful smashes.", 9999, "https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?w=400&q=80", 4.7, "Sports", 7, "approved", 20],
                ["American Tourister Cabin Bag 55cm", "பயண பை", "అమెరికన్ టూరిస్టర్ క్యాబిన్ బ్యాగ్", "Hard luggage trolley bag, 4 spinner wheels, TSA lock.", 6999, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80", 4.5, "Travel", 7, "approved", 25],
                ["Nivia Football Size 5", "நிவியா கால்பந்து", "నివియా ఫుట్‌బాల్ సైజ్ 5", "Laminated rubber football, high air retention bladder.", 699, "https://images.unsplash.com/photo-1593113616828-6f22bca04804?w=400&q=80", 4.3, "Sports", 7, "approved", 50],
                ["Cosco Cricket Tennis Ball Pack", "டென்னிஸ் பந்து", "కాస్కో టెన్నిస్ బాల్ ప్యాక్", "Pack of 6 heavy duty red tennis balls for cricket.", 399, "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&q=80", 4.4, "Sports", 7, "approved", 80],
                ["Decathlon Hiking Backpack 20L", "ஹைகிங் பேக்பேக்", "డెకాథ్లాన్ హైకింగ్ బ్యాక్‌ప్యాక్ 20L", "Lightweight trekking and hiking backpack, waterproof.", 999, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80", 4.6, "Sports", 7, "approved", 40],
                ["Stiga 3-Star Table Tennis Racket", "டிடி பேட்", "స్టిగా 3-స్టార్ టేబుల్ టెన్నిస్ రాకెట్", "ItTF approved rubber, 5-ply blade, professional control.", 1499, "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=400&q=80", 4.4, "Sports", 7, "approved", 30],
            ];
            const pStmt = db.prepare("INSERT INTO products (name,name_ta,name_te,description,price,image_url,rating,category,seller_id,status,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            products.forEach(p => pStmt.run(...p));
            pStmt.finalize();

            // ─── 4. ORDERS ───────────────────────────────────────────────────
            // Historical orders spread across months for analytics charts
            // [id, user_id, total_amount, payment_method, status, created_at]
            const orders = [
                [1,  10, 134900, 'UPI',         'Success', '2026-01-15 10:30:00'],
                [2,  11, 189999, 'Credit Card', 'Success', '2026-01-28 14:00:00'],
                [3,  12,  29990, 'Net Banking', 'Success', '2026-02-05 09:15:00'],
                [4,  10,  41900, 'UPI',         'Success', '2026-02-20 11:45:00'],
                [5,  11, 129999, 'Debit Card',  'Success', '2026-03-03 16:00:00'],
                [6,  12,  24900, 'COD',         'Success', '2026-03-18 13:30:00'],
                [7,  10,  12500, 'UPI',         'Success', '2026-04-02 10:00:00'],
                [8,  11,  64999, 'Credit Card', 'Success', '2026-04-15 15:30:00'],
                [9,  12,  13999, 'UPI',         'Success', '2026-04-28 12:00:00'],
                [10, 10,  16999, 'Net Banking', 'Success', '2026-05-06 09:00:00'],
                [11, 11,  44999, 'Credit Card', 'Success', '2026-05-20 14:00:00'],
                [12, 12,   9999, 'UPI',         'Success', '2026-05-30 11:00:00'],
                [13, 10, 129990, 'Credit Card', 'Success', '2026-06-02 16:30:00'],
                [14, 11,  29999, 'UPI',         'Success', '2026-06-10 10:15:00'],
                [15, 12,   3499, 'COD',         'Success', '2026-06-14 13:00:00'],
            ];
            const oStmt = db.prepare("INSERT INTO orders (id,user_id,total_amount,payment_method,status,created_at) VALUES (?,?,?,?,?,?)");
            orders.forEach(o => oStmt.run(...o));
            oStmt.finalize();

            // ─── 5. ORDER ITEMS ───────────────────────────────────────────────
            // [order_id, product_id, quantity, price, seller_id, tracking_status]
            const orderItems = [
                [1,  1,  1, 134900, 8, 'Delivered'],   // iPhone 15 Pro
                [2,  6,  1, 189999, 2, 'Delivered'],   // Dell XPS 15
                [3,  8,  1,  29990, 4, 'Delivered'],   // Sony WH-1000XM5
                [4,  11, 1,  41900, 9, 'Delivered'],   // Apple Watch S9
                [5,  2,  1, 129999, 8, 'Shipped'],     // Samsung Galaxy S24 Ultra
                [6,  9,  1,  24900, 4, 'Delivered'],   // AirPods Pro 2
                [7,  14, 1,  12500, 3, 'Delivered'],   // Nike Air Max 270
                [8,  4,  1,  64999, 8, 'Packed'],      // OnePlus 12
                [9,  20, 1,  13999, 6, 'Delivered'],   // Kindle Paperwhite
                [10, 15, 1,  16999, 3, 'Delivered'],   // Adidas Ultraboost
                [11, 19, 1,  44999, 5, 'Shipped'],     // iRobot Roomba
                [12, 22, 1,   9999, 7, 'Delivered'],   // Yonex Astrox
                [13, 24, 1, 129990, 4, 'Ordered'],     // Sony Bravia 55"
                [14, 12, 1,  29999, 9, 'Shipped'],     // Galaxy Watch 6
                [15, 13, 2,   3499, 9, 'Delivered'],   // Noise ColorFit x2
            ];
            const oiStmt = db.prepare("INSERT INTO order_items (order_id,product_id,quantity,price,seller_id,tracking_status) VALUES (?,?,?,?,?,?)");
            orderItems.forEach(oi => oiStmt.run(...oi));
            oiStmt.finalize();

            // ─── 6. COMPLAINTS ────────────────────────────────────────────────
            // [user_id, order_id, subject, description, status, admin_resolution, created_at]
            const complaints = [
                [10, 1, 'Wrong item delivered', 'I ordered iPhone 15 Pro Titanium but received Black colour instead.', 'Resolved', 'We apologize for the inconvenience. A replacement has been arranged for delivery within 3 business days.', '2026-01-20 09:00:00'],
                [11, 2, 'Damaged packaging', 'The laptop box arrived with significant dents and scratches on the outer packaging.', 'Resolved', 'We have arranged a free inspection. If any damage is found internally, a replacement will be shipped.', '2026-02-01 11:00:00'],
                [12, 3, 'Product not working', 'The Sony headphones do not power on even after full charging.', 'Open', null, '2026-02-08 14:30:00'],
                [10, 7, 'Size issue', 'The Nike Air Max 270 I received is US 10 but I ordered US 11.', 'Open', null, '2026-04-05 10:00:00'],
                [11, 5, 'Late delivery', 'Order was supposed to arrive by April 1 but arrived on April 8 with no communication.', 'Resolved', 'We sincerely apologize for the delay. A ₹200 coupon has been added to your account as compensation.', '2026-03-10 15:00:00'],
            ];
            const cStmt = db.prepare("INSERT INTO complaints (user_id,order_id,subject,description,status,admin_resolution,created_at) VALUES (?,?,?,?,?,?,?)");
            complaints.forEach(c => cStmt.run(...c));
            cStmt.finalize();

            // ─── 7. FRAUD ALERTS ──────────────────────────────────────────────
            // [product_id, seller_id, old_price, new_price, percentage_change, message]
            const fraudAlerts = [
                [1, 8, 89999, 134900, 0.50, 'Abnormal price change of 50.0% (from ₹89999 to ₹134900) for product: Apple iPhone 15 Pro'],
                [24, 4, 59999, 129990, 1.17, 'Abnormal price change of 116.7% (from ₹59999 to ₹129990) for product: Sony Bravia 55-inch 4K TV'],
            ];
            const faStmt = db.prepare("INSERT INTO fraud_alerts (product_id,seller_id,old_price,new_price,percentage_change,message) VALUES (?,?,?,?,?,?)");
            fraudAlerts.forEach(f => faStmt.run(...f));
            faStmt.finalize(() => {
                db.run("PRAGMA foreign_keys = ON;");
                console.log('[DB] ✅ All seed data inserted successfully!');
                console.log('[DB]    → 12 users (1 admin, 8 sellers, 3 customers)');
                console.log('[DB]    → 10 sellers (8 approved + 2 pending)');
                console.log('[DB]    → 25 products (23 approved + 2 pending)');
                console.log('[DB]    → 15 orders with order items');
                console.log('[DB]    → 5 complaints (3 resolved + 2 open)');
                console.log('[DB]    → 2 fraud alerts');
            });
        });
    }
}

module.exports = db;
