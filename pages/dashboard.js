// ==== شاشة النظرة ====
async function renderDashboard() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const items = await getAll('items');
    const shifts = await getAll('shifts');
    const companies = await getAll('companies');
    
    const branchItems = items.filter(i => i.branch_id === state.currentBranch.id);
    const branchShifts = shifts.filter(s => s.branch_id === state.currentBranch.id);
    
    let totalValue = branchItems.reduce((a,b) => a + ((b.qty||0) * (b.price||0)), 0);
    let openShifts = branchShifts.filter(s => !s.closed).length;
    
    const closedShifts = branchShifts.filter(s => s.closed).sort((a,b) => b.id - a.id).slice(0, 3);

    $('#main-content').innerHTML = `
        <div style="padding-bottom:20px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 style="font-size:1.2rem;">${t('welcome')}</h3>
                <h2 style="color:var(--primary); font-size:1.5rem;">${state.currentBranch.name}</h2>
            </div>
            <div style="background:#fff; padding:8px 12px; border-radius:10px; border:1px solid var(--border); font-size:0.85rem;">
                ${getToday()}
            </div>
        </div>

        <div class="card card-primary">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.95rem; opacity:0.8;">${t('totalGoodsValue')}</div>
                <h2>${formatMoney(totalValue)} <span style="font-size:1.2rem; opacity:0.8;">${t('currency')}</span></h2>
                <div style="display:flex; gap:10px; margin-top:15px; margin-bottom:20px;">
                    <span style="background:rgba(255,255,255,0.1); padding:6px 15px; border-radius:20px; font-size:0.85rem;">${branchItems.length} ${t('itemsCount')}</span>
                    <span style="background:rgba(255,255,255,0.1); padding:6px 15px; border-radius:20px; font-size:0.85rem;">${companies.length} ${t('companiesCount')}</span>
                </div>
                <button class="btn btn-accent" style="display:flex; justify-content:center; align-items:center; gap:10px; width:auto; padding:12px 25px;" onclick="navigate('goods')">${t('manageGoods')}</button>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">${t('monthExpenses')}</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">0 <span style="font-size:0.9rem;">${t('currencyShort')}</span></div>
            </div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">${t('todaySales')}</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">0 <span style="font-size:0.9rem;">${t('currencyShort')}</span></div>
            </div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">${t('itemsNumber')}</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${branchItems.length}</div>
            </div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">${t('openShifts')}</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${openShifts}</div>
            </div>
        </div>

        <div class="card" style="padding: 15px; margin-top:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h4 style="font-size:1.1rem; color: var(--primary);">${t('lastSupplies')}</h4>
                <span style="font-size:0.85rem; color:var(--text-muted); cursor:pointer;" onclick="navigate('supplies')">${t('viewAll')}</span>
            </div>
            ${closedShifts.length ? closedShifts.map(s => `
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-weight:700; font-size:0.95rem;">${s.type} - ${s.employee}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${s.date}</div>
                    </div>
                    <div style="font-weight:800; color:var(--primary);">${formatMoney(s.total)}</div>
                </div>
            `).join('') : `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">${t('noRecentSupplies')}</p>`}
        </div>

        <div class="card" style="padding: 15px;">
            <h4 style="font-size:1.1rem; color: var(--primary); margin-bottom:15px;">${t('goodsDistribution')}</h4>
            ${companies.slice(0, 4).map(c => {
                const compItems = branchItems.filter(i => i.company === c.name);
                const compValue = compItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);
                if(compValue === 0) return '';
                return `
                    <div style="margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:5px;">
                            <span style="font-weight:700;">${c.name}</span>
                            <span style="color:var(--text-muted);">${formatMoney(compValue)}</span>
                        </div>
                        <div style="background:var(--bg-color); height:8px; border-radius:4px; overflow:hidden;">
                            <div style="background:var(--primary); height:100%; width:${Math.min(100, (compValue / totalValue) * 100)}%;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    renderBottomNav('dashboard');
}

// ==== شريط التنقل السفلي (مع الترجمة) ====
function renderBottomNav(active) {
    const navs = [
        { id: 'dashboard', name: t('dashboard'), icon: '📊' },
        { id: 'goods', name: t('goods'), icon: '📦' },
        { id: 'shifts', name: t('shifts'), icon: '⏱️' },
        { id: 'supplies', name: t('supplies'), icon: '📋' },
        { id: 'expenses', name: t('expenses'), icon: '💸' },
        { id: 'reports', name: t('reports'), icon: '📈' },
        { id: 'employee-settings', name: t('settings'), icon: '⚙️' }
    ];

    $('#bottom-nav').classList.remove('hidden');
    $('#bottom-nav').innerHTML = navs.map(n => `
        <button class="nav-item ${active === n.id ? 'active' : ''}" onclick="navigate('${n.id}')">
            <span style="font-size:1.2rem;">${n.icon}</span>
            <span style="font-size:0.6rem;">${n.name}</span>
        </button>
    `).join('');
}
