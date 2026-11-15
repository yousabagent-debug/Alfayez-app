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
    
    // قراءة باسورد تعديل الكمية من localStorage (أو الافتراضي 1234)
    let qtyPass = localStorage.getItem('qtyEditPass') || '1234';

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>⚙️ إعدادات المدير</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderAdminPanel();">👥 إدارة الحسابات والموظفين</button>
            
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px; background-color: var(--accent); color: #000;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderPriceManager();">💰 إدارة الأسعار والشركات</button>
            
            <div class="input-group" style="margin-top:20px; border-top:1px solid var(--border); padding-top:15px;">
                <label>باسورد تعديل الكمية (للموظفين)</label>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="qtyPassInput" value="${qtyPass}" placeholder="مثال: 1234" style="margin-bottom:0;">
                    <button class="btn btn-primary" style="width:auto; padding:0 20px; margin:0;" onclick="saveQtyPass()">حفظ</button>
                </div>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">الموظف هيحتاج الباسورد ده عشان يعدل كمية أي صنف.</p>
            </div>
            
            <button class="btn btn-outline" style="margin-top:20px; color:var(--danger); border-color:var(--danger);" onclick="signOut()">🚪 تسجيل الخروج</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function saveQtyPass() {
    const newPass = document.getElementById('qtyPassInput').value.trim();
    if (!newPass) return alert('اكتب باسورد صحيح');
    localStorage.setItem('qtyEditPass', newPass);
    alert('تم حفظ باسورد تعديل الكمية بنجاح!');
}

function logout() {
    signOut();
}
