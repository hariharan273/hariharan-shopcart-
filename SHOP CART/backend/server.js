const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const db = require('./database');

// Force IPv4 to fix ENETUNREACH errors with Gmail SMTP on some networks
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 3000;

// Temporary in-memory store for OTPs
const adminOtpStore = new Map();

// Configure NodeMailer transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'ksnisha2006@gmail.com',
        pass: 'gliz ctpp ijsl fbbc'
    }
});

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Root → index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Helper for Mock OTP
let mockOtpStorage = {}; // { email/mobile: otp }

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', (req, res) => {
    const { name, mobile, email, password } = req.body;
    
    // Check if user already exists
    db.get("SELECT id FROM users WHERE email = ? OR mobile = ?", [email, mobile], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: "Email or mobile already registered" });
        
        // Generate real 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Store pending registration
        mockOtpStorage[mobile || email] = { name, mobile, email, password, otp, expires: Date.now() + 5 * 60000 };
        
        // Return OTP in response instead of emailing
        res.json({ message: "Registration initiated.", otp: otp });
    });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { contact, otp } = req.body; // contact is mobile or email (from localStorage 'otp_contact')
    const pendingData = mockOtpStorage[contact];
    
    if (!pendingData) return res.status(400).json({ error: "No pending registration found or session expired." });
    if (Date.now() > pendingData.expires) {
        delete mockOtpStorage[contact];
        return res.status(400).json({ error: "OTP has expired. Please register again." });
    }
    
    if (pendingData.otp === otp) {
        // Valid OTP! Insert into DB
        db.run("INSERT INTO users (name, mobile, email, password) VALUES (?, ?, ?, ?)", 
            [pendingData.name, pendingData.mobile, pendingData.email, pendingData.password], function(err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                delete mockOtpStorage[contact];
                res.json({ message: "Registration successful!", userId: this.lastID });
        });
    } else {
        res.status(400).json({ error: "Invalid OTP" });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body; // username can be email, mobile, or name
    db.get("SELECT * FROM users WHERE (email = ? OR mobile = ? OR name = ?) AND password = ?", [username, username, username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Invalid credentials" });

        // Master Admin OTP Flow
        if (row.role === 'admin') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            adminOtpStore.set(row.email, { otp, expires: Date.now() + 5 * 60000, user: row });
            
            const mailOptions = {
                from: 'ksnisha2006@gmail.com',
                to: row.email,
                subject: 'Master Admin Login OTP - Quick Shopping',
                text: `Your secure Master Admin login OTP is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it with anyone.`
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("OTP Email Error:", error);
                    return res.status(500).json({ error: "Failed to send OTP email. Please check server configuration." });
                }
                return res.json({ message: "OTP_REQUIRED", email: row.email });
            });
        } else {
            // Normal User Login
            res.json({ message: "Login successful", user: { id: row.id, name: row.name, language: row.preferred_language, email: row.email, role: row.role || 'customer' } });
        }
    });
});

app.post('/api/auth/verify-admin-otp', (req, res) => {
    const { email, otp } = req.body;
    const storeData = adminOtpStore.get(email);
    
    if (!storeData) return res.status(400).json({ error: "No OTP requested or session expired" });
    if (Date.now() > storeData.expires) {
        adminOtpStore.delete(email);
        return res.status(400).json({ error: "OTP has expired. Please login again." });
    }
    if (storeData.otp !== otp) {
        return res.status(401).json({ error: "Invalid OTP" });
    }
    
    // OTP is valid! Log them in.
    const row = storeData.user;
    adminOtpStore.delete(email);
    res.json({ message: "Login successful", user: { id: row.id, name: row.name, language: row.preferred_language, email: row.email, role: row.role } });
});

app.post('/api/user/language', (req, res) => {
    const { userId, language } = req.body;
    db.run("UPDATE users SET preferred_language = ? WHERE id = ?", [language, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Language updated successfully" });
    });
});

// --- PRODUCT ROUTES ---

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products WHERE status = 'approved'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Product not found" });
        res.json(row);
    });
});

// Simulate a price drop for demo purposes
app.post('/api/admin/trigger-price-drop', (req, res) => {
    const { productId, newPrice } = req.body;
    db.run("UPDATE products SET price = ? WHERE id = ?", [newPrice, productId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Price updated for product ${productId}` });
    });
});

// --- CART ROUTES ---

app.post('/api/cart', (req, res) => {
    const { userId, productId, quantity } = req.body;
    // Check if exists
    db.get("SELECT * FROM cart WHERE user_id = ? AND product_id = ?", [userId, productId], (err, row) => {
        if (row) {
            db.run("UPDATE cart SET quantity = quantity + ? WHERE id = ?", [quantity || 1, row.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Cart updated" });
            });
        } else {
            db.run("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", [userId, productId, quantity || 1], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Item added to cart" });
            });
        }
    });
});

app.get('/api/cart/:userId', (req, res) => {
    db.all(`SELECT c.id as cart_id, c.quantity, p.* 
            FROM cart c JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?`, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.delete('/api/cart/:cartId', (req, res) => {
    db.run("DELETE FROM cart WHERE id = ?", [req.params.cartId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Item removed from cart" });
    });
});

// --- WISHLIST ROUTES ---

app.post('/api/wishlist', (req, res) => {
    const { userId, productId } = req.body;
    // Save with current price to detect drops later
    db.get("SELECT price FROM products WHERE id = ?", [productId], (err, product) => {
        if (err || !product) return res.status(500).json({ error: "Product not found" });
        db.run("INSERT INTO wishlist (user_id, product_id, saved_price) VALUES (?, ?, ?)", 
            [userId, productId, product.price], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Item added to wishlist" });
        });
    });
});

app.get('/api/wishlist/:userId', (req, res) => {
    db.all(`SELECT w.id as wishlist_id, w.saved_price, p.* 
            FROM wishlist w JOIN products p ON w.product_id = p.id 
            WHERE w.user_id = ?`, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Calculate price drops
        const wishlistWithAlerts = rows.map(item => {
            const hasDropped = item.price < item.saved_price;
            const dropAmount = hasDropped ? (item.saved_price - item.price) : 0;
            return {
                ...item,
                price_drop_alert: hasDropped ? `Price dropped by ₹${dropAmount}!` : null
            };
        });
        res.json(wishlistWithAlerts);
    });
});

// --- CHECKOUT/ORDERS ROUTES ---

app.post('/api/checkout', (req, res) => {
    const { userId, paymentMethod } = req.body;
    db.all(`SELECT c.product_id, c.quantity, p.price, p.seller_id FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`, [userId], (err, items) => {
        if (err || !items || items.length === 0) return res.status(400).json({ error: "Cart is empty or error fetching" });
        
        let totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        db.run("INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)", 
            [userId, totalAmount, paymentMethod, 'Success'], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const orderId = this.lastID;
            
            let completed = 0;
            items.forEach(item => {
                db.run("INSERT INTO order_items (order_id, product_id, quantity, price, seller_id) VALUES (?, ?, ?, ?, ?)",
                    [orderId, item.product_id, item.quantity, item.price, item.seller_id], (err) => {
                        db.run("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?", [item.quantity, item.product_id], () => {
                            completed++;
                            if (completed === items.length) {
                                db.run("DELETE FROM cart WHERE user_id = ?", [userId], () => {
                                    res.json({ message: "Order placed successfully", orderId: orderId });
                                });
                            }
                        });
                    }
                );
            });
        });
    });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/users', (req, res) => {
    db.all("SELECT id, name, mobile, email, preferred_language, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/admin/orders', (req, res) => {
    db.all(`SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Pending seller registration applications
app.get('/api/admin/sellers/pending', (req, res) => {
    db.all("SELECT * FROM sellers WHERE status = 'pending' ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get ALL approved sellers with product count
app.get('/api/admin/sellers/all', (req, res) => {
    db.all(`SELECT s.*, COUNT(p.id) as product_count
            FROM sellers s
            LEFT JOIN products p ON p.seller_id = s.user_id AND p.status = 'approved'
            WHERE s.status = 'approved'
            GROUP BY s.id
            ORDER BY s.seller_name ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get ALL products (approved + pending + rejected) with seller name
app.get('/api/admin/products/all', (req, res) => {
    db.all(`SELECT p.*, u.name as seller_name
            FROM products p
            LEFT JOIN users u ON p.seller_id = u.id
            ORDER BY p.status ASC, p.id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Approve or reject seller registration
app.post('/api/admin/sellers/approve', (req, res) => {
    const { sellerId, action } = req.body; // action: 'approve' or 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    db.run("UPDATE sellers SET status = ? WHERE id = ?", [status, sellerId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ message: `Seller application ${status}.` });
    });
});

// Pending product approvals
app.get('/api/admin/products/pending', (req, res) => {
    db.all("SELECT p.*, u.name as seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.id WHERE p.status = 'pending' ORDER BY p.id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Approve or reject product
app.post('/api/admin/products/approve', (req, res) => {
    const { productId, action } = req.body; // action: 'approve' or 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    db.run("UPDATE products SET status = ? WHERE id = ?", [status, productId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Product ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });
    });
});

// View all complaints
app.get('/api/admin/complaints', (req, res) => {
    db.all(`SELECT c.*, u.name as customer_name FROM complaints c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Resolve complaint
app.post('/api/admin/complaints/resolve', (req, res) => {
    const { complaintId, resolution } = req.body;
    db.run("UPDATE complaints SET status = 'Resolved', admin_resolution = ? WHERE id = ?", [resolution, complaintId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Complaint marked as resolved." });
    });
});

// View fraud alerts
app.get('/api/admin/fraud-alerts', (req, res) => {
    db.all(`SELECT f.*, p.name as product_name, u.name as seller_name 
            FROM fraud_alerts f 
            JOIN products p ON f.product_id = p.id 
            LEFT JOIN users u ON f.seller_id = u.id 
            ORDER BY f.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Analytics endpoints
app.get('/api/admin/analytics', (req, res) => {
    const analytics = {};
    
    // 1. Seller wise sales
    db.all(`SELECT u.name as seller_name, SUM(oi.quantity * oi.price) as total_sales 
            FROM order_items oi 
            JOIN users u ON oi.seller_id = u.id 
            GROUP BY oi.seller_id`, [], (err, sellerSales) => {
        if (err) return res.status(500).json({ error: err.message });
        analytics.sellerSales = sellerSales || [];
        
        // 2. Monthly sales
        db.all(`SELECT strftime('%m', created_at) as month_num, SUM(total_amount) as sales 
                FROM orders 
                GROUP BY month_num 
                ORDER BY month_num ASC`, [], (err, monthlySales) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Map month number to names for cleaner charts
            const monthNames = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" };
            analytics.monthlySales = (monthlySales || []).map(m => ({
                month: monthNames[m.month_num] || m.month_num,
                sales: m.sales
            }));
            
            // 3. Top products
            db.all(`SELECT p.name, SUM(oi.quantity) as quantity 
                    FROM order_items oi 
                    JOIN products p ON oi.product_id = p.id 
                    GROUP BY oi.product_id 
                    ORDER BY quantity DESC LIMIT 5`, [], (err, topProducts) => {
                if (err) return res.status(500).json({ error: err.message });
                analytics.topProducts = topProducts || [];
                
                // Add overview counts
                db.get("SELECT COUNT(*) as sellers FROM users WHERE role = 'seller'", [], (err, sellerCount) => {
                    db.get("SELECT COUNT(*) as customers FROM users WHERE role = 'customer'", [], (err, customerCount) => {
                        db.get("SELECT COUNT(*) as products FROM products WHERE status = 'approved'", [], (err, productCount) => {
                            db.get("SELECT COUNT(*) as orders FROM orders", [], (err, orderCount) => {
                                analytics.stats = {
                                    sellers: sellerCount ? sellerCount.sellers : 0,
                                    customers: customerCount ? customerCount.customers : 0,
                                    products: productCount ? productCount.products : 0,
                                    orders: orderCount ? orderCount.orders : 0
                                };
                                res.json(analytics);
                            });
                        });
                    });
                });
            });
        });
    });
});

// --- SELLER ROUTES ---

// Get all products of a seller
app.get('/api/seller/products/list/:sellerId', (req, res) => {
    db.all("SELECT * FROM products WHERE seller_id = ? ORDER BY id DESC", [req.params.sellerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Apply for seller account
app.post('/api/seller/apply', (req, res) => {
    const { name, businessName, email, phone, gstNumber, address } = req.body; // Password removed
    db.run(`INSERT INTO sellers (seller_name, business_name, email, phone, gst_number, address, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [name, businessName, email, phone, gstNumber, address], function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Seller application submitted successfully.", id: this.lastID });
        });
});

// Check seller application status
app.post('/api/seller/status', (req, res) => {
    const { email } = req.body;
    db.get("SELECT * FROM sellers WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Application not found" });
        res.json({ status: row.status, seller: row });
    });
});

// Finalize seller registration
app.post('/api/seller/register', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM sellers WHERE email = ? AND status = 'approved'", [email], (err, seller) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!seller) return res.status(400).json({ error: "No approved application found for this email" });
        
        // Insert into users
        db.run("INSERT INTO users (name, mobile, email, password, role) VALUES (?, ?, ?, ?, 'seller')",
            [seller.seller_name, seller.phone, seller.email, password], function(err) {
                if (err) {
                    // Try to update existing user
                    db.run("UPDATE users SET role = 'seller', password = ? WHERE email = ?", [password, seller.email], (err2) => {
                        if (err2) return res.status(400).json({ error: err.message });
                        db.get("SELECT id FROM users WHERE email = ?", [seller.email], (err3, userRow) => {
                            const userId = userRow ? userRow.id : null;
                            db.run("UPDATE sellers SET user_id = ? WHERE id = ?", [userId, seller.id], () => {
                                res.json({ message: "Registration successful", user: { id: userId, name: seller.seller_name, email: seller.email, role: 'seller' } });
                            });
                        });
                    });
                } else {
                    const userId = this.lastID;
                    db.run("UPDATE sellers SET user_id = ? WHERE id = ?", [userId, seller.id], () => {
                        res.json({ message: "Registration successful", user: { id: userId, name: seller.seller_name, email: seller.email, role: 'seller' } });
                    });
                }
            });
    });
});

// Seller adds a product (needs admin approval)
app.post('/api/seller/products', (req, res) => {
    const { name, name_ta, name_te, description, price, image_url, category, sellerId, stock } = req.body;
    db.run(`INSERT INTO products (name, name_ta, name_te, description, price, image_url, rating, category, seller_id, status, stock)
            VALUES (?, ?, ?, ?, ?, ?, 5.0, ?, ?, 'pending', ?)`,
        [name, name_ta, name_te, description, price, image_url || 'https://placehold.co/400x400/1f2937/6366f1?text=📦', category, sellerId, stock || 10], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Product submitted for admin approval.", productId: this.lastID });
        });
});

// Seller updates product details and price (triggers fraud engine & price drop alert)
app.post('/api/seller/products/update', (req, res) => {
    const { productId, name, description, price, image_url, category, stock, sellerId } = req.body;
    
    // Retrieve original price for fraud detection
    db.get("SELECT price, seller_id, name FROM products WHERE id = ?", [productId], (err, product) => {
        if (err || !product) return res.status(404).json({ error: "Product not found" });
        
        // RBAC Check
        if (product.seller_id && product.seller_id !== Number(sellerId)) {
            // Check if user is admin as admin can modify anything
            db.get("SELECT role FROM users WHERE id = ?", [sellerId], (err, user) => {
                if (err || !user || user.role !== 'admin') {
                    return res.status(403).json({ error: "Access Denied: You do not own this product" });
                }
                proceedWithUpdate();
            });
        } else {
            proceedWithUpdate();
        }
        
        function proceedWithUpdate() {
            const oldPrice = product.price;
            const newPrice = Number(price);
            
            db.run(`UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ? WHERE id = ?`,
                [name, description, newPrice, image_url, category, stock, productId], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    // 1. Fraud Engine (detect abnormal price change > 50%)
                    const pctChange = Math.abs(newPrice - oldPrice) / oldPrice;
                    if (pctChange > 0.5) {
                        const message = `Abnormal price change of ${(pctChange * 100).toFixed(1)}% (from ₹${oldPrice} to ₹${newPrice}) for product: ${product.name}`;
                        db.run("INSERT INTO fraud_alerts (product_id, seller_id, old_price, new_price, percentage_change, message) VALUES (?, ?, ?, ?, ?, ?)",
                            [productId, product.seller_id, oldPrice, newPrice, pctChange, message]);
                    }
                    
                    // 2. Wishlist Price Drop Notification
                    if (newPrice < oldPrice) {
                        db.all("SELECT DISTINCT user_id FROM wishlist WHERE product_id = ?", [productId], (err, wlUsers) => {
                            if (!err && wlUsers) {
                                wlUsers.forEach(row => {
                                    const alertMsg = `Price dropped for your wishlisted item: ${product.name}! It is now ₹${newPrice.toLocaleString('en-IN')} (was ₹${oldPrice.toLocaleString('en-IN')})!`;
                                    db.run("INSERT INTO notifications (user_id, product_id, message) VALUES (?, ?, ?)",
                                        [row.user_id, productId, alertMsg]);
                                });
                            }
                        });
                    }
                    
                    res.json({ message: "Product updated successfully." });
                });
        }
    });
});

// Seller dashboard stats
app.get('/api/seller/dashboard/:sellerId', (req, res) => {
    const sellerId = req.params.sellerId;
    const stats = {};
    
    // Revenue & Orders count
    db.get(`SELECT SUM(oi.quantity * oi.price) as revenue, COUNT(DISTINCT oi.order_id) as orders_count 
            FROM order_items oi 
            WHERE oi.seller_id = ?`, [sellerId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.revenue = row ? (row.revenue || 0) : 0;
        stats.orders = row ? (row.orders_count || 0) : 0;
        
        // Product count
        db.get(`SELECT COUNT(*) as count FROM products WHERE seller_id = ?`, [sellerId], (err, pRow) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.products = pRow ? pRow.count : 0;
            
            // Low stock alerts
            db.all(`SELECT id, name, stock FROM products WHERE seller_id = ? AND stock <= 5 AND status = 'approved'`, [sellerId], (err, lowStock) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.lowStock = lowStock || [];
                res.json(stats);
            });
        });
    });
});

// Seller orders list
app.get('/api/seller/orders/:sellerId', (req, res) => {
    db.all(`SELECT oi.*, p.name as product_name, p.image_url, o.created_at, o.payment_method, u.name as customer_name 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            JOIN orders o ON oi.order_id = o.id 
            JOIN users u ON o.user_id = u.id 
            WHERE oi.seller_id = ? 
            ORDER BY o.created_at DESC`, [req.params.sellerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update order item tracking status
app.post('/api/seller/orders/status', (req, res) => {
    const { orderItemId, status } = req.body; // status: Ordered, Packed, Shipped, Delivered
    db.run("UPDATE order_items SET tracking_status = ? WHERE id = ?", [status, orderItemId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Order item tracking status updated." });
    });
});

// --- CUSTOMER TRACKING & COMPLAINT ROUTES ---

// Get customer orders with details
app.get('/api/customer/orders/:userId', (req, res) => {
    db.all(`SELECT oi.*, p.name as product_name, p.image_url, o.created_at, o.payment_method 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            JOIN orders o ON oi.order_id = o.id 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC`, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a complaint
app.post('/api/customer/complaints', (req, res) => {
    const { userId, orderId, subject, description } = req.body;
    db.run("INSERT INTO complaints (user_id, order_id, subject, description) VALUES (?, ?, ?, ?)",
        [userId, orderId, subject, description], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Complaint raised successfully.", complaintId: this.lastID });
        });
});

// Get customer complaints
app.get('/api/customer/complaints/:userId', (req, res) => {
    db.all("SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC", [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- NOTIFICATIONS ROUTES ---

// Get user notifications
app.get('/api/notifications/:userId', (req, res) => {
    db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Mark all as read
app.post('/api/notifications/read', (req, res) => {
    const { userId } = req.body;
    db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Notifications marked as read." });
    });
});

// Delete a single notification
app.post('/api/notifications/delete', (req, res) => {
    const { notificationId } = req.body;
    db.run("DELETE FROM notifications WHERE id = ?", [notificationId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Notification deleted." });
    });
});

// Start Server
// --- TTS PROXY ---
const https = require('https');
app.get('/api/tts', (req, res) => {
    const { text, lang } = req.query;
    if (!text || !lang) return res.status(400).send("Missing text or lang");
    
    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encodeURIComponent(text)}`;
    
    https.get(url, (googleRes) => {
        if (googleRes.statusCode !== 200) {
            return res.status(googleRes.statusCode).send("TTS Error");
        }
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');
        googleRes.pipe(res);
    }).on('error', (err) => {
        res.status(500).send(err.message);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
