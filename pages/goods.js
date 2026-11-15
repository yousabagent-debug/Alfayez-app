// ==== شاشة البضاعة ====
async function renderGoods() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const companies = await getAll('companies');
    const items = await getAll('items');
    
    // فلترة الأصناف الخاصة بالفرع
    const branchItems = items.filter(i => i.branch_id === state.currentBranch.id || !i.branch_id);

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin:0;">البضاعة الموجودة</h2>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openManageGoods()">إدارة البضاعة</button>
                <button class="btn btn-primary" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openAddCompanySheet()">+ شركة</button>
            </div>
        </div>
        
        <div class="card card-primary">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.9rem; opacity:0.8;">إجمالي مبلغ البضاعة</div>
                <h2>${formatMoney(branchItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0))} <span style="font-size:1rem;">جنيه</span></h2>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <span style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; font-size:0.8rem;">${branchItems.length} صنف</span>
                    <span style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; font-size:0.8rem;">${companies.length} شركة</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom:10px; font-size:1.1rem;">البحث عن صنف</h3>
            <input type="text" placeholder="اسم الصنف أو الشركة..." onkeyup="searchItems(this.value)" style="margin-bottom:0; background:var(--bg-color);">
        </div>

        <div id="searchResults" class="hidden"></div>

        <h3 style="margin-top:25px; margin-bottom:15px;">الشركات</h3>
        <div id="companiesList">
            ${companies.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">لا يوجد شركات. اضغط "+ شركة".</p>' : ''}
            ${companies.map(c => {
                const compItems = branchItems.filter(i => i.company === c.name);
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
    if (!query) { resDiv.classList.add('hidden'); return; }
    
    const items = await getAll('items');
    const res = items.filter(i => i.name.includes(query) || i.company.includes(query));
    
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = res.length ? res.map(i => `
        <div class="card" style="padding:15px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="font-size:1.1rem; margin-bottom:5px;">${i.name}</h3>
                    <span style="font-size:0.85rem; color:var(--text-muted);">${i.company}</span>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:1.4rem; font-weight:800; color:var(--primary);">${i.qty || 0}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">رصيد</div>
                </div>
            </div>
        </div>
    `).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد نتائج</p>';
}

// ==== إضافة شركة (شاشة منبثقة) ====
function openAddCompanySheet() {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header">
                <h2>شركة / مورد جديد</h2>
                <button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            
            <div class="input-group">
                <label>اسم الشركة</label>
                <input type="text" id="newCompanyName" placeholder="مثال: التعاون">
            </div>
            <div class="input-group">
                <label>رقم الهاتف (اختياري)</label>
                <input type="text" id="newCompanyPhone" placeholder="01xxxxxxxxx">
            </div>
            <div class="input-group">
                <label>ملاحظات (اختياري)</label>
                <input type="text" id="newCompanyNotes" placeholder="أي ملاحظات إضافية">
            </div>
            
            <button class="btn-save" onclick="saveNewCompany(this)">حفظ الشركة</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveNewCompany(btn) {
    const name = document.getElementById('newCompanyName').value.trim();
    if (!name) {
        document.getElementById('newCompanyName').style.borderColor = 'red';
        return;
    }
    
    btn.innerText = 'جاري الحفظ...';
    btn.disabled = true;
    
    await addItem('companies', { name });
    btn.closest('.bottom-sheet-overlay').remove();
    renderGoods();
}

// ==== فتح صفحة شركة ====
async function openCompany(companyName) {
    const items = await getAll('items');
    const companyItems = items.filter(i => i.company === companyName && (i.branch_id === state.currentBranch.id || !i.branch_id));
    const totalValue = companyItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h2 style="color:var(--primary);">${companyName}</h2>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${companyItems.length} صنف · ${formatMoney(totalValue)} جنيه</p>
                </div>
                <button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button class="btn btn-outline" style="flex:1; border-color:var(--primary); color:var(--primary);" onclick="openAddItemSheet('${companyName}')">+ إضافة صنف</button>
                <button class="btn btn-outline" style="flex:1; border-color:var(--danger); color:var(--danger);" onclick="editCompanyName('${companyName}')">تعديل الشركة</button>
            </div>

            <div class="table-responsive">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-color);">
                            <th style="padding:10px; border-bottom:1px solid var(--border);">الصنف</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border);">الكمية</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border);">السعر</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border);">القيمة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${companyItems.length ? companyItems.map(i => `
                            <tr>
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

// ==== إضافة صنف (شاشة منبثقة) ====
function openAddItemSheet(companyName) {
    // إغلاق شاشة الشركة المفتوحة
    document.querySelectorAll('.bottom-sheet-overlay').forEach(el => el.remove());

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header">
                <h2>صنف جديد</h2>
                <button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            
            <div class="input-group">
                <label>اسم الصنف</label>
                <input type="text" id="newItemName" placeholder="مثال: زيت 1 لتر">
            </div>
            
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1;">
                    <label>الكمية</label>
                    <input type="number" id="newItemQty" value="0">
                </div>
                <div class="input-group" style="flex:1;">
                    <label>سعر الصنف</label>
                    <input type="number" id="newItemPrice" value="0">
                </div>
            </div>
            
            <div style="background:#f4f4f4; padding:10px; border-radius:8px; font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; text-align:right;">
                سعر الصنف يُحدّد هنا فقط، ويُطبّق تلقائياً على فواتير الورديات الجديدة.
            </div>
            
            <button class="btn-save" onclick="saveNewItem('${companyName}', this)">حفظ الصنف</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveNewItem(companyName, btn) {
    const name = document.getElementById('newItemName').value.trim();
    const qty = parseFloat(document.getElementById('newItemQty').value) || 0;
    const price = parseFloat(document.getElementById('newItemPrice').value) || 0;
    
    if (!name) {
        document.getElementById('newItemName').style.borderColor = 'red';
        return;
    }
    
    btn.innerText = 'جاري الحفظ...';
    btn.disabled = true;
    
    await addItem('items', { name, company: companyName, price, qty });
    btn.closest('.bottom-sheet-overlay').remove();
    openCompany(companyName); // نرجع نفتح شاشة الشركة بعد الإضافة
}

// ==== تعديل اسم شركة ====
async function editCompanyName(oldName) {
    const newName = prompt('اسم الشركة الجديد:', oldName);
    if (newName && newName !== oldName) {
        const companies = await getAll('companies');
        const comp = companies.find(c => c.name === oldName);
        if (comp) { comp.name = newName; await updateItem('companies', comp); }
        
        const items = await getAll('items');
        for (let item of items) {
            if (item.company === oldName) { item.company = newName; await updateItem('items', item); }
        }
        document.querySelectorAll('.bottom-sheet-overlay').forEach(el => el.remove());
        renderGoods();
    }
}

// ==== إدارة البضاعة ====
async function openManageGoods() {
    const additions = await getAll('additions');
    const grouped = additions.reduce((acc, curr) => {
        if (!acc[curr.date]) acc[curr.date] = [];
        acc[curr.date].push(curr);
        return acc;
    }, {});

    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="color:var(--primary);">البضاعة المضافة</h2>
                <button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            <button class="btn btn-primary" onclick="openAddBatchSheet()" style="margin-bottom:20px;">+ إضافة بضاعة</button>

            ${Object.keys(grouped).length === 0 ? '<p style="text-align:center; color:var(--text-muted);">لا يوجد بضاعة مضافة</p>' : ''}

            ${Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).map(date => `
                <div class="card" style="padding:15px; margin-bottom:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:10px;">
                        <h4 style="color:var(--primary);">${date}</h4>
                        <button class="btn btn-outline" style="width:auto; padding:5px 10px; margin:0; font-size:0.75rem; color:var(--danger);" onclick="deleteAdditionDate('${date}', this)">🗑️ حذف</button>
                    </div>
                    ${grouped[date].map(add => `
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);">
                            <div>
                                <div style="font-weight:700; font-size:0.9rem;">${add.item_name}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">${add.company}</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="color:var(--success); font-weight:700;">+${add.qty}</span>
                                <button class="icon-btn" style="width:25px; height:25px; font-size:0.8rem;" onclick="deleteSingleAddition(${add.id}, this)">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(overlay);
}

function openAddBatchSheet() {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header">
                <h2>إضافة بضاعة</h2>
                <button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            
            <div class="input-group">
                <label>التاريخ</label>
                <input type="date" id="batchDate" value="${getToday()}">
            </div>
            <div class="input-group">
                <label>اسم الشركة</label>
                <input type="text" id="batchCompany" placeholder="اسم الشركة">
            </div>
            <div class="input-group">
                <label>اسم الصنف</label>
                <input type="text" id="batchItemName" placeholder="اسم الصنف">
            </div>
            <div class="input-group">
                <label>الكمية المضافة</label>
                <input type="number" id="batchQty" placeholder="0">
            </div>
            
            <button class="btn-save" onclick="saveNewBatch(this)">حفظ الإضافة</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveNewBatch(btn) {
    const date = document.getElementById('batchDate').value;
    const company = document.getElementById('batchCompany').value.trim();
    const itemName = document.getElementById('batchItemName').value.trim();
    const qty = parseFloat(document.getElementById('batchQty').value);

    if (!date || !company || !itemName || !qty) return alert('اكمل البيانات');

    btn.innerText = 'جاري الحفظ...';
    btn.disabled = true;

    await addItem('additions', { date, company, item_name: itemName, qty });

    const items = await getAll('items');
    const existingItem = items.find(i => i.name === itemName && i.company === company);
    if (existingItem) {
        existingItem.qty = (existingItem.qty || 0) + qty;
        await updateItem('items', existingItem);
    } else {
        await addItem('items', { name: itemName, company, price: 0, qty: qty });
    }
    
    btn.closest('.bottom-sheet-overlay').remove();
    openManageGoods(); // نرجع نفتح شاشة الإدارة
}

async function deleteAdditionDate(date, btn) {
    if (!confirm('هل أنت متأكد من حذف إضافات هذا التاريخ؟')) return;
    const additions = await getAll('additions');
    const toDelete = additions.filter(a => a.date === date);
    for (let add of toDelete) {
        const items = await getAll('items');
        const item = items.find(i => i.name === add.item_name && i.company === add.company);
        if (item) { item.qty -= add.qty; await updateItem('items', item); }
        await deleteItem('additions', add.id);
    }
    btn.closest('.bottom-sheet-overlay').remove();
    openManageGoods();
}

async function deleteSingleAddition(id, btn) {
    if (!confirm('حذف هذه الإضافة؟')) return;
    const add = await getById('additions', id);
    if (add) {
        const items = await getAll('items');
        const item = items.find(i => i.name === add.item_name && i.company === add.company);
        if (item) { item.qty -= add.qty; await updateItem('items', item); }
        await deleteItem('additions', id);
    }
    btn.closest('.bottom-sheet-overlay').remove();
    openManageGoods();
}
