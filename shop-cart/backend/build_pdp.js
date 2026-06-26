const fs = require('fs');
const path = require('path');

const productsHtmlPath = path.join(__dirname, '..', 'frontend', 'products.html');
const targetHtmlPath = path.join(__dirname, '..', 'frontend', 'product_details.html');

let productsContent = fs.readFileSync(productsHtmlPath, 'utf8');

// Extract everything from <head> to the end of <style>
const headStart = productsContent.indexOf('<head>');
const styleEnd = productsContent.indexOf('</style>') + 8;
const headAndStyles = productsContent.substring(headStart, styleEnd);

// Extract Header
const headerStart = productsContent.indexOf('<header class="main-header">');
const headerEnd = productsContent.indexOf('</header>') + 9;
const headerContent = productsContent.substring(headerStart, headerEnd);

// Extract Sub Header
const subHeaderStart = productsContent.indexOf('<div class="sub-header">');
const subHeaderEnd = productsContent.indexOf('</div>', subHeaderStart) + 6;
const subHeaderContent = productsContent.substring(subHeaderStart, subHeaderEnd);

// Specific Product Details CSS
const productDetailsCss = `
    <style>
        /* ===== PRODUCT DETAILS 3-COLUMN LAYOUT ===== */
        .pd-main {
            max-width: 1500px;
            margin: 0 auto;
            padding: 20px;
            width: 100%;
        }
        .pd-breadcrumb {
            font-size: 13px;
            color: #565959;
            margin-bottom: 20px;
        }
        .pd-breadcrumb span { margin: 0 5px; }
        .pd-breadcrumb a { color: #565959; text-decoration: none; }
        .pd-breadcrumb a:hover { text-decoration: underline; }
        
        .pd-grid {
            display: grid;
            grid-template-columns: minmax(300px, 450px) minmax(400px, 1fr) 300px;
            gap: 30px;
            align-items: start;
        }

        /* LEFT COLUMN: IMAGES */
        .pd-image-col {
            position: sticky;
            top: 100px;
        }
        .pd-main-img-wrap {
            border: 1px solid #e7e7e7;
            border-radius: 4px;
            padding: 20px;
            text-align: center;
            background: #fff;
            height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
        }
        body.theme-dark .pd-main-img-wrap { background: #1e1e1e; border-color: #333; }
        body.theme-blue .pd-main-img-wrap { background: #eff6ff; border-color: #a5b4fc; }
        
        .pd-main-img-wrap img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .pd-thumbnails {
            display: flex;
            gap: 10px;
        }
        .pd-thumb {
            width: 50px;
            height: 50px;
            border: 1px solid #007185;
            border-radius: 4px;
            padding: 4px;
            background: #fff;
            cursor: pointer;
        }
        body.theme-dark .pd-thumb { background: #1e1e1e; border-color: #007185; }

        /* MIDDLE COLUMN: INFO */
        .pd-info-col {
            color: #0f1111;
        }
        body.theme-dark .pd-info-col { color: #e0e0e0; }
        body.theme-blue .pd-info-col { color: #0f1111; }
        
        .pd-brand-link { color: #007185; font-size: 14px; text-decoration: none; font-weight: 500; }
        .pd-brand-link:hover { text-decoration: underline; color: #c7511f; }
        
        .pd-title { font-size: 24px; font-weight: 400; margin: 8px 0; line-height: 1.3; }
        .pd-rating-wrap { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #007185; padding-bottom: 15px; border-bottom: 1px solid #e7e7e7; margin-bottom: 15px; }
        body.theme-dark .pd-rating-wrap { border-color: #333; }
        .pd-stars { color: #fbbf24; font-size: 16px; }

        .pd-price-block { margin-bottom: 20px; }
        .pd-price-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
        .pd-price-label { font-size: 14px; color: #565959; margin-top: 6px; }
        .pd-price-big { font-size: 28px; font-weight: 600; color: #B12704; }
        body.theme-dark .pd-price-big { color: #ff8a65; }
        
        .pd-mrp-row { font-size: 14px; color: #565959; display: flex; gap: 15px; align-items: center; margin-bottom: 8px; }
        .pd-mrp-strike { text-decoration: line-through; }
        .pd-save-badge { color: #B12704; font-weight: 500; border: 1px solid #B12704; padding: 2px 6px; border-radius: 2px; font-size: 12px; }
        body.theme-dark .pd-save-badge { color: #ff8a65; border-color: #ff8a65; }
        
        .pd-emi { font-size: 14px; color: #007185; font-weight: 500; }
        
        .pd-offers-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .pd-offers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; }
        .pd-offer-card { border: 1px solid #e7e7e7; border-radius: 8px; padding: 12px; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        body.theme-dark .pd-offer-card { border-color: #333; background: #1e1e1e; }
        body.theme-blue .pd-offer-card { border-color: #a5b4fc; background: #eff6ff; }
        .pd-offer-card strong { display: block; color: #007185; margin-bottom: 4px; font-size: 13px; }
        
        .pd-trust-strip { display: flex; gap: 20px; justify-content: space-between; border-top: 1px solid #e7e7e7; padding-top: 20px; text-align: center; font-size: 12px; color: #007185; font-weight: 500; margin-bottom: 30px;}
        body.theme-dark .pd-trust-strip { border-color: #333; }
        .pd-trust-item { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 60px; }
        .pd-trust-icon { font-size: 24px; background: #f0f2f2; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        body.theme-dark .pd-trust-icon { background: #2a2a2a; }

        .pd-desc-block { border-top: 1px solid #e7e7e7; padding-top: 20px; font-size: 14px; line-height: 1.6; }
        body.theme-dark .pd-desc-block { border-color: #333; }
        .pd-desc-block h4 { margin-bottom: 10px; font-size: 16px; font-weight: 700; }

        /* RIGHT COLUMN: BUY BOX */
        .pd-buy-box {
            border: 1px solid #d5d9d9;
            border-radius: 8px;
            padding: 18px;
            background: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        body.theme-dark .pd-buy-box { background: #1e1e1e; border-color: #333; }
        body.theme-blue .pd-buy-box { background: #c7d2fe; border-color: #a5b4fc; }

        .pd-buy-price { font-size: 28px; font-weight: 700; color: #0f1111; margin-bottom: 10px; }
        body.theme-dark .pd-buy-price { color: #e0e0e0; }
        .pd-buy-free { color: #007600; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
        body.theme-dark .pd-buy-free { color: #2e7d32; }
        .pd-buy-delivery { font-size: 14px; font-weight: 700; color: #0f1111; margin-bottom: 15px; }
        body.theme-dark .pd-buy-delivery { color: #e0e0e0; }
        
        .pd-pincode-wrap { display: flex; gap: 5px; margin-bottom: 20px; }
        .pd-pincode-wrap input { flex: 1; padding: 6px 10px; border: 1px solid #888; border-radius: 4px; font-size: 13px; background: transparent; color: inherit; }
        .pd-pincode-wrap button { background: #f0f2f2; border: 1px solid #d5d9d9; border-radius: 4px; padding: 0 12px; cursor: pointer; font-size: 12px; font-weight: 500; color: #0f1111; }
        body.theme-dark .pd-pincode-wrap button { background: #333; border-color: #555; color: #e0e0e0; }

        .pd-buy-stock { color: #007600; font-size: 18px; font-weight: 500; margin-bottom: 15px; }
        body.theme-dark .pd-buy-stock { color: #4caf50; }
        
        .pd-qty-wrap { display: flex; align-items: center; gap: 10px; font-size: 14px; margin-bottom: 20px; }
        .pd-qty-wrap select { padding: 4px; border-radius: 4px; border: 1px solid #d5d9d9; background: transparent; color: inherit; }
        
        .pd-btn-cart, .pd-btn-buy, .pd-btn-wishlist {
            width: 100%;
            border-radius: 20px;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            border: none;
            cursor: pointer;
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .pd-btn-cart { background: #ffd814; color: #0f1111; border: 1px solid #fcd200; }
        .pd-btn-cart:hover { background: #f7ca00; }
        .pd-btn-buy { background: #ffa41c; color: #0f1111; border: 1px solid #ff8f00; }
        .pd-btn-buy:hover { background: #fa8900; }
        
        .pd-btn-wishlist { background: transparent; border: 1px solid #d5d9d9; color: #0f1111; }
        body.theme-dark .pd-btn-wishlist { color: #e0e0e0; border-color: #555; }
        
        .pd-buy-secure { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #007185; margin-top: 15px; font-weight: 500;}
        .pd-buy-ships { font-size: 12px; color: #565959; margin-top: 10px; }

        /* MEDIA QUERIES */
        @media (max-width: 1000px) {
            .pd-grid { grid-template-columns: 1fr; }
            .pd-image-col { position: relative; top: 0; }
            .pd-buy-box { order: -1; margin-bottom: 20px; }
        }
    </style>
</head>
<body class="">

${headerContent}
${subHeaderContent}

    <!-- MAIN PRODUCT DETAILS -->
    <main class="pd-main">
        
        <div class="pd-breadcrumb">
            <a href="products.html" data-i18n="home_crumb">Home</a> <span>›</span>
            <a href="#" id="crumbCat">Category</a> <span>›</span>
            <span id="crumbBrand" style="color: #0f1111; font-weight: 500;">ShopCart</span> <span>›</span>
            <span id="crumbTitle">Product Title</span>
        </div>

        <div class="pd-grid">
            <!-- LEFT: IMAGES -->
            <div class="pd-image-col">
                <div class="pd-main-img-wrap">
                    <img id="pImg" src="https://placehold.co/400" alt="Product">
                </div>
                <div class="pd-thumbnails">
                    <div class="pd-thumb"><img id="pThumb" src="https://placehold.co/50" style="width:100%;height:100%;object-fit:contain;"></div>
                </div>
            </div>

            <!-- MIDDLE: INFO -->
            <div class="pd-info-col">
                <a href="#" class="pd-brand-link">Visit the ShopCart Store</a>
                <h1 class="pd-title" id="pName">Loading Product...</h1>
                
                <div class="pd-rating-wrap">
                    <div class="pd-stars" id="pStars">⭐⭐⭐⭐⭐</div>
                    <span id="pRatingText">4.0 | 0 ratings</span>
                </div>

                <div class="pd-price-block">
                    <div class="pd-price-row">
                        <span class="pd-price-label">Price:</span>
                        <span class="pd-price-big" id="pPrice">₹0</span>
                    </div>
                    <div class="pd-mrp-row">
                        <span>M.R.P.: <span class="pd-mrp-strike" id="pMrp">₹0</span></span>
                        <span class="pd-save-badge" id="pSave">Save ₹0 (0%)</span>
                    </div>
                    <div class="pd-emi">No Cost EMI available on select cards. <a href="#" style="color:#007185;">Details</a></div>
                </div>

                <div class="pd-offers-title">Applicable Offers</div>
                <div class="pd-offers-grid">
                    <div class="pd-offer-card">
                        <strong>💳 Bank Offer</strong>
                        10% instant discount on HDFC Bank Credit & Debit Cards on a min spend of ₹5,000.
                    </div>
                    <div class="pd-offer-card">
                        <strong>💰 Cashback</strong>
                        5% cashback with ShopCart Pay on purchases ≥ ₹5,000. No min order value.
                    </div>
                    <div class="pd-offer-card">
                        <strong>📦 Prime</strong>
                        Free delivery on first order when you shop with ShopCart Prime account.
                    </div>
                    <div class="pd-offer-card">
                        <strong>🎁 Combo Offer</strong>
                        Buy 2 Get 1 Free offer valid on select items — add to cart & save more!
                    </div>
                </div>

                <div class="pd-trust-strip">
                    <div class="pd-trust-item">
                        <div class="pd-trust-icon">🔄</div>
                        10-day Returns
                    </div>
                    <div class="pd-trust-item">
                        <div class="pd-trust-icon">🛡️</div>
                        1 Year Warranty
                    </div>
                    <div class="pd-trust-item">
                        <div class="pd-trust-icon">🚀</div>
                        Fast Delivery
                    </div>
                    <div class="pd-trust-item">
                        <div class="pd-trust-icon">✅</div>
                        100% Genuine
                    </div>
                    <div class="pd-trust-item">
                        <div class="pd-trust-icon">📞</div>
                        24/7 Support
                    </div>
                </div>

                <div class="pd-desc-block">
                    <h4>Product Details</h4>
                    <div id="pDesc">Loading description...</div>
                </div>
            </div>

            <!-- RIGHT: BUY BOX -->
            <div class="pd-buy-box">
                <div class="pd-buy-price" id="pBuyPrice">₹0</div>
                <div class="pd-buy-free">FREE Delivery</div>
                <div class="pd-buy-delivery">Delivery by Tomorrow, Sunday</div>
                <div style="font-size: 13px; color: #007185; margin-bottom: 15px;">📍 Delivering to Customer</div>
                
                <div class="pd-pincode-wrap">
                    <input type="text" placeholder="Enter 6-digit Pincode">
                    <button>Check</button>
                </div>

                <div class="pd-buy-stock">In Stock</div>
                
                <div class="pd-qty-wrap">
                    Qty: 
                    <select id="pQty">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>

                <button class="pd-btn-cart" onclick="addToCart()" data-i18n="add_to_cart">Add to Cart</button>
                <button class="pd-btn-buy" onclick="addToCart()" data-i18n="checkout">Buy Now</button>
                
                <div style="text-align: center; margin: 15px 0;">
                    <hr style="border:0; border-top: 1px solid #d5d9d9;">
                </div>
                
                <button class="pd-btn-wishlist" onclick="addToWishlist()">❤️ Add to Wish List</button>

                <div class="pd-buy-secure">🔒 Secure transaction</div>
                <div class="pd-buy-ships">Ships from ShopCart India</div>
            </div>
        </div>

    </main>
    
    <!-- Notification Tray Element inside page -->
    <div id="notiTray" class="notiTray" style="display:none; position:absolute; top:70px; right:20px; width:320px; background:white; border:1px solid #ddd; padding:16px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:2000;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="font-size:16px; margin:0;">Notifications</h3>
            <span style="font-size:12px; color:#ff9900; cursor:pointer;" onclick="markAllNotificationsRead()">Mark all as read</span>
        </div>
        <div id="notiList" style="display:flex; flex-direction:column; gap:10px; max-height:300px; overflow-y:auto;">
        </div>
    </div>
    
    <div id="voice-fab" class="fab-voice" style="display:none;">🎤</div>

    <script src="js/api.js"></script>
    <script src="js/translations.js"></script>
    <script src="js/voice.js"></script>
    <script>
        let currentProductId = null;
        let allProducts = [];

        document.addEventListener('DOMContentLoaded', async () => {
            // Apply Theme
            const savedTheme = localStorage.getItem('user_theme') || 'light';
            const themeSelect = document.getElementById('themeSelectHeader');
            if (themeSelect) themeSelect.value = savedTheme;
            if (savedTheme !== 'light') document.body.classList.add('theme-' + savedTheme);

            const urlParams = new URLSearchParams(window.location.search);
            currentProductId = urlParams.get('id');
            
            if (!currentProductId) window.location.href = 'products.html';

            try {
                const p = await api.get('/products/' + currentProductId);
                renderProductDetails(p);
            } catch (err) {
                alert("Product not found");
                window.location.href = 'products.html';
            }
        });

        function renderProductDetails(p) {
            document.getElementById('pImg').src = p.image_url;
            document.getElementById('pImg').onerror = function() { this.src = 'https://placehold.co/400?text=📦'; };
            document.getElementById('pThumb').src = p.image_url;
            
            const translatedName = getProductTranslatedName(p);
            document.getElementById('pName').innerText = translatedName;
            
            document.getElementById('crumbCat').innerText = p.category;
            document.getElementById('crumbTitle').innerText = translatedName;
            
            const starsHtml = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
            document.getElementById('pStars').innerText = starsHtml;
            document.getElementById('pRatingText').innerText = p.rating + " | " + (Math.floor(p.rating * 12) + 20) + " ratings";
            
            const priceStr = p.price.toLocaleString('en-IN');
            document.getElementById('pPrice').innerText = '₹' + priceStr;
            document.getElementById('pBuyPrice').innerText = '₹' + priceStr;
            
            // Calculate fake MRP and discount
            const discountPercent = 10 + (p.id % 5) * 8;
            const originalPrice = Math.round(p.price / (1 - discountPercent / 100));
            document.getElementById('pMrp').innerText = '₹' + originalPrice.toLocaleString('en-IN');
            document.getElementById('pSave').innerText = 'Save ₹' + (originalPrice - p.price).toLocaleString('en-IN') + ' (' + discountPercent + '%)';
            
            document.getElementById('pDesc').innerText = p.description;

            // Voice readout
            const voiceText = getTranslatedText('voice_product_chosen', translatedName, p.rating, p.price);
            // No setTimeout! Speak synchronously after DOM update!
            if (typeof speak === 'function') speak(voiceText);
        }

        async function addToCart() {
            const user = getUser();
            const qty = parseInt(document.getElementById('pQty').value) || 1;
            if (!user) { alert("Please login first"); window.location.href='index.html'; return; }
            try {
                await api.post('/cart', { userId: user.id, productId: currentProductId, quantity: qty });
                if (typeof speak === 'function') speak(getTranslatedText('add_to_cart') + " Successful");
                window.location.href = 'cart.html';
            } catch (err) { console.error(err); }
        }

        async function addToWishlist() {
            const user = getUser();
            if (!user) { alert("Please login first"); window.location.href='index.html'; return; }
            try {
                await api.post('/wishlist', { userId: user.id, productId: currentProductId });
                if (typeof speak === 'function') speak(getTranslatedText('wishlist') + " Saved");
                alert("Saved to wishlist");
            } catch (err) { console.error(err); }
        }

        /* Language Theme & Header Logic imported from products.html */
        async function changeTempLang(lang) {
            localStorage.setItem('temp_lang', lang);
            const voiceText = (translations[lang] && translations[lang]['language_changed']) || translations['en']['language_changed'];
            if (typeof speak === 'function') speak(voiceText);
            const user = getUser();
            if (user) {
                user.language = lang;
                localStorage.setItem('user', JSON.stringify(user));
                try { await api.post('/user/language', { userId: user.id, language: lang }); } catch(e) {}
            }
            applyTranslations();
            // Re-render product info with new language
            try {
                const p = await api.get('/products/' + currentProductId);
                renderProductDetails(p);
            } catch(e) {}
        }

        function changeTheme(theme) {
            document.body.classList.remove('theme-light', 'theme-dark', 'theme-blue');
            if (theme !== 'light') document.body.classList.add('theme-' + theme);
            localStorage.setItem('user_theme', theme);
        }
        
        // Stubs for header functions that products.html expects
        function filterByCategoryDropdown(cat) { window.location.href='products.html'; }
        function filterBySearchTerm(term) { window.location.href='products.html'; }
        function filterProducts() { window.location.href='products.html'; }
    </script>
</body>
</html>`;

const finalContent = "<!DOCTYPE html>\n<html lang=\"en\">\n" + headAndStyles + productDetailsCss;

fs.writeFileSync(targetHtmlPath, finalContent, 'utf8');
console.log('Successfully generated complete product_details.html');
