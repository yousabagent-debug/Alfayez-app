// ==== شاشة المصروفات ====
async function renderExpenses() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const expenses = (await getAll('expenses')).filter(e => e.branch_id === state.currentBranch.id);
    const totalExpenses = expenses.reduce((a,b) => a + (b.total || 0), 0);

    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">المصروفات</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">سجّل مصروفات المحل يدوياً أو باختيار صنف من البضاعة</p>

        <div class="card">
            <!-- التبويبات -->
            <div class="tabs" style="margin-bottom:20px;">
                <div class="tab active" onclick="switchExpenseTab('manual', this)" style="background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.05);">يدوي</div>
                <div class="tab" onclick="switchExpenseTab('goods', this)">من البضاعة</div>
            </div>

            <!-- تبويب المصروف اليدوي -->
            <div id="tab-manual-expense">
                <div class="input-group">
                    <label>بيان المصروف</label>
                    <input type="text" id="expenseTitle" placeholder="مثال: كهرباء المحل">
                </div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;">
                        <label>الكمية</label>
                        <input type="number" id="expenseQty" value="1">
                    </div>
                    <div class="input-group" style="flex:1;">
                        <label>السعر</label>
                        <input type="number" id="expensePrice" placeholder="0" oninput="updateExpenseTotal()">
                    </div>
                </div>
                <div class="input-group">
                    <label>ملاحظات (اختياري)</label>
                    <input type="text" id="expenseNotes" placeholder="مثال: صيانة الثلاجة">
                </div>
                <div style="background:var(--bg-color); padding:12px; border-radius:10px; display:flex; justify-content:space-between; font-weight:800; margin-bottom:15px;">
                    <span>إجمالي المصروف:</span>
                    <span id="expenseTotal" style="color:var(--primary);">0 ج</span>
                </div>
                <button class="btn btn-primary" onclick="saveManualExpense(this)">+ تسجيل المصروف</button>
            </div>

            <!-- تبويب المصروف من البضاعة -->
            <div id="tab-goods-expense" class="hidden">
                <div class="input-group">
                    <label>الشركة</label>
                    <select id="expenseCompany" onchange="updateExpenseItems()"><option value="">كل الشركات</option></select>
                </div>
                <div class="input-group">
                    <label>الصنف</label>
                    <select id="expenseItem" onchange="updateExpenseFromItem()"><option value="">اختر الصنف</option></select>
                </div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;">
                        <label>الكمية</label>
                        <input type="number" id="expenseGoodsQty" value="1">
                    </div>
                    <div class="input-group" style="flex:1;">
                        <label>السعر</label>
                        <input type="text" id="expenseGoodsPrice" readonly placeholder="تلقائي" style="background:#e8e8e8;">
                    </div>
                </div>
                <div class="input-group">
                    <label>ملاحظات (اختياري)</label>
                    <input type="text" id="expenseGoodsNotes" placeholder="مثال: فلتر تالف">
                </div>
                <button class="btn btn-primary" onclick="saveGoodsExpense(this)">+ تسجيل المصروف</button>
            </div>
        </div>

        <h3 style="margin-top:25px; margin-bottom:15px;">سجل المصروفات</h3>
        
        ${expenses.length ? expenses.map(e => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                <div>
                    <h4 style="font-size:0.95rem; margin-bottom:5px;">${e.title}</h4>
                    <p style="color:var(--text-muted); font-size:0.8rem;">${e.date} ${e.notes ? '· ' + e.notes : ''}</p>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="font-weight:800;">${formatMoney(e.total)} ج</div>
                    <button class="icon-btn" style="width:30px; height:30px; font-size:0.8rem; color:var(--danger);" onclick="deleteExpense(${e.id}, this)">🗑️</button>
                </div>
            </div>
        `).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted);">لا توجد مصروفات مسجلة</p>'}

        <div class="card" style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem; margin-top:15px;">
            <span>إجمالي المصروفات:</span>
            <span style="color:var(--danger);">${formatMoney(totalExpenses)} ج</span>
        </div>
    `;
    
    renderBottomNav('expenses');
    loadExpenseCompanies();
}

// ==== التبويبات ====
function switchExpenseTab(tabId, btn) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active')); 
    btn.classList.add('active');
    if(tabId === 'manual') { 
        $('#tab-manual-expense').classList.remove('hidden'); 
        $('#tab-goods-expense').classList.add('hidden'); 
    } else { 
        $('#tab-manual-expense').classList.add('hidden'); 
        $('#tab-goods-expense').classList.remove('hidden'); 
    }
}

// ==== تحديث الإجمالي في المصروف اليدوي ====
function updateExpenseTotal() {
    const qty = parseFloat(document.getElementById('expenseQty').value) || 0;
    const price = parseFloat(document.getElementById('expensePrice').value) || 0;
    document.getElementById('expenseTotal').innerText = formatMoney(qty * price) + ' ج';
}

// ==== حفظ المصروف اليدوي ====
async function saveManualExpense(btn) {
    const title = document.getElementById('expenseTitle').value.trim();
    const qty = parseFloat(document.getElementById('expenseQty').value) || 1;
    const price = parseFloat(document.getElementById('expensePrice').value) || 0;
    const notes = document.getElementById('expenseNotes').value.trim();
    
    if (!title || !price) return alert('ادخل بيان المصروف والسعر');

    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;

    await addItem('expenses', {
        title, qty, price, notes,
        total: qty * price,
        type: 'manual',
        branch_id: state.currentBranch.id,
        date: getToday()
    });

    btn.closest('.bottom-sheet-overlay') || renderExpenses();
    renderExpenses(); // تحديث الشاشة
}

// ==== تحميل شركات المصروفات ====
async function loadExpenseCompanies() {
    const companies = await getAll('companies');
    const select = document.getElementById('expenseCompany');
    if (!select) return;
    companies.forEach(c => { select.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
    updateExpenseItems();
}

// ==== تحديث أصناف المصروفات ====
async function updateExpenseItems() {
    const comp = document.getElementById('expenseCompany').value;
    const items = await getAll('items');
    const select = document.getElementById('expenseItem');
    select.innerHTML = '<option value="">اختر الصنف</option>';
    const filtered = comp ? items.filter(i => i.company === comp) : items;
    filtered.forEach(i => { select.innerHTML += `<option value="${i.id}" data-price="${i.price}" data-name="${i.name}">${i.name} (متوفر: ${i.qty})</option>`; });
}

async function updateExpenseFromItem() {
    const opt = document.getElementById('expenseItem').options[document.getElementById('expenseItem').selectedIndex];
    if (opt.value) {
        document.getElementById('expenseGoodsPrice').value = opt.dataset.price;
    }
}

// ==== حفظ مصروف من البضاعة ====
async function saveGoodsExpense(btn) {
    const itemId = document.getElementById('expenseItem').value;
    const qty = parseFloat(document.getElementById('expenseGoodsQty').value) || 1;
    const notes = document.getElementById('expenseGoodsNotes').value.trim();
    
    if (!itemId || !qty) return alert('اختر الصنف والكمية');

    const item = await getById('items', parseInt(itemId));
    if (!item) return;

    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;

    // 1. تسجيل المصروف
    await addItem('expenses', {
        title: item.name,
        qty, price: item.price,
        notes: notes || `مصروف من البضاعة - ${item.company}`,
        total: qty * item.price,
        type: 'goods',
        branch_id: state.currentBranch.id,
        date: getToday()
    });

    // 2. خصم من رصيد البضاعة
    item.qty = (item.qty || 0) - qty;
    await updateItem('items', item);

    renderExpenses();
}

// ==== حذف مصروف ====
async function deleteExpense(id, btn) {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    
    const expense = await getById('expenses', id);
    if (!expense) return;

    // لو مصروف بضاعة، نرجع الكمية للرصيد
    if (expense.type === 'goods') {
        const items = await getAll('items');
        const item = items.find(i => i.name === expense.title);
        if (item) {
            item.qty = (item.qty || 0) + expense.qty;
            await updateItem('items', item);
        }
    }

    await deleteItem('expenses', id);
    renderExpenses();
}
