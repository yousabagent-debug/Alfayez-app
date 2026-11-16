// ==== شاشة إعدادات الموظف ====
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
            <h2>⚙️ الإعدادات</h2>
        </div>

        <!-- اللغة -->
        <div class="card">
            <label>🌐 اللغة</label>
            <select id="langSelect" onchange="changeLanguage(this.value)">
                <option value="ar" ${currentLang === 'ar' ? 'selected' : ''}>العربية</option>
                <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                <option value="de" ${currentLang === 'de' ? 'selected' : ''}>Deutsch</option>
                <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
                <option value="ko" ${currentLang === 'ko' ? 'selected' : ''}>한국어</option>
                <option value="zh" ${currentLang === 'zh' ? 'selected' : ''}>中文</option>
            </select>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">سيتم تطبيق الترجمة الفعلية في التحديثات القادمة.</p>
        </div>

        <!-- الوضع الداكن -->
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="margin:0 0 5px;">🌙 الوضع الداكن</h4>
                <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">تغيير ألوان التطبيق</p>
            </div>
            <button class="btn ${isDark ? 'btn-primary' : 'btn-outline'}" style="width:auto; padding:8px 20px; margin:0;" onclick="toggleDarkMode(this)">
                ${isDark ? 'مفعّل' : 'متوقف'}
            </button>
        </div>

        <!-- التحديث -->
        <button class="btn btn-outline" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px;" onclick="location.reload(true)">
            🔄 تحديث التطبيق
        </button>

        <!-- تسجيل الخروج -->
        <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger); display:flex; justify-content:center; gap:10px;" onclick="signOut()">
            🚪 تسجيل الخروج
        </button>
    `;
    
    renderBottomNav('employee-settings');
}

function changeLanguage(lang) {
    localStorage.setItem('appLang', lang);
    alert('تم حفظ اللغة. سيتم تطبيق الترجمة في التحديث القادم.');
}

function toggleDarkMode(btn) {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    btn.innerText = isDark ? 'مفعّل' : 'متوقف';
    btn.classList.toggle('btn-primary', isDark);
    btn.classList.toggle('btn-outline', !isDark);
}

window.addEventListener('load', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});
