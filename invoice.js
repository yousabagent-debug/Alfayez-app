// ==== شاشة الفاتورة ====
async function renderInvoice() {
    if (!state.activeShift) return navigate('shifts');
    const s = state.activeShift, items = s.invoiceItems || s.invoice_items || [];
    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;"><h2>الفاتورة</h2><button class="icon-btn" onclick="navigate('shifts')">🔙</button></div>
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><div><h3 style="color:var(--primary);">وردية ${s.type} ${s.is_matabak ? '(مطبق)' : ''}</h3><p style="font-size:0.85rem; color:var(--text-muted); margin-top:5px;">الموظف: ${s.employee}</p></div><button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem; color:var(--danger); border-color:var(--danger);" onclick="deleteShift(${s.id})">حذف الوردية</button></div>
            <button class="btn btn-primary" style="display:flex; justify-content:center; gap:10px; align-items:center;" onclick="openAddItemModal()">+ إضافة صنف</button>
        </div>
        <div class="card" style="padding:0; overflow:hidden;">
            <div style="padding:15px; background:var(--bg-color); border-bottom:1px solid var(--border); display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem; color:var(--text-muted);"><span>الأصناف (${items.length})</span><span>الإجمالي</span></div>
            ${items.length === 0 ? `<div style="text-align:center; padding:40px 20px;"><p style="color:var(--text-muted); margin-bottom:5px;">الفاتورة فاضية</p><p style="font-size:0.8rem; color:var(--text-muted);">اضغط «إضافة صنف» لاختيار بضاعة أو كتابته يدوياً.</p></div>` : items.map((item, idx) => `<div style="padding:15px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;"><div><h4 style="font-size:1rem; margin-bottom:5px;">${item.name}</h4><span style="font-size:0.8rem; color:var(--text-muted);">${item.company}</span></div><div style="display:flex; align-items:center; gap:15px;"><div style="text-align:center;"><input type="number" value="${item.qty}" style="width:60px; padding:5px; margin:0; text-align:center; font-weight:700;" onchange="updateInvoiceQty(${idx}, this.value)"><div style="font-size:0.7rem; color:var(--text-muted); margin-top:5px;">الكمية</div></div><div style="font-weight:800; font-size:1.1rem; min-width:50px; text-align:left;">${formatMoney(item.price * item.qty)}</div></div></div>`).join('')}
            <div style="padding:15px; display:flex; justify-content:space-between; font-weight:800; font-size:1.2rem; background:var(--bg-color);"><span>الإجمالي:</span><span style="color:var(--primary);">${formatMoney(s.total)} ج</span></div>
        </div>
        ${items.length > 0 ? `<button class="btn btn-primary" style="margin-top:20px; background:var(--primary); color:#fff; display:flex; justify-content:center; gap:10px;" onclick="closeShift(${s.id})">💾 حفظ الفاتورة وخصم الكميات</button>` : ''}
    `;
    renderBottomNav('shifts');
}

function openAddItemModal() {
    const overlay = createEl('div', 'bottom-sheet-overlay'); overlay.id = 'addItemOverlay';
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h3>إضافة صنف للفاتورة</h3><button class="icon-btn" onclick="document.getElementById('addItemOverlay').remove()">✖</button></div>
            <div class="tabs"><div class="tab active" onclick="switchAddTab('goods', this)">من البضاعة</div><div class="tab" onclick="switchAddTab('manual', this)">إدخال يدوي</div></div>
            <div id="tab-goods">
                <label>الشركة</label><select id="addCompanySelect" onchange="updateItemSelect()"><option value="">كل الشركات</option></select>
                <label>الصنف</label><select id="addItemSelect"><option value="">اختر الصنف</option></select>
                <div style="display:flex; gap:10px;"><div style="flex:1;"><label>الكمية</label><input type="number" id="addQty" value="1" step="0.25"></div><div style="flex:1;"><label>سعر الوحدة</label><input type="text" id="addPrice" readonly placeholder="تلقائي" style="background:#e8e8e8;"></div></div>
                <div class="chips-container"><div class="chip" onclick="setAddQty(0.25)">ربع</div><div class="chip" onclick="setAddQty(0.5)">نصف</div><div class="chip" onclick="setAddQty(0.75)">¾</div><div class="chip active" onclick="setAddQty(1)">1</div><div class="chip" onclick="setAddQty(2)">2</div></div>
                <button class="btn btn-primary" onclick="addItemToInvoice('goods')" style="background:#8fa89e;">إضافة للفاتورة</button>
            </div>
            <div id="tab-manual" class="hidden">
                <label>اسم الصنف (إدخال يدوي)</label><input type="text" id="manualName" placeholder="اكتب اسم الصنف...">
                <div style="display:flex; gap:10px;"><div style="flex:1;"><label>الكمية</label><input type="number" id="manualQty" value="1" step="0.25"></div><div style="flex:1;"><label>السعر</label><input type="number" id="manualPrice" placeholder="0"></div></div>
                <button class="btn btn-primary" onclick="addItemToInvoice('manual')" style="background:#8fa89e; margin-top:20px;">إضافة للفاتورة</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay); loadCompanySelect();
}

function switchAddTab(tabId, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); btn.classList.add('active');
    if(tabId === 'goods') { $('#tab-goods').classList.remove('hidden'); $('#tab-manual').classList.add('hidden'); } else { $('#tab-goods').classList.add('hidden'); $('#tab-manual').classList.remove('hidden'); }
}

function setAddQty(qty) { $('#addQty').value = qty; document.querySelectorAll('.chips-container .chip').forEach(c => c.classList.remove('active')); event.target.classList.add('active'); }

async function loadCompanySelect() {
    const companies = await getAll('companies'); const select = $('#addCompanySelect'); if(!select) return;
    companies.forEach(c => { select.innerHTML += `<option value="${c.name}">${c.name}</option>`; }); updateItemSelect();
}

async function updateItemSelect() {
    const comp = $('#addCompanySelect').value, items = await getAll('items'), select = $('#addItemSelect');
    select.innerHTML = '<option value="">اختر الصنف</option>';
    const filtered = comp ? items.filter(i => i.company === comp) : items;
    filtered.forEach(i => { select.innerHTML += `<option value="${i.id}" data-price="${i.price}">${i.name} (متوفر: ${i.qty})</option>`; });
}

document.addEventListener('change', (e) => { if(e.target.id === 'addItemSelect') { const opt = e.target.options[e.target.selectedIndex]; $('#addPrice').value = opt.value ? opt.dataset.price : ''; } });

async function addItemToInvoice(mode) {
    let item;
    if(mode === 'goods') { const id = $('#addItemSelect').value, qty = parseFloat($('#addQty').value); if(!id || !qty) return alert('اختر الصنف والكمية'); const dbItem = await getById('items', parseInt(id)); item = { id: dbItem.id, name: dbItem.name, company: dbItem.company, price: dbItem.price, qty: qty }; } 
    else { const name = $('#manualName').value, qty = parseFloat($('#manualQty').value), price = parseFloat($('#manualPrice').value); if(!name || !qty || !price) return alert('اكمل البيانات'); item = { id: null, name, company: 'إدخال يدوي', price, qty }; }
    if(!state.activeShift.invoiceItems) state.activeShift.invoiceItems = [];
    state.activeShift.invoiceItems.push(item);
    state.activeShift.total = (state.activeShift.total || 0) + (item.price * item.qty);
    state.activeShift.invoice_items = state.activeShift.invoiceItems;
    await updateItem('shifts', state.activeShift); $('#addItemOverlay').remove(); renderInvoice();
}

async function updateInvoiceQty(idx, newQty) {
    const s = state.activeShift, items = s.invoiceItems || s.invoice_items;
    items[idx].qty = parseFloat(newQty); s.total = items.reduce((a,b) => a + (b.price * b.qty), 0);
    s.invoiceItems = items; s.invoice_items = items; await updateItem('shifts', s); renderInvoice();
}

async function closeShift(id) {
    const s = state.activeShift, items = s.invoiceItems || s.invoice_items || [];
    for (let invItem of items) { if (invItem.id) { const dbItem = await getById('items', invItem.id); if(dbItem) { dbItem.qty = (dbItem.qty || 0) - invItem.qty; await updateItem('items', dbItem); } } }
    s.closed = true; s.invoice_items = items; await updateItem('shifts', s); state.activeShift = null; alert('تم حفظ الفاتورة وخصم الكميات بنجاح!'); navigate('supplies');
}
