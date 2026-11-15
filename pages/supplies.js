// ==== شاشة التوريدات (الأرشيف) ====
async function renderSupplies() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const allShifts = await getAll('shifts');
    
    // فلترة الورديات المقفولة (المحفوظة) للفرع الحالي
    const closedShifts = allShifts
        .filter(s => s.closed && s.branch_id === state.currentBranch.id)
        .sort((a,b) => b.id - a.id);

    const totalSupplied = closedShifts.reduce((a,b) => a + (b.total || 0), 0);

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>التوريدات</h2>
            <span style="font-size:0.85rem; color:var(--text-muted);">أرشيف الورديات المحفوظة</span>
        </div>

        <div class="card" style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem;">
            <div>
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">عدد الورديات</div>
                <span style="color:var(--primary);">${closedShifts.length}</span>
            </div>
            <div style="text-align:left;">
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">إجمالي التوريدات</div>
                <span style="color:var(--primary);">${formatMoney(totalSupplied)} جنيه</span>
            </div>
        </div>

        ${closedShifts.length === 0 ? `
            <p style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد توريدات محفوظة حتى الآن</p>
        ` : closedShifts.map(s => `
            <div class="card" onclick="viewSupplyDetails(${s.id})" style="cursor:pointer;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <h4 style="color:var(--primary);">${s.type} ${s.is_matabak ? '(مطبق)' : ''} - ${s.employee}</h4>
                    <span style="font-weight:800;">${formatMoney(s.total)}</span>
                </div>
                <p style="color:var(--text-muted); font-size:0.8rem;">${s.date} · ${(s.invoice_items || []).length} صنف</p>
            </div>
        `).join('')}
    `;
    
    renderBottomNav('supplies');
}

// ==== عرض تفاصيل التوريد ====
async function viewSupplyDetails(id) {
    const s = await getById('shifts', id);
    const items = s.invoice_items || [];
    
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="background:var(--bg-color); padding:10px; border-radius:8px; text-align:center; margin-bottom:20px; font-size:0.9rem; color:var(--text-muted);">
                🔒 نسخة مؤرشفة — لا يمكن تعديل الأصناف أو القيم
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h3>وردية ${s.type}</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${s.date} · الموظف: ${s.employee}</p>
                </div>
                ${state.userProfile && state.userProfile.role === 'admin' ? `
                    <button class="btn btn-outline" style="width:auto; padding:8px; color:var(--danger); border-color:var(--danger); margin:0;" onclick="deleteSupply(${s.id}, this)">حذف الوردية</button>
                ` : ''}
            </div>
            
            <div class="table-responsive">
                <table style="width:100%; text-align:right; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-color);">
                            <th style="padding:10px; border-bottom:1px solid var(--border); font-size:0.85rem;">الصنف</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border); font-size:0.85rem;">الكمية</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border); font-size:0.85rem;">السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.length ? items.map(i => `
                            <tr>
                                <td style="padding:10px 0; border-bottom:1px solid var(--border);">
                                    <div style="font-weight:700;">${i.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${i.company}</div>
                                </td>
                                <td style="padding:10px 0; border-bottom:1px solid var(--border); font-weight:700;">${i.qty}</td>
                                <td style="padding:10px 0; border-bottom:1px solid var(--border); font-weight:700;">${formatMoney(i.price)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد أصناف</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:800; font-size:1.2rem;">
                <span>الإجمالي:</span>
                <span style="color:var(--primary);">${formatMoney(s.total)} ج</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
}

// ==== حذف توريد (للمدير بس) ====
async function deleteSupply(id, btn) {
    if (!confirm('هل أنت متأكد من حذف هذه الوردية؟ سيتم إرجاع الكميات للرصيد.')) return;
    
    const s = await getById('shifts', id);
    const items = s.invoice_items || [];
    
    // إرجاع الكميات للرصيد
    for (let invItem of items) {
        if (invItem.id) {
            const dbItem = await getById('items', invItem.id);
            if(dbItem) { 
                dbItem.qty = (dbItem.qty || 0) + invItem.qty; 
                await updateItem('items', dbItem); 
            }
        }
    }
    
    await deleteItem('shifts', id);
    btn.closest('.bottom-sheet-overlay').remove();
    renderSupplies();
}
