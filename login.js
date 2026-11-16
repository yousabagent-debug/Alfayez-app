// ==== شاشة تسجيل الدخول ====
function renderLoginScreen() {
    $('#main-header').style.display = 'none';
    $('#bottom-nav').classList.add('hidden');
    document.body.style.background = 'linear-gradient(135deg, #0c2b21 0%, #1a4033 100%)';

    const currentLang = localStorage.getItem('appLang') || 'ar';

    $('#main-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height: 85vh; text-align:center; padding:20px; position:relative; overflow:hidden;">
            <div style="position:absolute; top:-50px; right:-50px; width:150px; height:150px; background:rgba(255,255,255,0.05); border-radius:50%;"></div>
            <div style="position:absolute; bottom:-30px; left:-30px; width:100px; height:100px; background:rgba(255,255,255,0.05); border-radius:50%;"></div>

            <div style="background: #fff; padding: 30px 20px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 100%; max-width: 350px; position:relative; z-index:1;">
                <img src="logo.jpg" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid #f3f4f6; margin-bottom:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #0c2b21; font-size: 1.6rem; margin-bottom: 5px; font-weight: 800;">${t('appName')}</h2>
                <p style="color: #8e8e93; font-size: 0.9rem; margin-bottom: 20px;">${t('loginSubtitle')}</p>

                <!-- اختيار اللغة -->
                <div style="margin-bottom: 20px;">
                    <select id="loginLangSelect" onchange="changeLoginLanguage(this.value)" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:10px; font-size:0.9rem; text-align:center; background:#f9f9f9;">
                        <option value="ar" ${currentLang === 'ar' ? 'selected' : ''}>🌐 العربية</option>
                        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🌐 English</option>
                        <option value="de" ${currentLang === 'de' ? 'selected' : ''}>🌐 Deutsch</option>
                        <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🌐 Français</option>
                        <option value="ko" ${currentLang === 'ko' ? 'selected' : ''}>🌐 한국어</option>
                        <option value="zh" ${currentLang === 'zh' ? 'selected' : ''}>🌐 中文</option>
                    </select>
                </div>

                <button class="btn" style="background: #fff; color: #333; border: 1px solid #ddd; display:flex; justify-content:center; gap:10px; align-items:center; padding:14px; font-size:1rem; font-weight: 700; border-radius:12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);" onclick="signInWithGoogle()">
                    ${t('loginButton')}
                </button>
                <div style="margin-top: 25px; font-size: 0.8rem; color: #aaa;">
                    ${t('appName')} - v1.0
                </div>
            </div>
        </div>
    `;
}

function changeLoginLanguage(lang) {
    localStorage.setItem('appLang', lang);
    renderLoginScreen(); // نعيد رسم الشاشة عشان الترجمة تتطبق
}
