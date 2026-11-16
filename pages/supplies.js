// ==== شاشة التوريدات ====
async function renderSupplies() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const allShifts = await getAll('shifts');
    const closedShifts = allShifts
        .filter(s => s.closed && s.branch_id === state.currentBranch.id)
        .sort((a,b) => b.id - a.id);

    const totalSupplied = closedShifts.reduce((a,b) => a + (b.total || 0), 0);

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>${t('supplies')}</h2>
            <span style="font-size:0.85rem; color:var(--text-muted);">${t('suppliesArchive')}</span>
        </div>

        <div class="card" style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem;">
            <div>
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">${t('shiftsCount')}</div>
                <span style="color:var(--primary);">${closedShifts.length}</span>
            </div>
            <div style="text-align:left;">
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">${t('totalSupplies')}</div>
                <span style="color:var(--primary);">${formatMoney(totalSupplied)} ${t('currency')}</span>
            </div>
        </div>

        ${closedShifts.length === 0 ? `<p style="text-align:center; padding:20px; color:var(--text-muted);">${t('noSupplies')}</p>` : closedShifts.map(s => {
            const itemsCount = (s.invoice_data || s.invoice_items || []).length;
            return `
                <div class="card" onclick="viewSupplyDetails(${s.id})" style="cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <h4 style="color:var(--primary);">${s.type === 'نهارية' ? t('dayShift') : t('nightShift')} ${s.is_matabak ? t('matabak') : ''} - ${s.employee}</h4>
                        <span style="font-weight:800;">${formatMoney(s.total)}</span>
                    </div>
                    <p style="color:var(--text-muted); font-size:0.8rem;">${s.date} · ${itemsCount} ${t('itemsCount')}</p>
                </div>
            `;
        }).join('')}
    `;
    
    renderBottomNav('supplies');
}

async function viewSupplyDetails(id) {
    const s = await getById('shifts', id);
    const items = s.invoice_data || s.invoice_items || [];
    
    const allExpenses = await getAll('expenses');
    const relatedExpenses = allExpenses.filter(e => 
        e.branch_id === s.branch_id && e.date === s.date && e.shift_type === s.type && e.employee === s.employee
    );
    
    const totalRelatedExpenses = relatedExpenses.reduce((a,b) => a + (b.total || 0), 0);
    
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="background:var(--bg-color); padding:10px; border-radius:8px; text-align:center; margin-bottom:20px; font-size:0.9rem; color:var(--text-muted);">
                ${t('archived')}
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h3>${s.type === 'نهارية' ? t('dayShift') : t('nightShift')}</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${s.date} · ${t('employeeName')}: ${s.employee}</p>
                </div>
                ${state.userProfile && state.userProfile.role === 'admin' ? `
                    <button class="btn btn-outline" style="width:auto; padding:8px; color:var(--danger); border-color:var(--danger); margin:0;" onclick="deleteSupply(${s.id}, this)">${t('deleteShift')}</button>
                ` : ''}
            </div>
            
            <div class="table-responsive">
                <table style="width:100%; text-align:right; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-color);">
                            <th style="padding:10px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('goods')}</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('quantity')}</th>
                            <th style="padding:10px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('price')}</th>
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
                        `).join('') : `<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">${t('noResults')}</td></tr>`}
                    </tbody>
                </table>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:800; font-size:1.2rem; padding-bottom:15px; border-bottom:1px solid var(--border);">
                <span>${t('total')}:</span>
                <span style="color:var(--primary);">${formatMoney(s.total)} ${t('currencyShort')}</span>
            </div>

            ${relatedExpenses.length > 0 ? `
                <div class="card" style="margin-top:15px; background:#fff5f5; border:1px solid #ffcccc;">
                    <h4 style="font-size:1rem; color:var(--danger); margin-bottom:10px;">💸 ${t('expenses')}</h4>
                    ${relatedExpenses.map(e => `
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #ffcccc;">
                            <span style="font-size:0.9rem;">${e.title}</span>
                            <span style="font-weight:700; color:var(--danger);">${formatMoney(e.total)} ${t('currencyShort')}</span>
                        </div>
                    `).join('')}
                    <div style="display:flex; justify-content:space-between; margin-top:10px; font-weight:800;">
                        <span>${t('totalExpenses')}:</span>
                        <span style="color:var(--danger);">${formatMoney(totalRelatedExpenses)} ${t('currencyShort')}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
}

async function deleteSupply(id, btn) {
    if (!confirm(t('confirmDelete'))) return;
    
    const s = await getById('shifts', id);
    const items = s.invoice_data || s.invoice_items || [];
    
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
