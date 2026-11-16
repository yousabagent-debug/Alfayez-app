async function openSettings() {
    if (!state.userProfile || state.userProfile.role !== 'admin') {
        return alert(t('noResults'));
    }

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>${t('settings')}</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>${t('language')}</label><input type="password" id="adminPassInput" placeholder="********"></div>
            <button class="btn-save" onclick="checkAdminPass(this)">${t('confirm')}</button>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('adminPassInput').focus(), 100);
}

async function checkAdminPass(btn) {
    const pass = document.getElementById('adminPassInput').value;
    if (pass !== '1358') { document.getElementById('adminPassInput').style.borderColor = 'red'; return; }
    btn.closest('.bottom-sheet-overlay').remove();
    
    let qtyPass = localStorage.getItem('qtyEditPass') || '1234';

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>⚙️ ${t('settings')}</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderAdminPanel();">👥 إدارة حسابات الموظفين</button>
            
            <button class="btn btn-primary" style="margin-bottom:10px; display:flex; justify-content:center; gap:10px; background-color: var(--accent); color: #000;" onclick="this.closest('.bottom-sheet-overlay').remove(); renderPriceManager();">💰 ${t('goods')} & ${t('price')}</button>
            
            <div class="input-group" style="margin-top:20px; border-top:1px solid var(--border); padding-top:15px;">
                <label>${t('quantity')} Password</label>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="qtyPassInput" value="${qtyPass}" style="margin-bottom:0;">
                    <button class="btn btn-primary" style="width:auto; padding:0 20px; margin:0;" onclick="saveQtyPass()">${t('save')}</button>
                </div>
            </div>

            <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:15px;">
                <label>💾 ${t('save')} (Backup)</label>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-outline" style="flex:1; margin:0;" onclick="exportBackup()">📤 ${t('save')}</button>
                    <button class="btn btn-outline" style="flex:1; margin:0;" onclick="document.getElementById('importFile').click()">📥 ${t('add')}</button>
                    <input type="file" id="importFile" accept=".json" style="display:none;" onchange="importBackup(this)">
                </div>
            </div>
            
            <button class="btn btn-outline" style="margin-top:20px; color:var(--danger); border-color:var(--danger);" onclick="signOut()">🚪 ${t('logout')}</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function saveQtyPass() {
    const newPass = document.getElementById('qtyPassInput').value.trim();
    if (!newPass) return alert(t('fillAll'));
    localStorage.setItem('qtyEditPass', newPass);
    alert(t('save') + ' ✓');
}

async function exportBackup() {
    try {
        const backup = {
            branches: await getAll('branches'),
            companies: await getAll('companies'),
            items: await getAll('items'),
            additions: await getAll('additions'),
            shifts: await getAll('shifts'),
            expenses: await getAll('expenses'),
            activities: await getAll('activities'),
            report_emails: await getAll('report_emails'),
            settings: await getAll('settings'),
            profiles: await getAll('profiles'),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alfayez-backup-${getToday()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('تم تصدير النسخة الاحتياطية بنجاح!');
    } catch (e) {
        alert('خطأ في التصدير: ' + e.message);
    }
}

async function importBackup(input) {
    const file = input.files[0];
    if (!file) return;

    if (!confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            
            const stores = ['branches', 'companies', 'items', 'additions', 'shifts', 'expenses', 'activities', 'report_emails', 'settings', 'profiles'];
            
            for (let store of stores) {
                const all = await getAll(store);
                for (let item of all) {
                    await deleteItem(store, item.id);
                }
            }
            
            for (let store of stores) {
                if (backup[store] && Array.isArray(backup[store])) {
                    for (let item of backup[store]) {
                        const newItem = { ...item };
                        delete newItem.id;
                        await addItem(store, newItem);
                    }
                }
            }
            
            alert('تم استيراد النسخة الاحتياطية بنجاح! سيتم تحديث الصفحة.');
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            alert('خطأ في الاستيراد: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function logout() {
    signOut();
}
