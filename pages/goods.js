// ==== شاشة البضاعة ====
async function renderGoods() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const companies = await getAll('companies');
    const items = await getAll('items');

    const isAdmin = state.userProfile && state.userProfile.role === 'admin';

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin:0;">البضاعة الموجودة</h2>
            <div style="display:flex; gap:8px; flex-wrap: wrap;">
                <button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openManageGoods()">إدارة البضاعة</button>
                <button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openAddBatchSheet()">+ إضافة بضاعة</button>
                ${isAdmin ? `<button class="btn btn-primary" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openAddCompanySheet()">+ شركة</button>` : ''}
            </div>
        </div>
        
        <div class="card card-primary">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.9rem; opacity:0.8;">إجمالي مبلغ البضاعة</div>
                <h2>${formatMoney(items.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0))} <span style="font-size:1rem;">جنيه</span></h2>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <span style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; font-size:0.8rem;">${items.length} صنف</span>
                    <span style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; font-size:0.8rem;">${companies.length} شركة</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom:10px; font-size:1.1rem;">البحث عن صنف</h3>
            <input type="text" placeholder="اسم الصنف أو الشركة..." onkeyup="searchItems(this.value)" style="margin-bottom:0; background:var(--bg-color);">
        </div>

        <div id="searchResults" class="hidden" style="margin-top: 15px;"></div>

        <h3 style="margin-top:25px; margin-bottom:15px;">الشركات</h3>
        <div id="companiesList">
            ${companies.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">لا يوجد شركات.</p>' : ''}
            ${companies.map(c => {
                const compItems = items.filter(i => i.company === c.name);
                const compValue = compItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);
                return `
                    <div class="branch-card" onclick="openCompany('${c.name}')">
                        <div class="right">
                            <div class="icon-box">${c.name.substring(0,2)}</div>
                            <div class="details">
                                <h3>${c.name}</h3>
                                <p>${compItems.length} صنف</p>
                            </div>
                        </div>
                        <div style="text-align:left; font-weight:800; color:var(--primary);">
                            ${formatMoney(compValue)}<br>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">قيمة البضاعة</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    renderBottomNav('goods');
}

// ==== البحث عن صنف ====
async function searchItems(query) {
    const resDiv = $('#searchResults');
    if (!query.trim()) { resDiv.classList.add('hidden'); return; }
    const items = await getAll('items');
    const searchTerm = query.trim().toLowerCase();
    const res = items.filter(i => i.name.toLowerCase().includes(searchTerm) || i.company.toLowerCase().includes(searchTerm));
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = res.length ? res.map(i => `
        <div class="card" style="padding:15px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><h3 style="font-size:1.1rem; margin-bottom:5px;">${i.name}</h3><span style="font-size:0.85rem; color:var(--text-muted);">${i.company}</span></div>
                <div style="text-align:left;"><div style="font-size:1.4rem; font-weight:800; color:var(--primary);">${i.qty || 0}</div><div style="font-size:0.75rem; color:var(--text-muted);">رصيد</div></div>
            </div>
        </div>
    `).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد نتائج</p>';
}

// ==== إضافة شركة (للمدير بس) ====
function openAddCompanySheet() {
    const isAdmin = state.userProfile && state.userProfile.role === 'admin';
    if (!isAdmin) return alert('هذه الصلاحية للمدير فقط');

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>شركة / مورد جديد</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>اسم الشركة</label><input type="text" id="newCompanyName" placeholder="مثال: التعاون"></div>
            <button class="btn-save" onclick="saveNewCompany(this)">حفظ الشركة</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveNewCompany(btn) {
    const name = document.getElementById('newCompanyName').value.trim();
    if (!name) { document.getElementById('newCompanyName').style.borderColor = 'red'; return; }
    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    await addItem('companies', { name });
    btn.closest('.bottom-sheet-overlay').remove();
    renderGoods();
}

// ==== فتح صفحة شركة ====
async function openCompany(companyName) {
    const items = await getAll('items');
    const companyItems = items.filter(i => i.company === companyName);
    const totalValue = companyItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);
    
    const isAdmin = state.userProfile && state.userProfile.role === 'admin';

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div><h2 style="color:var(--primary);">${companyName}</h2><p style="font-size:0.85rem; color:var(--text-muted);">${companyItems.length} صنف · ${formatMoney(totalValue)} جنيه</p></div>
                <button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                ${isAdmin ? `<button class="btn btn-outline" style="flex:1; border-color:var(--primary); color:var(--primary);" onclick="openAddItemSheet('${companyName}')">+ إضافة صنف</button>` : ''}
            </div>
            <div class="table-responsive">
                <table style="width:100%; border-collapse:collapse;">
                    <thead><tr style="background:var(--bg-color);"><th style="padding:10px; border-bottom:1px solid var(--border);">الصنف</th><th style="padding:10px; border-bottom:1px solid var(--border);">الكمية</th><th style="padding:10px; border-bottom:1px solid var(--border);">السعر</th><th style="padding:10px; border-bottom:1px solid var(--border);">القيمة</th></tr></thead>
                    <tbody>
                        ${companyItems.length ? companyItems.map(i => `
                            <tr onclick="requestEditItem(${i.id}, '${companyName}')" style="cursor:pointer;">
                                <td style="padding:10px; border-bottom:1px solid var(--border); font-weight:700;">${i.name}</td>
                                <td style="padding:10px; border-bottom:1px solid var(--border);">${i.qty || 0}</td>
                                <td style="padding:10px; border-bottom:1px solid var(--border);">${i.price}</td>
                                <td style="padding:10px; border-bottom:1px solid var(--border); font-weight:700;">${formatMoney((i.qty||0) * i.price)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد أصناف.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ==== طلب تعديل صنف (لو موظف بيطلب باسورد، لو مدير بيدخل علطول) ====
async function requestEditItem(itemId, companyName) {
    const isAdmin = state.userProfile && state.userProfile.role === 'admin';
    if (isAdmin) {
        openEditItemSheet(itemId, companyName, true);
    } else {
        // الموظف لازم يدخل باسورد تعديل الكمية
        const requiredPass = localStorage.getItem('qtyEditPass') || '1234';
        
        const overlay = createEl('div', 'bottom-sheet-overlay');
        overlay.innerHTML = `
            <div class="bottom-sheet">
                <div class="bottom-sheet-header"><h2>تعديل الكمية</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
                <div class="input-group"><label>أدخل باسورد تعديل الكمية</label><input type="password" id="qtyPassInputUser" placeholder="********"></div>
                <button class="btn-save" onclick="checkQtyPassForEdit(${itemId}, '${companyName}')">دخول</button>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('qtyPassInputUser').focus(), 100);
    }
}

async function checkQtyPassForEdit(itemId, companyName) {
    const requiredPass = localStorage.getItem('qtyEditPass') || '1234';
    const entered = document.getElementById('qtyPassInputUser').value;
    
    if (entered !== requiredPass) {
        document.getElementById('qtyPassInputUser').style.borderColor = 'red';
        return;
    }
    
    document.querySelectorAll('.bottom-sheet-overlay').forEach(el => el.remove());
    openEditItemSheet(itemId, companyName, false);
}

// ==== تعديل صنف (بيظهر للمدير كامل، وللموظف الكمية بس) ====
async function openEditItemSheet(itemId, companyName, isAdmin) {
    document.querySelectorAll('.bottom-sheet-overlay').forEach(el => el.remove());
    const item = await getById('items', itemId);
    if (!item) return;

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>تعديل الصنف</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>اسم الصنف</label><input type="text" id="editItemName" value="${item.name}" ${!isAdmin ? 'disabled' : ''}></div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1;"><label>الكمية</label><input type="number" id="editItemQty" value="${item.qty || 0}"></div>
                <div class="input-group" style="flex:1;"><label>سعر الصنف</label><input type="number" id="editItemPrice" value="${item.price || 0}" ${!isAdmin ? 'disabled' : ''}></div>
            </div>
            ${!isAdmin ? '<p style="font-size:0.8rem; color:var(--accent); margin-top:5px;">يمكنك تعديل الكمية فقط. السعر يعدله المدير.</p>' : ''}
            <button class="btn-save" onclick="saveEditItem(${item.id}, '${companyName}', ${isAdmin}, this)">حفظ التعديل</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveEditItem(itemId, companyName, isAdmin, btn) {
    const name = isAdmin ? document.getElementById('editItemName').value.trim() : null;
    const qty = parseFloat(document.getElementById('editItemQty').value) || 0;
    const price = isAdmin ? parseFloat(document.getElementById('editItemPrice').value) || 0 : null;

    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    
    if (isAdmin) {
        await updateItem('items', { id: itemId, name, company: companyName, qty, price });
    } else {
        // الموظف بيعدل الكمية بس
        const item = await getById('items', itemId);
        await updateItem('items', { ...item, qty });
    }
    
    btn.closest('.bottom-sheet-overlay').remove();
    openCompany(companyName);
}

// ==== إضافة صنف (للمدير بس) ====
function openAddItemSheet(companyName) {
    const isAdmin = state.userProfile && state.userProfile.role === 'admin';
    if (!isAdmin) return alert('هذه الصلاحية للمدير فقط');

    document.querySelectorAll('.bottom-sheet-overlay').forEach(el => el.remove());
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>صنف جديد</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').
