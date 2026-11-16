// ==== إعدادات الموظف ====
async function renderEmployeeSettings() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const currentLang = localStorage.getItem('appLang') || 'ar';
    const isDark = localStorage.getItem('darkMode') === 'true';

    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>${getTrans('settings')}</h2>
        </div>

        <!-- اللغة -->
        <div class="card">
            <label>🌐 ${getTrans('language')}</label>
            <select id="langSelect" onchange="changeLanguage(this.value)">
                <option value="ar" ${currentLang === 'ar' ? 'selected' : ''}>العربية</option>
                <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                <option value="de" ${currentLang === 'de' ? 'selected' : ''}>Deutsch</option>
                <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
                <option value="ko" ${currentLang === 'ko' ? 'selected' : ''}>한국어</option>
                <option value="zh" ${currentLang === 'zh' ? 'selected' : ''}>中文</option>
            </select>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">${getTrans('langNote')}</p>
        </div>

        <!-- الوضع الداكن -->
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="margin:0 0 5px;">🌙 ${getTrans('darkMode')}</h4>
                <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">${getTrans('darkModeDesc')}</p>
            </div>
            <button class="btn ${isDark ? 'btn-primary' : 'btn-outline'}" style="width:auto; padding:8px 20px; margin:0;" onclick="toggleDarkMode(this)">
                ${isDark ? getTrans('on') : getTrans('off')}
            </button>
        </div>

        <!-- التحديث -->
        <button class="btn btn-outline" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px;" onclick="location.reload(true)">
            🔄 ${getTrans('refresh')}
        </button>

        <!-- تسجيل الخروج -->
        <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger); display:flex; justify-content:center; gap:10px;" onclick="signOut()">
            🚪 ${getTrans('logout')}
        </button>
    `;
    
    renderBottomNav('employee-settings');
}

// ترجمة بسيطة
function getTrans(key) {
    const lang = localStorage.getItem('appLang') || 'ar';
    const trans = {
        ar: { settings: '⚙️ الإعدادات', language: 'اللغة', langNote: 'سيتم تطبيق الترجمة الفعلية في التحديثات القادمة.', darkMode: 'الوضع الداكن', darkModeDesc: 'تغيير ألوان التطبيق', on: 'مفعّل', off: 'متوقف', refresh: 'تحديث التطبيق', logout: 'تسجيل الخروج' },
        en: { settings: '⚙️ Settings', language: 'Language', langNote: 'Full translation coming soon.', darkMode: 'Dark Mode', darkModeDesc: 'Change app colors', on: 'On', off: 'Off', refresh: 'Refresh App', logout: 'Logout' },
        de: { settings: '⚙️ Einstellungen', language: 'Sprache', langNote: 'Übersetzung folgt in Kürze.', darkMode: 'Dunkelmodus', darkModeDesc: 'App-Farben ändern', on: 'An', off: 'Aus', refresh: 'App aktualisieren', logout: 'Abmelden' },
        fr: { settings: '⚙️ Paramètres', language: 'Langue', langNote: 'Traduction à venir.', darkMode: 'Mode sombre', darkModeDesc: 'Changer les couleurs', on: 'Activé', off: 'Désactivé', refresh: 'Actualiser', logout: 'Déconnexion' },
        ko: { settings: '⚙️ 설정', language: '언어', langNote: '번역이 곧 제공됩니다.', darkMode: '다크 모드', darkModeDesc: '색상 변경', on: '켜짐', off: '꺼짐', refresh: '새로 고침', logout: '로그아웃' },
        zh: { settings: '⚙️ 设置', language: '语言', langNote: '翻译即将推出。', darkMode: '深色模式', darkModeDesc: '更改颜色', on: '开启', off: '关闭', refresh: '刷新', logout: '登出' }
    };
    return trans[lang] ? trans[lang][key] : trans['ar'][key];
}

function changeLanguage(lang) {
    localStorage.setItem('appLang', lang);
    renderEmployeeSettings(); // نعيد رسم الشاشة عشان الترجمة تتطبق
}

function toggleDarkMode(btn) {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    btn.innerText = isDark ? getTrans('on') : getTrans('off');
    btn.classList.toggle('btn-primary', isDark);
    btn.classList.toggle('btn-outline', !isDark);
}

window.addEventListener('load', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});
