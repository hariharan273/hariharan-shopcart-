const translations = {
    en: {
        welcome: "Welcome to Quick Shopping",
        login_btn: "Login",
        register_btn: "Register",
        username: "Username / Mobile",
        password: "Password",
        name: "Full Name",
        mobile: "Mobile Number",
        email: "Email Address",
        products_title: "Our Products",
        add_to_cart: "Add to Cart",
        wishlist: "Wishlist",
        cart_title: "Your Cart",
        checkout: "Checkout",
        total: "Total Amount",
        voice_product_chosen: "You have chosen {0}. The rating is {1} stars. Price is {2} rupees.",
        voice_payment_chosen: "You have chosen {0}. Please enter your PIN once.",
        voice_payment_success: "Payment is successful. Order placed. It will be delivered soon.",
        voice_price_drop: "Price drop alert for {0}. {1}",
        search_placeholder: "Search products...",
        language_changed: "Language changed successfully to English"
    },
    ta: {
        welcome: "விரைவான ஷாப்பிங்கிற்கு வரவேற்கிறோம்",
        login_btn: "உள்நுழைய",
        register_btn: "பதிவு செய்",
        username: "பயனர்பெயர் / மொபைல்",
        password: "கடவுச்சொல்",
        name: "முழு பெயர்",
        mobile: "கைபேசி எண்",
        email: "மின்னஞ்சல் முகவரி",
        products_title: "எங்கள் தயாரிப்புகள்",
        add_to_cart: "கூடையில் சேர்",
        wishlist: "விருப்பப்பட்டியல்",
        cart_title: "உங்கள் கூடை",
        checkout: "வெளியேறு",
        total: "மொத்த தொகை",
        voice_product_chosen: "நீங்கள் {0} ஐ தேர்ந்தெடுத்துள்ளீர்கள். மதிப்பீடு {1} நட்சத்திரங்கள். விலை {2} ரூபாய்.",
        voice_payment_chosen: "நீங்கள் {0} ஐ தேர்ந்தெடுத்துள்ளீர்கள். தயவுசெய்து உங்கள் பின் எண்ணை ஒருமுறை உள்ளிடவும்.",
        voice_payment_success: "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது. ஆர்டர் பதிவு செய்யப்பட்டது.",
        voice_price_drop: "{0} இன் விலை குறைந்துள்ளது. {1}",
        search_placeholder: "பொருட்களை தேடுங்கள்...",
        language_changed: "மொழி வெற்றிகரமாக தமிழுக்கு மாற்றப்பட்டது"
    },
    te: {
        welcome: "క్విక్ షాపింగ్ కి స్వాగతం",
        login_btn: "లాగిన్",
        register_btn: "నమోదు చేయండి",
        username: "వినియోగదారు పేరు / మొబైల్",
        password: "పాస్వర్డ్",
        name: "పూర్తి పేరు",
        mobile: "మొబైల్ నంబర్",
        email: "ఇమెయిల్ చిరునామా",
        products_title: "మా ఉత్పత్తులు",
        add_to_cart: "కార్ట్‌కు జోడించు",
        wishlist: "కోరికల జాబితా",
        cart_title: "మీ కార్ట్",
        checkout: "చెక్అవుట్",
        total: "మొత్తం మొత్తం",
        voice_product_chosen: "మీరు {0} ని ఎంచుకున్నారు. రేటింగ్ {1} నక్షత్రాలు. ధర {2} రూపాయలు.",
        voice_payment_chosen: "మీరు {0} ని ఎంచుకున్నారు. దయచేసి మీ పిన్ ఒకసారి నమోదు చేయండి.",
        voice_payment_success: "చెల్లింపు విజయవంతమైంది. ఆర్డర్ చేయబడింది.",
        voice_price_drop: "{0} ధర తగ్గింది. {1}",
        search_placeholder: "ఉత్పత్తుల కోసం శోధించండి...",
        language_changed: "భాష విజయవంతంగా తెలుగుకు మార్చబడింది"
    }
};

/**
 * SINGLE SOURCE OF TRUTH: always use temp_lang.
 * - Login/Register pages force temp_lang = 'en' in <head> before any script loads.
 * - After login, temp_lang is synced from user.language so products page starts correctly.
 * - Any language dropdown change writes to temp_lang immediately.
 * - We NEVER read user.language here to avoid stale language from previous sessions.
 */
function getActiveLang() {
    return localStorage.getItem('temp_lang') || 'en';
}

function getProductTranslatedName(p) {
    if (!p) return '';
    const lang = getActiveLang();
    if (lang === 'ta' && p.name_ta) return p.name_ta;
    if (lang === 'te' && p.name_te) return p.name_te;
    return p.name;
}

function applyTranslations() {
    const lang = getActiveLang();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'submit') {
                el.value = translations[lang][key];
            } else if (el.tagName === 'INPUT') {
                el.placeholder = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });
}

function getTranslatedText(key, ...args) {
    const lang = getActiveLang();
    let text = (translations[lang] && translations[lang][key])
        ? translations[lang][key]
        : translations['en'][key];

    if (args.length > 0) {
        args.forEach((arg, index) => {
            text = text.replace(`{${index}}`, arg);
        });
    }
    return text;
}

// Apply translations as soon as DOM is ready
document.addEventListener('DOMContentLoaded', applyTranslations);
