// ==== شاشة المصروفات ====
async function renderExpenses() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const expenses = (await getAll('expenses')).filter(e => e.branch_id === state.currentBranch.id);
    const totalExpenses = expenses.reduce((a,b) => a + (b.total || 0), 0);

    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">${t('expenses')}</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">${t('expensesDesc')}</p>

        <div style="display:flex; gap:10px; margin-bottom:20px;">
            <button class="btn btn-outline" id="btn-exp-manual" style="flex:1; border-radius:12px;" onclick="switchExpenseTab('manual')">${t('manual')}</button>
            <button class="btn btn-outline" id="btn-exp-goods" style="flex:1; border-radius:12px;" onclick="switchExpenseTab('goods')">${t('fromGoodsExp')}</button>
        </div>

        <div class="card">
            <div style="background:var(--bg-color); padding:12px; border-radius:10px; margin-bottom:15px;">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <div class="input-group" style="flex:1; margin-bottom:0;">
                        <label>${t('shiftType')}</label>
                        <select id="expShiftType">
                            <option value="نهارية">${t('dayShift')}</option>
                            <option value="ليلية">${t('nightShift')}</option>
                        </select>
                    </div>
                    <div class="input-group" style="flex:1; margin-bottom:0;">
                        <label>${t('date')}</label>
                        <input type="date" id="expDate" value="${getToday()}">
                    </div>
                </div>
                <div class="input-group" style="margin-bottom:0;">
                    <label>${t('employeeName')}</label>
                    <input type="text" id="expEmployee" placeholder="${t('employeeName')}" value="${state.userProfile ? state.userProfile.email.split('@')[0] : ''}">
                </div>
            </div>

            <div id="tab-manual-expense">
                <div class="input-group"><label>${t('expenseTitle')}</label><input type="text" id="expenseTitle" placeholder="${t('expenseTitlePlaceholder')}"></div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;"><label>${t('quantity')}</label><input type="number" id="expenseQty" value="1"></div>
                    <div class="input-group" style="flex:1;"><label>${t('price')}</label><input type="number" id="expensePrice" placeholder="0" oninput="updateExpenseTotal()"></div>
                </div>
                <div class="input-group"><label>${t('notes')}</label><input type="text" id="expenseNotes" placeholder="${t('notesPlaceholder')}"></div>
                <div style="background:var(--bg-color); padding:12px; border-radius:10px; display:flex; justify-content:space-between; font-weight:800; margin-bottom:15px;">
                    <span>${t('expenseTotal')}:</span>
                    <span id="expenseTotal" style="color:var(--primary);">0 ${t('currencyShort')}</span>
                </div>
                <button class="btn btn-primary" onclick="saveManualExpense(this)">${t('recordExpense')}</button>
            </div>

            <div id="tab-goods-expense" class="hidden">
                <div class="input-group"><label>${t('expenseCompany')}</label><select id="expenseCompany" onchange="updateExpenseItems()"><option value="">${t('allCompanies')}</option></select></div>
                <div class="input-group"><label>${t('expenseItem')}</label><select id="expenseItem" onchange="updateExpenseFromItem()"><option value="">${t('selectItem')}</option></select></div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;"><label>${t('quantity')}</label><input type="number" id="expenseGoodsQty" value="1"></div>
                    <div class="input-group" style="flex:1;"><label>${t('price')}</label><input type="text" id="expenseGoodsPrice" readonly placeholder="${t('auto')}" style="background:#e8e8e8;"></div>
                </div>
                <div class="input-group"><label>${t('notes')}</label><input type="text" id="expenseGoodsNotes" placeholder="${t('notesPlaceholder')}"></div>
                <button class="btn btn-primary" onclick="saveGoodsExpense(this)">${t('recordExpense')}</button>
            </div>
        </div>

        <h3 style="margin-top:25px; margin-bottom:15px;">${t('expenseLog')}</h3>
        
        ${expenses.length ? expenses.map(e => `
            <div class="card" style="padding:15px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <h4 style="font-size:0.95rem; margin-bottom:3px;">${e.title}</h4>
                        <p style="color:var(--text-muted); font-size:0.8rem;">
                            ${e.date} · ${e.shift_type === 'نهارية' ? t('dayShift') : t('nightShift')} · ${e.employee || 'غير محدد'}
                        </p>
                        ${e.notes ? `<p style="color:var(--text-muted); font-size:0.8rem;">📝 ${e.notes}</p>` : ''}
                    </div>
                    <div style="font-weight:800; color:var(--danger);">${formatMoney(e.total)} ${t('currencyShort')}</div>
                </div>
                <button class="btn btn-outline" style="width:auto; padding:5px 10px; margin:0; font-size:0.75rem; color:var(--danger); border-color:var(--danger);" onclick="deleteExpense(${e.id})">🗑️ ${t('delete')}</button>
            </div>
        `).join('') : `<p style="text-align:center; padding:20px; color:var(--text-muted);">${t('noExpenses')}</p>`}

        <div class="card" style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem; margin-top:15px;">
            <span>${t('totalExpenses')}:</span>
            <span style="color:var(--danger);">${formatMoney(totalExpenses)} ${t('currencyShort')}</span>
        </div>
    `;
    
    renderBottomNav('expenses');
    loadExpenseCompanies();
    switchExpenseTab('manual');
}

function switchExpenseTab(tabId) {
    const btnManual = document.getElementById('btn-exp-manual');
    const btnGoods = document.getElementById('btn-exp-goods');
    
    btnManual.classList.remove('btn-primary'); btnGoods.classList.remove('btn-primary');
    btnManual.classList.add('btn-outline'); btnGoods.classList.add('btn-outline');
    
    if (tabId === 'manual') {
        btnManual.classList.remove('btn-outline'); btnManual.classList.add('btn-primary');
        $('#tab-manual-expense').classList.remove('hidden'); $('#tab-goods-expense').classList.add('hidden'); 
    } else {
        btnGoods.classList.remove('btn-outline'); btnGoods.classList.add('btn-primary');
        $('#tab-manual-expense').classList.add('hidden'); $('#tab-goods-expense').classList.remove('hidden'); 
    }
}

function updateExpenseTotal() {
    const qty = parseFloat(document.getElementById('expenseQty').value) || 0;
    const price = parseFloat(document.getElementById('expensePrice').value) || 0;
    document.getElementById('expenseTotal').innerText = formatMoney(qty * price) + ' ' + t('currencyShort');
}

async function saveManualExpense(btn) {
    const title = document.getElementById('expenseTitle').value.trim();
    const qty = parseFloat(document.getElementById('expenseQty').value) || 1;
    const price = parseFloat(document.getElementById('expensePrice').value) || 0;
    const notes = document.getElementById('expenseNotes').value.trim();
    const shiftType = document.getElementById('expShiftType').value;
    const date = document.getElementById('expDate').value;
    const employee = document.getElementById('expEmployee').value.trim();
    
    if (!title || !price || !date || !employee) return alert(t('fillAll'));

    btn.innerText = t('loading'); btn.disabled = true;

    await addItem('expenses', {
        title, qty, price, notes,
        total: qty * price,
        type: 'manual',
        branch_id: state.currentBranch.id,
        date: date,
        shift_type: shiftType,
        employee: employee
    });

    renderExpenses();
}

async function loadExpenseCompanies() {
    const companies = await getAll('companies');
    const select = document.getElementById('expenseCompany');
    if (!select) return;
    companies.forEach(c => { select.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
    updateExpenseItems();
}

async function updateExpenseItems() {
    const comp = document.getElementById('expenseCompany').value;
    const items = await getAll('items');
    const select = document.getElementById('expenseItem');
    select.innerHTML = `<option value="">${t('selectItem')}</option>`;
    const filtered = comp ? items.filter(i => i.company === comp && i.branch_id === state.currentBranch.id) : items.filter(i => i.branch_id === state.currentBranch.id);
    filtered.forEach(i => { select.innerHTML += `<option value="${i.id}" data-price="${i.price}" data-name="${i.name}">${i.name} (${i.qty})</option>`; });
}

async function updateExpenseFromItem() {
    const opt = document.getElementById('expenseItem').options[document.getElementById('expenseItem').selectedIndex];
    if (opt.value) { document.getElementById('expenseGoodsPrice').value = opt.dataset.price; }
}

async function saveGoodsExpense(btn) {
    const itemId = document.getElementById('expenseItem').value;
    const qty = parseFloat(document.getElementById('expenseGoodsQty').value) || 1;
    const notes = document.getElementById('expenseGoodsNotes').value.trim();
    const shiftType = document.getElementById('expShiftType').value;
    const date = document.getElementById('expDate').value;
    const employee = document.getElementById('expEmployee').value.trim();
    
    if (!itemId || !qty || !date || !employee) return alert(t('fillAll'));

    const item = await getById('items', parseInt(itemId));
    if (!item) return;

    btn.innerText = t('loading'); btn.disabled = true;

    await addItem('expenses', {
        title: item.name,
        qty, price: item.price,
        notes: notes || `${t('fromGoodsExp')} - ${item.company}`,
        total: qty * item.price,
        type: 'goods',
        branch_id: state.currentBranch.id,
        date: date,
        shift_type: shiftType,
        employee: employee
    });

    item.qty = (item.qty || 0) - qty;
    await updateItem('items', item);

    renderExpenses();
}

async function deleteExpense(id) {
    if (!confirm(t('confirmDelete'))) return;
    
    const expense = await getById('expenses', id);
    if (!expense) return;

    if (expense.type === 'goods') {
        const items = await getAll('items');
        const item = items.find(i => i.name === expense.title && i.branch_id === state.currentBranch.id);
        if (item) {
            item.qty = (item.qty || 0) + expense.qty;
            await updateItem('items', item);
        }
    }

    await deleteItem('expenses', id);
    renderExpenses();
}
