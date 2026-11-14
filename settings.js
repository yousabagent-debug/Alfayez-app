// ==== زرار الإعدادات (للمدير فقط) ====
async function openSettings() {
    // التأكد إن المستخدم مدير
    if (!state.userProfile || state.userProfile.role !== 'admin') {
        return alert('هذه الصفحة للمدير فقط');
    }

    // طلب باسورد المدير
    const pass = prompt('أدخل باسورد المدير:');
    if (pass !== '1358') return alert('باسورد خطأ!');

    // عرض قائمة الإعدادات
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3>⚙️ إعدادات المدير</h3>
                <button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderAdminPanel();">
                👥 إدارة الحسابات والموظفين
            </button>
            
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px; background-color: var(--accent); color: #000;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderPriceManager();">
                💰 إدارة الأسعار
            </button>
            
            <button class="btn btn-outline" style="margin-bottom:10px; color:var(--danger); border-color:var(--danger);" onclick="signOut()">🚪 تسجيل الخروج</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ==== دالة تسجيل الخروج ====
function logout() {
    signOut();
}
