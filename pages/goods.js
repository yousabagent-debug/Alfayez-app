// ==== شاشة البضاعة ====
async function renderGoods() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const companies = await getAll('companies');
    const items = await getAll('items');
    const additions = await getAll('additions');
    
    const branchItems = items.filter(i => i.branch_id === state.currentBranch.id);
    const branchAdditions = additions.filter(a => a.branch_id === state.currentBranch.id);

    const groupedAdditions = branchAdditions.reduce((acc, curr) => {
        if (!acc[curr.date]) acc[curr.date] = [];
        acc[curr.date].push(curr);
        return acc;
    }, {});

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin:0;">${t('existingGoods')}</h2>
            <div style="display:flex; gap:8px; flex-wrap: wrap;">
                <button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openAddBatchSheet()">${t('addGoods')}</button>
            </div>
        </div>
        
        <div class="card card-primary">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.9rem; opacity:0.8;">${t('totalGoodsValue')}</div>
                <h2>${formatMoney(branchItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0))} <span style="font-size:1rem;">${t('currency')}</span></h2>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <span style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; font-size:0.8rem;">${branchItems.length} ${t('itemsCount')}</span>
                    <span style="background:rgba(255,255,255,0.1); padding:5px 15px; border-radius:20px; font-size:0.8rem;">${companies.length} ${t('companiesCount')}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom:10px; font-size:1.1rem;">${t('searchItem')}</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">${t('searchItemDesc')}</p>
            <input type="text" placeholder="${t('searchPlaceholder')}" onkeyup="searchItems(this.value)" style="margin-bottom:0; background:var(--bg-color);">
        </div>

        <div id="searchResults" class="hidden" style="margin-top: 15px;"></div>

        <div class="card" style="padding: 15px;">
            <h3 style="font-size:1.1rem; margin-bottom:15px;">${t('addedGoods')}</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">${t('addedGoodsDesc')}</p>
            
            ${Object.keys(groupedAdditions).length === 0 ? `<p style="text-align:center; color:var(--text-muted);">${t('noAddedGoods')}</p>` : ''}
            
            ${Object.keys(groupedAdditions).sort((a,b) => new Date(b) - new Date(a)).map(date => `
                <div style="border:1px solid var(--border); border-radius:12px; padding:15px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:10px;">
                        <h4 style="color:var(--primary); font-size:0.95rem;">${date}</h4>
                        <button class="btn btn-outline" style="width:auto; padding:5px 10px; margin:0; font-size:0.7rem; color:var(--danger);" onclick="deleteAdditionDate('${date}', this)">${t('deleteDate')}</button>
                    </div>
                    ${groupedAdditions[date].map(add => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed var(--border);">
                            <div style="display:flex; align-items:center; gap:10px; flex:1;">
                                <span style="color:var(--success); font-weight:700; font-size:0.85rem; min-width:35px;">+${add.qty}</span>
                                <div>
                                    <div style="font-weight:700; font-size:0.85rem;">${add.item_name}</div>
                                    <div style="font-size:0.7rem; color:var(--text-muted);">${add.company}</div>
                                </div>
                            </div>
                            <button class="icon-btn" style="width:25px; height:25px; font-size:0.8rem;" onclick="deleteSingleAddition(${add.id}, this)">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        <h3 style="margin-top:25px; margin-bottom:15px;">${t('companies')}</h3>
        <div id="companiesList">
            ${companies.length === 0 ? `<p style="text-align:center; color:var(--text-muted);">${t('noCompanies')}</p>` : ''}
            ${companies.map(c => {
                const compItems = branchItems.filter(i => i.company === c.name);
                const compValue = compItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);
                return `
                    <div class="branch-card" onclick="openCompany('${c.name}')">
                        <div class="right">
                            <div class="icon-box">${c.name.substring(0,2)}</div>
                            <div class="details">
                                <h3>${c.name}</h3>
                                <p>${compItems.length} ${t('itemsCount')}</p>
                            </div>
                        </div>
                        <div style="text-align:left; font-weight:800; color:var(--primary);">
                            ${formatMoney(compValue)}<br>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">${t('goodsValue')}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    renderBottomNav('goods');
}

async function searchItems(query) {
    const resDiv = $('#searchResults');
    if (!query.trim()) { resDiv.classList.add('hidden'); return; }
    const items = await getAll('items');
    const searchTerm = query.trim().toLowerCase();
    const res = items.filter(i => (i.branch_id === state.currentBranch.id) && (i.name.toLowerCase().includes(searchTerm) || i.company.toLowerCase().includes(searchTerm)));
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = res.length ? res.map(i => `
        <div class="card" style="padding:15px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><h3 style="font-size:1.1rem; margin-bottom:5px;">${i.name}</h3><span style="font-size:0.85rem; color:var(--text-muted);">${i.company}</span></div>
                <div style="text-align:left;"><div style="font-size:1.4rem; font-weight:800; color:var(--primary);">${i.qty || 0}</div><div style="font-size:0.75rem; color:var(--text-muted);">${t('quantity')}</div></div>
            </div>
        </div>
    `).join('') : `<p style="text-align:center; padding:20px; color:var(--text-muted);">${t('noResults')}</p>`;
}

async function openCompany(companyName) {
    const items = await getAll('items');
    const companyItems = items.filter(i => i.company === companyName && i.branch_id === state.currentBranch.id);
    const totalValue = companyItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <div style="display:flex; align-items:center; gap:10px;">
                <button class="icon-btn" onclick="navigate('goods')">🔙</button>
                <h2 style="margin:0;">${companyName}</h2>
            </div>
            <span style="font-size:0.85rem; color:var(--text-muted);">${companyItems.length} ${t('itemsCount')}</span>
        </div>

        <div class="card card-primary" style="margin-bottom:15px;">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.9rem; opacity:0.8;">${t('totalGoodsValue')}</div>
                <h2>${formatMoney(totalValue)} <span style="font-size:1rem;">${t('currency')}</span></h2>
            </div>
        </div>

        <div class="card" style="padding:0; overflow:hidden;">
            <div class="table-responsive">
                <table style="width:100%; border-collapse:collapse; text-align:right;">
                    <thead>
                        <tr style="background:var(--bg-color);">
                            <th style="padding:12px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('goods')}</th>
                            <th style="padding:12px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('quantity')}</th>
                            <th style="padding:12px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('price')}</th>
                            <th style="padding:12px; border-bottom:1px solid var(--border); font-size:0.85rem;">${t('total')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${companyItems.length ? companyItems.map(i => `
                            <tr>
                                <td style="padding:12px; border-bottom:1px solid var(--border);">
                                    <div style="font-weight:700;">${i.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${i.company}</div>
                                </td>
                                <td style="padding:12px; border-bottom:1px solid var(--border); font-weight:700;">${i.qty || 0}</td>
                                <td style="padding:12px; border-bottom:1px solid var(--border);">${formatMoney(i.price)}</td>
                                <td style="padding:12px; border-bottom:1px solid var(--border); font-weight:700;">${formatMoney((i.qty||0) * i.price)}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">${t('noResults')}</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    renderBottomNav('goods');
}

// ==== إضافة بضاعة ====
let batchItemsArray = [];
async function openAddBatchSheet() {
    batchItemsArray = [];
    const companies = await getAll('companies');
    const overlay = createEl('div', 'bottom-sheet-overlay'); overlay.id = 'batchOverlay';
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 95vh;">
            <div class="bottom-sheet-header"><h2>${t('addGoods')}</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>${t('date')}</label><input type="date" id="batchDate" value="${getToday()}"></div>
            <div class="input-group"><label>${t('companies')}</label><select id="batchCompany" onchange="updateBatchItems()"><option value="">${t('selectCompany')}</option>${companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}</select></div>
            <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom:15px;">
                <div class="input-group" style="flex:2; margin-bottom:0;"><label>${t('goods')}</label><select id="batchItemName"><option value="">${t('selectItem')}</option></select></div>
                <div class="input-group" style="flex:1; margin-bottom:0;"><label>${t('quantity')}</label><input type="number" id="batchQty" placeholder="0"></div>
                <button class="btn btn-primary" style="width:auto; padding:14px 20px; margin:0;" onclick="addBatchItemToList()">${t('add')}</button>
            </div>
            <div id="batchListContainer" style="margin-bottom:15px; max-height:200px; overflow-y:auto;"></div>
            <button class="btn-save" onclick="saveAllBatchItems(this)">${t('save')}</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function updateBatchItems() {
    const company = document.getElementById('batchCompany').value;
    const itemSelect = document.getElementById('batchItemName');
    itemSelect.innerHTML = `<option value="">${t('selectItem')}</option>`;
    if (!company) return;
    const items = await getAll('items');
    const companyItems = items.filter(i => i.company === company && i.branch_id === state.currentBranch.id);
    companyItems.forEach(i => { itemSelect.innerHTML += `<option value="${i.name}">${i.name}</option>`; });
}

function addBatchItemToList() {
    const company = document.getElementById('batchCompany').value;
    const itemName = document.getElementById('batchItemName').value;
    const qty = parseFloat(document.getElementById('batchQty').value);
    if (!company || !itemName || !qty) return alert(t('fillAll'));
    batchItemsArray.push({ company, item_name: itemName, qty: qty });
    document.getElementById('batchItemName').value = ''; document.getElementById('batchQty').value = '';
    renderBatchList();
}

function renderBatchList() {
    const container = document.getElementById('batchListContainer');
    if (batchItemsArray.length === 0) { container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem;">${t('noAddedGoods')}</p>`; return; }
    container.innerHTML = `<div style="background:#f4f4f4; border-radius:12px; padding:10px;">${batchItemsArray.map((item, index) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #ddd;">
            <div><div style="font-weight:700; font-size:0.9rem;">${item.item_name}</div><div style="font-size:0.75rem; color:var(--text-muted);">${item.company}</div></div>
            <div style="display:flex; align-items:center; gap:10px;"><span style="color:var(--success); font-weight:700;">+${item.qty}</span><button class="icon-btn" style="width:25px; height:25px; font-size:0.8rem; background:#fff;" onclick="removeBatchItem(${index})">🗑️</button></div>
        </div>`).join('')}</div>`;
}

function removeBatchItem(index) { batchItemsArray.splice(index, 1); renderBatchList(); }

async function saveAllBatchItems(btn) {
    const date = document.getElementById('batchDate').value;
    if (!date) return alert(t('selectDate'));
    if (batchItemsArray.length === 0) return alert(t('fillAll'));
    btn.innerText = t('loading'); btn.disabled = true;
    
    const items = await getAll('items');
    
    for (let batchItem of batchItemsArray) {
        await addItem('additions', { 
            date, 
            company: batchItem.company, 
            item_name: batchItem.item_name, 
            qty: batchItem.qty, 
            branch_id: state.currentBranch.id 
        });
        
        const existingItem = items.find(i => 
            i.name === batchItem.item_name && 
            i.company === batchItem.company &&
            i.branch_id === state.currentBranch.id
        );
        
        if (existingItem) {
            existingItem.qty = (existingItem.qty || 0) + batchItem.qty;
            await updateItem('items', existingItem);
        } else {
            await addItem('items', { 
                name: batchItem.item_name, 
                company: batchItem.company, 
                price: 0, 
                qty: batchItem.qty,
                branch_id: state.currentBranch.id 
            });
        }
    }
    
    btn.closest('.bottom-sheet-overlay').remove();
    renderGoods();
}

async function deleteAdditionDate(date, btn) {
    if (!confirm(t('confirmDelete'))) return;
    const additions = await getAll('additions'); 
    const toDelete = additions.filter(a => a.date === date && a.branch_id === state.currentBranch.id);
    for (let add of toDelete) {
        const items = await getAll('items'); 
        const item = items.find(i => i.name === add.item_name && i.company === add.company && i.branch_id === state.currentBranch.id);
        if (item) { item.qty -= add.qty; await updateItem('items', item); }
        await deleteItem('additions', add.id);
    }
    renderGoods();
}

async function deleteSingleAddition(id, btn) {
    if (!confirm(t('confirmDelete'))) return;
    const add = await getById('additions', id);
    if (add) {
        const items = await getAll('items'); 
        const item = items.find(i => i.name === add.item_name && i.company === add.company && i.branch_id === state.currentBranch.id);
        if (item) { item.qty -= add.qty; await updateItem('items', item); }
        await deleteItem('additions', id);
    }
    renderGoods();
}
