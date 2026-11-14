// ==== حالة التطبيق ====
let state = { currentBranch: null, screen: 'branches', activeShift: null, tempShiftType: 'نهارية', userProfile: null };

// ==== أدوات مساعدة ====
const $ = (sel) => document.querySelector(sel);
const createEl = (tag, className, innerHTML) => { const el = document.createElement(tag); if (className) el.className = className; if (innerHTML) el.innerHTML = innerHTML; return el; };
const formatMoney = (num) => new Intl.NumberFormat('en-US').format(num || 0);
const getToday = () => new Date().toISOString().split('T')[0];

// ==== التنقل ====
function navigate(screen) { state.screen = screen; render(); }

// ==== شاشة البداية (مصلحة للمدير) ====
async function initSplash() {
    const splash = $('#splash-screen');
    if (splash) {
        setTimeout(async () => {
            splash.style.opacity = '0';
            setTimeout(async () => {
                splash.classList.add('hidden');
                $('#app').classList.remove('hidden');
                
                const user = await getCurrentUser();
                if (!user) {
                    renderLoginScreen();
                } else {
                    // نجيب البروفايل، ولو مش موجود أو لسه pending، بنحاول نضيفه/نحدثه
                    let profile = await getUserProfile(user.id);
                    
                    if (!profile) {
                        try {
                            await supabaseClient.from('profiles').insert([{ id: user.id, email: user.email, status: 'pending' }]);
                            profile = await getUserProfile(user.id);
                        } catch(e) { console.log(e); }
                    }

                    // لو لسه pending، بس إحنا عارفين إن ده إيميل المدير، بنخليه يدخل على طول
                    // (عشان نكسر مشكلة الشاشة البيضا للمدير)
                    const isAdminEmail = user.email === 'yousabagent@gmail.com' || user.email === 'yousabproject1@gmail.com'; // حط إيميلك هنا
                    
                    if (isAdminEmail) {
                        state.userProfile = { ...profile, role: 'admin', status: 'approved' };
                        renderBranches();
                    } else if (!profile || profile.status === 'pending') {
                        renderPendingScreen(user.email);
                    } else if (profile.status === 'approved') {
                        state.userProfile = profile;
                        renderBranches();
                    }
                }
            }, 500);
        }, 2000);
    }
}

function renderLoginScreen() {
    $('#main-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:70vh; text-align:center; padding:20px;">
            <img src="logo.jpg" style="width:100px; height:100px; border-radius:50%; margin-bottom:20px; border:2px solid var(--primary);">
            <h2>مرحباً بك في الفايز</h2>
            <p style="color:var(--text-muted); margin-bottom:30px;">سجل دخولك للبدء</p>
            <button class="btn btn-primary" style="display:flex; justify-content:center; gap:10px; align-items:center;" onclick="signInWithGoogle()">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" width="20">
                تسجيل الدخول بحساب جوجل
            </button>
        </div>
    `;
    $('#bottom-nav').classList.add('hidden');
    $('#branch-name').innerText = "تسجيل الدخول";
}

function renderPendingScreen(email) {
    $('#main-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; text-align:center; padding:20px;">
            <div style="font-size:3rem; margin-bottom:20px;">⏳</div>
            <h2 style="color:var(--primary); margin-bottom:10px;">حسابك قيد المراجعة</h2>
            <p style="color:var(--text-muted); margin-bottom:5px;">البريد الإلكتروني:</p>
            <p style="font-weight:bold; margin-bottom:20px;">${email}</p>
            <p style="color:var(--text-muted); font-size:0.9rem;">يرجى الانتظار حتى يقوم المدير بالموافقة عليك وتحديد الفرع الخاص بك.</p>
            <button class="btn btn-outline" style="margin-top:30px; color:var(--danger);" onclick="signOut()">تسجيل خروج</button>
        </div>
    `;
    $('#bottom-nav').classList.add('hidden');
    $('#branch-name').innerText = "قيد المراجعة";
}

async function renderBranches() {
    const branches = await getAll('branches');
    $('#main-content').innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <img src="logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:15px; border: 2px solid var(--primary);">
            <h2>حدد فرعك</h2>
            <p style="color:var(--text-muted); font-size:0.9rem;">كل فرع له بضاعته ووردياته وحساباته</p>
        </div>
        <div id="branchesList"></div>
        ${state.userProfile && state.userProfile.role === 'admin' ? `<button class="btn btn-outline" style="border-style: dashed; border-width: 2px; margin-top:10px;" onclick="addBranchPrompt()">+ إضافة فرع جديد</button>` : ''}
        <div style="text-align:center; margin-top:30px; font-size:0.85rem; color:var(--text-muted);">${branches.length} من 10 فروع</div>
    `;
    $('#bottom-nav').classList.add('hidden');
    $('#branch-name').innerText = "اختيار الفرع";
    const list = $('#branchesList');
    branches.forEach((b, index) => {
        const card = createEl('div', 'branch-card', `
            <div class="right"><div class="icon-box">${index + 1}</div><div class="details"><h3>${b.name}</h3></div></div>
            <span style="color:var(--text-muted);">🔑</span>
        `);
        card.onclick = () => loginBranch(b);
        let pressTimer;
        card.onmousedown = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.onmouseup = () => clearTimeout(pressTimer);
        card.ontouchstart = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.ontouchend = () => clearTimeout(pressTimer);
        list.appendChild(card);
    });
}

function loginBranch(branch) { state.currentBranch = branch; $('#branch-name').innerText = branch.name; navigate('dashboard'); }
async function addBranchPrompt() { const name = prompt('اسم الفرع الجديد:'); if (name) { await addItem('branches', { name }); renderBranches(); } }
async function editBranch(branch) { const newName = prompt('الاسم الجديد:', branch.name); if (newName && newName !== branch.name) { branch.name = newName; await updateItem('branches', branch); renderBranches(); } }
function logout() { signOut(); }

function renderBottomNav(active) {
    const navs = [
        { id: 'dashboard', name: 'نظرة', icon: '📊' }, { id: 'goods', name: 'البضاعة', icon: '📦' },
        { id: 'shifts', name: 'الورديات', icon: '⏱️' }, { id: 'supplies', name: 'التوريدات', icon: '📋' },
        { id: 'expenses', name: 'المصروفات', icon: '💸' }, { id: 'reports', name: 'تقرير', icon: '📈' }
    ];
    $('#bottom-nav').classList.remove('hidden');
    $('#bottom-nav').innerHTML = navs.map(n => `
        <button class="nav-item ${active === n.id ? 'active' : ''}" onclick="navigate('${n.id}')">
            <span style="font-size:1.2rem;">${n.icon}</span><span>${n.name}</span>
        </button>
    `).join('');
}

async function renderDashboard() {
    const items = await getAll('items');
    const shifts = await getAll('shifts');
    let totalValue = items.reduce((a,b) => a + ((b.qty||0) * (b.price||0)), 0);
    let openShifts = shifts.filter(s => !s.closed && s.branch_id === state.currentBranch.id).length;
    $('#main-content').innerHTML = `
        <div style="padding-bottom:20px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
            <div><h3 style="font-size:1.2rem;">أهلاً بك مجدداً</h3><h2 style="color:var(--primary); font-size:1.5rem;">${state.currentBranch.name}</h2></div>
            <div style="background:#fff; padding:8px 12px; border-radius:10px; border:1px solid var(--border); font-size:0.85rem;">${getToday()}</div>
        </div>
        <div class="card card-primary">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.95rem; opacity:0.8;">إجمالي مبلغ البضاعة الموجودة</div>
                <h2>${formatMoney(totalValue)} <span style="font-size:1.2rem; opacity:0.8;">جنيه</span></h2>
                <div style="display:flex; gap:10px; margin-top:15px; margin-bottom:20px;">
                    <span style="background:rgba(255,255,255,0.1); padding:6px 15px; border-radius:20px; font-size:0.85rem;">${items.length} صنف مسجل</span>
                </div>
                <button class="btn btn-accent" style="display:flex; justify-content:center; align-items:center; gap:10px; width:auto; padding:12px 25px;" onclick="navigate('goods')">← إدارة البضاعة</button>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">مصروفات الشهر</div><div style="font-size:1.6rem; font-weight:800; color:var(--primary);">0 <span style="font-size:0.9rem;">ج</span></div></div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">مبيعات اليوم</div><div style="font-size:1.6rem; font-weight:800; color:var(--primary);">0 <span style="font-size:0.9rem;">ج</span></div></div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">عدد الأصناف</div><div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${items.length}</div></div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">ورديات مفتوحة</div><div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${openShifts}</div></div>
        </div>
    `;
    renderBottomNav('dashboard');
}

async function renderGoods() {
    const companies = await getAll('companies');
    const items = await getAll('items');
    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; flex-wrap: wrap; gap: 10px;">
            <h2 style="margin:0;">البضاعة الموجودة</h2>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="openManageGoods()">إدارة البضاعة</button>
                <button class="btn btn-primary" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem;" onclick="addCompanyPrompt()">+ شركة</button>
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
        <div class="card"><h3 style="margin-bottom:10px; font-size:1.1rem;">البحث عن صنف</h3><input type="text" placeholder="اسم الصنف أو الشركة..." onkeyup="searchItems(this.value)" style="margin-bottom:0; background:var(--bg-color);"></div>
        <div id="searchResults" class="hidden"></div>
        <h3 style="margin-top:25px; margin-bottom:15px;">الشركات</h3>
        <div id="companiesList">
            ${companies.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">لا يوجد شركات.</p>' : ''}
            ${companies.map(c => {
                const compItems = items.filter(i => i.company === c.name);
                const compValue = compItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);
                return `<div class="branch-card" onclick="openCompany('${c.name}')">
                    <div class="right"><div class="icon-box">${c.name.substring(0,2)}</div><div class="details"><h3>${c.name}</h3><p>${compItems.length} صنف</p></div></div>
                    <div style="text-align:left; font-weight:800; color:var(--primary);">${formatMoney(compValue)}<br><span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">قيمة البضاعة</span></div>
                </div>`;
            }).join('')}
        </div>
    `;
    renderBottomNav('goods');
}

async function searchItems(query) {
    const resDiv = $('#searchResults');
    if (!query) { resDiv.classList.add('hidden'); return; }
    const items = await getAll('items');
    const res = items.filter(i => i.name.includes(query) || i.company.includes(query));
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = res.length ? res.map(i => `<div class="card" style="padding:15px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; align-items:center;"><div><h3 style="font-size:1.1rem; margin-bottom:5px;">${i.name}</h3><span style="font-size:0.85rem; color:var(--text-muted);">${i.company}</span></div><div style="text-align:left;"><div style="font-size:1.4rem; font-weight:800; color:var(--primary);">${i.qty || 0}</div><div style="font-size:0.75rem; color:var(--text-muted);">رصيد</div></div></div></div>`).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد نتائج</p>';
}

async function addCompanyPrompt() { const name = prompt('اسم الشركة الجديدة:'); if (name) { await addItem('companies', { name }); renderGoods(); } }

async function openCompany(companyName) {
    const items = await getAll('items');
    const companyItems = items.filter(i => i.company === companyName);
    const totalValue = companyItems.reduce((a,b) => a + ((b.qty||0)*(b.price||0)), 0);
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><div><h2 style="color:var(--primary);">${companyName}</h2><p style="font-size:0.85rem; color:var(--text-muted);">${companyItems.length} صنف · ${formatMoney(totalValue)} جنيه</p></div><button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div style="display:flex; gap:10px; margin-bottom:20px;"><button class="btn btn-outline" style="flex:1; border-color:var(--primary); color:var(--primary);" onclick="addItemToCompany('${companyName}')">+ إضافة صنف</button><button class="btn btn-outline" style="flex:1; border-color:var(--danger); color:var(--danger);" onclick="editCompany('${companyName}')">تعديل الشركة</button></div>
            <div class="table-responsive"><table style="width:100%; border-collapse:collapse;"><thead><tr style="background:var(--bg-color);"><th style="padding:10px; border-bottom:1px solid var(--border);">الصنف</th><th style="padding:10px; border-bottom:1px solid var(--border);">الكمية</th><th style="padding:10px; border-bottom:1px solid var(--border);">السعر</th><th style="padding:10px; border-bottom:1px solid var(--border);">القيمة</th></tr></thead><tbody>${companyItems.length ? companyItems.map(i => `<tr><td style="padding:10px; border-bottom:1px solid var(--border); font-weight:700;">${i.name}</td><td style="padding:10px; border-bottom:1px solid var(--border);">${i.qty || 0}</td><td style="padding:10px; border-bottom:1px solid var(--border);">${i.price}</td><td style="padding:10px; border-bottom:1px solid var(--border); font-weight:700;">${formatMoney((i.qty||0) * i.price)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد أصناف.</td></tr>'}</tbody></table></div>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function addItemToCompany(companyName) { const name = prompt('اسم الصنف الجديد:'); if (!name) return; const price = parseFloat(prompt('سعر الوحدة (جنيه):')); if (!price) return; await addItem('items', { name, company: companyName, price, qty: 0 }); document.querySelector('.bottom-sheet-overlay').remove(); openCompany(companyName); }
async function editCompany(oldName) { const newName = prompt('اسم الشركة الجديد:', oldName); if (newName && newName !== oldName) { const companies = await getAll('companies'); const comp = companies.find(c => c.name === oldName); if (comp) { comp.name = newName; await updateItem('companies', comp); } const items = await getAll('items'); for (let item of items) { if (item.company === oldName) { item.company = newName; await updateItem('items', item); } } document.querySelector('.bottom-sheet-overlay').remove(); renderGoods(); } }

async function openManageGoods() {
    const additions = await getAll('additions');
    const grouped = additions.reduce((acc, curr) => { if (!acc[curr.date]) acc[curr.date] = []; acc[curr.date].push(curr); return acc; }, {});
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet" style="max-height: 90vh; overflow-y: auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h2 style="color:var(--primary);">البضاعة المضافة</h2><button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <button class="btn btn-primary" onclick="addNewBatch()" style="margin-bottom:20px;">+ إضافة بضاعة</button>
            ${Object.keys(grouped).length === 0 ? '<p style="text-align:center; color:var(--text-muted);">لا يوجد بضاعة مضافة</p>' : ''}
            ${Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).map(date => `<div class="card" style="padding:15px; margin-bottom:15px; border:1px solid var(--border);"><div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:10px;"><h4 style="color:var(--primary);">${date}</h4><button class="btn btn-outline" style="width:auto; padding:5px 10px; margin:0; font-size:0.75rem; color:var(--danger);" onclick="deleteAdditionDate('${date}', this)">🗑️ حذف</button></div>${grouped[date].map(add => `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);"><div><div style="font-weight:700; font-size:0.9rem;">${add.item_name}</div><div style="font-size:0.75rem; color:var(--text-muted);">${add.company}</div></div><div style="display:flex; align-items:center; gap:10px;"><span style="color:var(--success); font-weight:700;">+${add.qty}</span><button class="icon-btn" style="width:25px; height:25px; font-size:0.8rem;" onclick="deleteSingleAddition(${add.id}, this)">🗑️</button></div></div>`).join('')}</div>`).join('')}
        </div>
    `;
    document.body.appendChild(overlay);
}

async function addNewBatch() {
    const date = prompt('التاريخ:', getToday()); if (!date) return;
    const company = prompt('اسم الشركة:'); if (!company) return;
    const itemName = prompt('اسم الصنف:'); if (!itemName) return;
    const qty = parseFloat(prompt('الكمية المضافة:')); if (!qty) return;
    await addItem('additions', { date, company, item_name: itemName, qty });
    const items = await getAll('items');
    const existingItem = items.find(i => i.name === itemName && i.company === company);
    if (existingItem) { existingItem.qty = (existingItem.qty || 0) + qty; await updateItem('items', existingItem); } 
    else { await addItem('items', { name: itemName, company, price: 0, qty: qty }); }
    document.querySelector('.bottom-sheet-overlay').remove();
    openManageGoods();
}

async function deleteAdditionDate(date, btn) {
    const additions = await getAll('additions');
    const toDelete = additions.filter(a => a.date === date);
    for (let add of toDelete) { const items = await getAll('items'); const item = items.find(i => i.name === add.item_name && i.company === add.company); if (item) { item.qty -= add.qty; await updateItem('items', item); } await deleteItem('additions', add.id); }
    btn.closest('.bottom-sheet-overlay').remove(); openManageGoods();
}

async function deleteSingleAddition(id, btn) {
    const add = await getById('additions', id);
    if (add) { const items = await getAll('items'); const item = items.find(i => i.name === add.item_name && i.company === add.company); if (item) { item.qty -= add.qty; await updateItem('items', item); } await deleteItem('additions', id); }
    btn.closest('.bottom-sheet-overlay').remove(); openManageGoods();
}

async function renderShifts() {
    const shifts = (await getAll('shifts')).filter(s => !s.closed && s.branch_id === state.currentBranch.id);
    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">الورديات</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">افتح وردية جديدة وسجّل أصناف المبيعات</p>
        <div class="card">
            <h3 style="margin-bottom:15px;">وردية جديدة</h3>
            <label>نوع الوردية</label>
            <div style="display:flex; gap:10px; margin-bottom:15px;"><button class="btn btn-outline" id="btn-day" style="flex:1;" onclick="selectShiftType('نهارية')">☀️ نهارية</button><button class="btn btn-outline" id="btn-night" style="flex:1;" onclick="selectShiftType('ليلية')">🌙 ليلية</button></div>
            <label>اسم الموظف المسؤول</label><input type="text" id="shiftEmp" placeholder="اسم الموظف" onkeyup="checkShiftBtn()">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;"><input type="checkbox" id="shiftMatabak" style="width:20px; height:20px; margin:0;"><label for="shiftMatabak" style="margin:0; font-weight:normal;">مطبق (شغال الورديتين)</label></div>
            <label>تاريخ الوردية</label><input type="date" id="shiftDate" value="${getToday()}">
            <button class="btn btn-primary" id="openShiftBtn" onclick="openShift()" disabled>فتح الوردية وبدء الفاتورة</button>
        </div>
        <h3 style="margin-top:25px; margin-bottom:15px;">ورديات مفتوحة</h3>
        ${shifts.length ? shifts.map(s => `<div class="card" onclick="resumeShift(${s.id})" style="cursor:pointer;"><div style="display:flex; justify-content:space-between; align-items:center;"><h4 style="color:var(--primary);">${s.type} ${s.is_matabak ? '(مطبق)' : ''} - ${s.employee}</h4><span style="font-size:0.8rem; color:var(--text-muted);">${s.date}</span></div></div>`).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted); background:#fff; border-radius:12px; border:1px solid var(--border);">لا توجد ورديات مفتوحة حالياً</p>'}
    `;
    renderBottomNav('shifts');
    if (state.tempShiftType) selectShiftType(state.tempShiftType);
}

function selectShiftType(type) {
    state.tempShiftType = type;
    const btnDay = $('#btn-day'), btnNight = $('#btn-night');
    if(!btnDay || !btnNight) return;
    btnDay.style.background = 'transparent'; btnDay.style.color = 'var(--text-main)';
    btnNight.style.background = 'transparent'; btnNight.style.color = 'var(--text-main)';
    if (type === 'نهارية') { btnDay.style.background = 'var(--primary)'; btnDay.style.color = '#fff'; } else { btnNight.style.background = 'var(--primary)'; btnNight.style.color = '#fff'; }
}

function checkShiftBtn() { const val = $('#shiftEmp').value.trim(); $('#openShiftBtn').disabled = !val; }

async function openShift() {
    const emp = $('#shiftEmp').value.trim(), date = $('#shiftDate').value, isMatabak = $('#shiftMatabak').checked;
    const shift = { type: state.tempShiftType || 'نهارية', employee: emp, date: date, is_matabak: isMatabak, branch_id: state.currentBranch.id, closed: false, invoice_items: [], total: 0 };
    const result = await addItem('shifts', shift);
    if(result) { state.activeShift = result; navigate('invoice'); }
}

async function resumeShift(id) { state.activeShift = await getById('shifts', id); if (state.activeShift) { state.activeShift.invoiceItems = state.activeShift.invoice_items || []; navigate('invoice'); } }

async function renderSupplies() {
    const shifts = (await getAll('shifts')).filter(s => s.closed && s.branch_id === state.currentBranch.id).sort((a,b) => b.id - a.id);
    const totalSupplied = shifts.reduce((a,b) => a + (b.total || 0), 0);
    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">التوريدات</h2><p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">أرشيف الورديات المحفوظة - للعرض فقط</p>
        <div class="card" style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem;"><span>عدد الورديات: <span style="color:var(--primary);">${shifts.length}</span></span><span>${formatMoney(totalSupplied)} جنيه</span></div>
        ${shifts.length ? shifts.map(s => `<div class="card" onclick="viewSupplyDetails(${s.id})" style="cursor:pointer;"><div style="display:flex; justify-content:space-between; margin-bottom:8px;"><h4 style="color:var(--primary);">${s.type} ${s.is_matabak ? '(مطبق)' : ''} - ${s.employee}</h4><span style="font-weight:800;">${formatMoney(s.total)}</span></div><p style="color:var(--text-muted); font-size:0.8rem;">${s.date} · ${(s.invoice_items || []).length} صنف</p></div>`).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد توريدات محفوظة</p>'}
    `;
    renderBottomNav('supplies');
}

async function viewSupplyDetails(id) {
    const s = await getById('shifts', id), items = s.invoice_items || [];
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div style="background:var(--bg-color); padding:10px; border-radius:8px; text-align:center; margin-bottom:20px; font-size:0.9rem; color:var(--text-muted);">🔒 نسخة مؤرشفة — لا يمكن تعديل الأصناف أو القيم</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><div><h3>الوردية ${s.type}</h3><p style="font-size:0.85rem; color:var(--text-muted);">${s.date} · الموظف: ${s.employee}</p></div><button class="btn btn-outline" style="width:auto; padding:8px; color:var(--danger); border-color:var(--danger); margin:0;" onclick="deleteSupply(${s.id}, this)">حذف الوردية</button></div>
            <table style="width:100%; text-align:right;"><tr><th style="padding-bottom:10px; border-bottom:1px solid var(--border);">الصنف</th><th style="padding-bottom:10px; border-bottom:1px solid var(--border);">الكمية</th></tr>${items.map(i => `<tr><td style="padding:10px 0; border-bottom:1px solid var(--border);"><div style="font-weight:700;">${i.name}</div><div style="font-size:0.75rem; color:var(--text-muted);">${i.company}</div></td><td style="padding:10px 0; border-bottom:1px solid var(--border); font-weight:700;">${i.qty}</td></tr>`).join('')}</table>
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:800; font-size:1.2rem;"><span>${items.length} صنف</span><span style="color:var(--primary);">${formatMoney(s.total)} ج</span></div>
        </div>
    `;
    document.body.appendChild(overlay); overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
}

async function deleteSupply(id, btn) {
    if (!confirm('هل أنت متأكد من حذف هذه الوردية وإرجاع الكميات؟')) return;
    const s = await getById('shifts', id), items = s.invoice_items || [];
    for (let invItem of items) { if (invItem.id) { const dbItem = await getById('items', invItem.id); if(dbItem) { dbItem.qty = (dbItem.qty || 0) + invItem.qty; await updateItem('items', dbItem); } } }
    await deleteItem('shifts', id); btn.closest('.bottom-sheet-overlay').remove(); renderSupplies();
}

async function openSettings() {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `<div class="bottom-sheet"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h3>⚙️ إعدادات المدير</h3><button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div><button class="btn btn-outline" style="margin-bottom:10px; color:var(--danger); border-color:var(--danger);" onclick="signOut()">🚪 تسجيل الخروج</button></div>`;
    document.body.appendChild(overlay);
}

window.onload = () => { initSplash(); };

async function render() {
    if (state.screen === 'dashboard') return renderDashboard();
    if (state.screen === 'goods') return renderGoods();
    if (state.screen === 'shifts') return renderShifts();
    if (state.screen === 'invoice') return renderInvoice();
    if (state.screen === 'supplies') return renderSupplies();
    if (state.screen === 'branches') return renderBranches();
    $('#main-content').innerHTML = `<h2 style="text-align:center; margin-top:50px;">قيد الإنشاء...</h2>`;
    renderBottomNav(state.screen);
}
