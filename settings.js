async function openSettings() {
    if (!state.userProfile || state.userProfile.role !== 'admin') {
        return alert('هذه الصفحة للمدير فقط');
    }

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>باسورد المدير</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>أدخل باسورد المدير</label><input type="password" id="adminPassInput" placeholder="********"></div>
            <button class="btn-save" onclick="checkAdminPass(this)">دخول</button>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('adminPassInput').focus(), 100);
}

async function checkAdminPass(btn) {
    const pass = document.getElementById('adminPassInput').value;
    if (pass !== '1358') { document.getElementById('adminPassInput').style.borderColor = 'red'; return; }
    btn.closest('.bottom-sheet-overlay').remove();
    
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>⚙️ إعدادات المدير</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderAdminPanel();">👥 إدارة الحسابات والموظفين</button>
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px; background-color: var(--accent); color: #000;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderPriceManager();">💰 إدارة الأسعار والشركات</button>
            <button class="btn btn-outline" style="margin-bottom:10px; color:var(--danger); border-color:var(--danger);" onclick="signOut()">🚪 تسجيل الخروج</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function logout() {
    signOut();
}
