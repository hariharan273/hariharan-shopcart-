const langCodes = {
    'en': 'en-US',
    'ta': 'ta-IN',
    'te': 'te-IN'
};

/**
 * Get the current active language.
 * On login/register pages, temp_lang is always forced to 'en' first,
 * then updated by the user's dropdown choice.
 * On product pages, user.language takes priority.
 * We read temp_lang here so it always reflects the latest dropdown selection.
 */
function getCurrentLang() {
    return localStorage.getItem('temp_lang') || 'en';
}

/**
 * Speak text using the correct language voice.
 * Uses Google Translate TTS API for reliable Tamil/Telugu support across all OS,
 * with fallback to native SpeechSynthesis if needed.
 */
function speak(text) {
    if (!text) return;
    const lang = getCurrentLang();
    
    // Use our custom backend TTS proxy to completely bypass browser cross-origin audio blocking!
    const audioUrl = `http://localhost:3000/api/tts?lang=${lang}&text=${encodeURIComponent(text)}`;
    
    try {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => {
            console.warn("Audio play failed, falling back to native TTS:", e);
            fallbackNativeTTS(text, lang);
        });
    } catch(e) {
        fallbackNativeTTS(text, lang);
    }
}

function fallbackNativeTTS(text, lang) {
    if (!('speechSynthesis' in window)) return;
    
    const bcp47 = langCodes[lang] || 'en-US';
    window.speechSynthesis.cancel(); 

    function doSpeak() {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = bcp47;

        const voices = window.speechSynthesis.getVoices();
        const exactVoice = voices.find(v => v.lang === bcp47);
        const partialVoice = voices.find(v => v.lang.startsWith(lang));

        if (exactVoice) {
            utterance.voice = exactVoice;
        } else if (partialVoice) {
            utterance.voice = partialVoice;
        }

        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        doSpeak();
    } else {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            doSpeak();
        };
    }
}

function initVoiceAssistant(customAction = null) {
    const fab = document.getElementById('voice-fab');
    if (!fab) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        fab.addEventListener('click', () => {
            const lang = getCurrentLang();
            recognition.lang = langCodes[lang] || 'en-US';
            
            recognition.start();
            fab.classList.add('listening');
            speak(translations[lang]['welcome'] || "How can I help you?");
        });

        recognition.onresult = (event) => {
            fab.classList.remove('listening');
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Heard:", transcript);
            
            if (customAction) {
                customAction(transcript);
            } else {
                // Default global commands
                // Default global commands supporting English, Tamil, and Telugu
                if (transcript.includes('cart') || transcript.includes('கூடை') || transcript.includes('கார்ட்') || transcript.includes('కార్ట్') || transcript.includes('కూడ') || transcript.includes('బాస్కెట్')) {
                    window.location.href = 'cart.html';
                } else if (transcript.includes('wishlist') || transcript.includes('விருப்ப') || transcript.includes('கோரிக்கை') || transcript.includes('కోరిక') || transcript.includes('విష్లిస్ట్')) {
                    window.location.href = 'wishlist.html';
                }
            }
        };

        recognition.onerror = () => {
            fab.classList.remove('listening');
        };
        
        recognition.onend = () => {
            fab.classList.remove('listening');
        };
    } else {
        fab.style.display = 'none'; // Hide if not supported
    }
}
