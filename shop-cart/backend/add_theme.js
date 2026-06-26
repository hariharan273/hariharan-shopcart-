const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'frontend', 'products.html');
let content = fs.readFileSync(htmlPath, 'utf8');

const themeCss = `
        /* ===== THEMES ===== */
        body.theme-dark {
            background: #121212;
            color: #e0e0e0;
        }
        body.theme-dark .main-header { background: #000000; }
        body.theme-dark .sub-header, body.theme-dark .bottom-nav-wrap { background: #111111; }
        body.theme-dark .category-grid-card, body.theme-dark .slider-section, body.theme-dark .slider-product-card, body.theme-dark .results-section, body.theme-dark .grid-product-card, body.theme-dark .notiTray {
            background: #1e1e1e;
            border-color: #333;
            box-shadow: none;
        }
        body.theme-dark .grid-card-name, body.theme-dark .slider-card-name, body.theme-dark .category-grid-card h3, body.theme-dark .slider-section-header h3, body.theme-dark .price-line, body.theme-dark .grid-price-now, body.theme-dark .subgrid-item label {
            color: #e0e0e0;
        }
        body.theme-dark .subgrid-item .img-box, body.theme-dark .slider-img-wrap, body.theme-dark .grid-img-wrap {
            background: #2a2a2a;
        }
        body.theme-dark .search-container-wrap { border-color: #555; background: #333; }
        body.theme-dark #searchInput { background: #333; color: #fff; }
        body.theme-dark .search-cat-dropdown { background: #444; color: #fff; border-right: 1px solid #555; }
        
        body.theme-blue {
            background: #eef2f6;
        }
        body.theme-blue .main-header { background: #1e3a8a; }
        body.theme-blue .sub-header, body.theme-blue .bottom-nav-wrap { background: #1e40af; }
        body.theme-blue .search-submit-btn { background: #3b82f6; color: white; }
        body.theme-blue .search-submit-btn:hover { background: #2563eb; }
        body.theme-blue .fab-voice { background: #3b82f6; }
        
        #themeSelectHeader {
            background: transparent;
            color: white;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            outline: none;
            cursor: pointer;
            margin-right: 10px;
        }
        #themeSelectHeader option {
            background: #131921;
            color: white;
        }
    </style>`;

// 1. Inject CSS before </style>
content = content.replace('    </style>', themeCss);

const themeDropdown = `
            <!-- Theme Header Select -->
            <select id="themeSelectHeader" onchange="changeTheme(this.value)">
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="blue">Blue Theme</option>
            </select>
            
            <!-- Language Header Select -->`;

// 2. Inject dropdown before Language Header Select
content = content.replace('<!-- Language Header Select -->', themeDropdown);

const themeScript = `
        /* Theme Logic */
        function changeTheme(theme) {
            document.body.classList.remove('theme-light', 'theme-dark', 'theme-blue');
            if (theme !== 'light') {
                document.body.classList.add('theme-' + theme);
            }
            localStorage.setItem('user_theme', theme);
            const themeVoiceMap = {
                en: 'Theme changed',
                ta: 'தீம் மாற்றப்பட்டது',
                te: 'థీమ్ మార్చబడింది'
            };
            const lang = localStorage.getItem('temp_lang') || 'en';
            const msg = themeVoiceMap[lang] || themeVoiceMap.en;
            showToast('🎨 ' + msg);
            setTimeout(() => { if (typeof speak === 'function') speak(msg); }, 300);
        }

        // Apply theme on load
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('user_theme') || 'light';
            const themeSelect = document.getElementById('themeSelectHeader');
            if (themeSelect) themeSelect.value = savedTheme;
            if (savedTheme !== 'light') {
                document.body.classList.add('theme-' + savedTheme);
            }
        });
    </script>`;

// 3. Inject JS before </script>
content = content.replace('    </script>', themeScript);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Successfully patched products.html with Theme support!');
