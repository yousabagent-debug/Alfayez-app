// ==== حالة التطبيق الأساسية ====
let state = {
    currentBranch: null,
    screen: 'branches',
    activeShift: null
};

// ==== أدوات مساعدة ====
const $ = (sel) => document.querySelector(sel);
const createEl = (tag, className, innerHTML) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
};
const formatMoney = (num) => new Intl.NumberFormat('en-US').format(num || 0);
const getToday = () => new Date().toISOString().split('T')[0];

// ==== التنقل ====
function navigate(screen) {
    state.screen = screen;
    render();
}

// ==== شاشة البداية ====
function initSplash() {
    const splash = $('#splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.classList.add('hidden');
                $('#app').classList.remove('hidden');
                renderBranches();
            }, 500);
        }, 2000); // 2 ثانية ويختفي اللوجو
    }
}

// ==== شاشة اختيار الفرع ====
async function renderBranches() {
    const branches = await getAll('branches');
    
    $('#main-content').innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <img src="logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:15px; border: 2px solid var(--primary);">
            <h2>حدد فرعك</h2>
            <p style="color:var(--text-muted); font-size:0.9rem;">كل فرع له بضاعته ووردياته وحساباته</p>
        </div>
        <div id="branchesList"></div>
        <button class="btn btn-outline" style="border-style: dashed; border-width: 2px;" onclick="addBranchPrompt()">+ إضافة فرع جديد</button>
        <div style="text-align:center; margin-top:30px; font-size:0.85rem; color:var(--text-muted);">
            ${branches.length} من 10 فروع
        </div>
    `;
    
    $('#bottom-nav').classList.add('hidden'); // إخفاء الشريط السفلي في شاشة الفروع
    $('#branch-name').innerText = "اختيار الفرع";

    const list = $('#branchesList');
    branches.forEach((b, index) => {
        const card = createEl('div', 'branch-card', `
            <div class="right">
                <div class="icon-box">${index + 1}</div>
                <div class="details">
                    <h3>${b.name}</h3>
                </div>
            </div>
            <span style="color:var(--text-muted);">🔑</span>
        `);
        card.onclick = () => loginBranch(b);
        
        // ضغطة طويلة لتعديل الفرع
        let pressTimer;
        card.onmousedown = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.onmouseup = () => clearTimeout(pressTimer);
        card.ontouchstart = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.ontouchend = () => clearTimeout(pressTimer);

        list.appendChild(card);
    });
}

function loginBranch(branch) {
    const pass = prompt(`أدخل باسورد فرع (${branch.name}):`);
    if (pass === branch.pass) {
        state.currentBranch = branch;
        $('#branch-name').innerText = branch.name;
        navigate('dashboard');
    } else if (pass !== null) {
        alert('باسورد خطأ!');
    }
}

async function addBranchPrompt() {
    const pass = prompt('أدخل باسورد المدير (لإضافة فرع):');
    const managerPass = (await getAll('settings')).find(s => s.key === 'manager_pass').value;
    if (pass !== managerPass) return alert('باسورد خطأ');

    const name = prompt('اسم الفرع الجديد:');
    if (name) {
        await addItem('branches', { name, pass: '123' });
        renderBranches();
    }
}

async function editBranch(branch) {
    const pass = prompt('أدخل باسورد المدير للتعديل:');
    const managerPass = (await getAll('settings')).find(s => s.key === 'manager_pass').value;
    if (pass !== managerPass) return alert('باسورد خطأ');

    const action = prompt('اكتب 1 لتغيير الاسم، أو 2 لتغيير الباسورد:');
    if (action === '1') {
        const newName = prompt('الاسم الجديد:', branch.name);
        if (newName) { branch.name = newName; await updateItem('branches', branch); renderBranches(); }
    } else if (action === '2') {
        const newPass = prompt('الباسورد الجديد:', branch.pass);
        if (newPass) { branch.pass = newPass; await updateItem('branches', branch); alert('تم التغيير'); }
    }
}

function logout() {
    state.currentBranch = null;
    navigate('branches');
}

// ==== شريط التنقل السفلي ====
function renderBottomNav(active) {
    const navs = [
        { id: 'dashboard', name: 'نظرة', icon: '📊' },
        { id: 'goods', name: 'البضاعة', icon: '📦' },
        { id: 'shifts', name: 'الورديات', icon: '⏱️' },
        { id: 'supplies', name: 'التوريدات', icon: '📋' },
        { id: 'expenses', name: 'المصروفات', icon: '💸' },
        { id: 'reports', name: 'تقرير', icon: '📈' }
    ];

    $('#bottom-nav').classList.remove('hidden');
    $('#bottom-nav').innerHTML = navs.map(n => `
        <button class="nav-item ${active === n.id ? 'active' : ''}" onclick="navigate('${n.id}')">
            <span style="font-size:1.2rem;">${n.icon}</span>
            <span>${n.name}</span>
        </button>
    `).join('');
}

// ==== الشاشة الرئيسية (نظرة) ====
async function renderDashboard() {
    const items = await getAll('items');
    const shifts = await getAll('shifts');
    
    let totalValue = items.reduce((a,b) => a + ((b.qty||0) * (b.price||0)), 0);
    let openShifts = shifts.filter(s => !s.closed).length;

    $('#main-content').innerHTML = `
        <div style="padding-bottom:20px; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 style="font-size:1.2rem;">أهلاً بك مجدداً</h3>
                <h2 style="color:var(--primary); font-size:1.5rem;">${state.currentBranch.name}</h2>
            </div>
            <div style="background:#fff; padding:8px 12px; border-radius:10px; border:1px solid var(--border); font-size:0.85rem;">
                ${getToday()}
            </div>
        </div>

        <div class="card card-primary">
            <div class="bg-pattern"></div>
            <div style="position:relative; z-index:1;">
                <div style="font-size:0.95rem; opacity:0.8;">إجمالي مبلغ البضاعة الموجودة</div>
                <h2>${formatMoney(totalValue)} <span style="font-size:1.2rem; opacity:0.8;">جنيه</span></h2>
                <div style="display:flex; gap:10px; margin-top:15px; margin-bottom:20px;">
                    <span style="background:rgba(255,255,255,0.1); padding:6px 15px; border-radius:20px; font-size:0.85rem;">${items.length} صنف مسجل</span>
                </div>
                <button class="btn btn-accent" style="display:flex; justify-content:center; align-items:center; gap:10px; width:auto; padding:12px 25px;" onclick="navigate('goods')">
                    ← إدارة البضاعة
                </button>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">مصروفات الشهر</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">0 <span style="font-size:0.9rem;">ج</span></div>
            </div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">مبيعات اليوم</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">0 <span style="font-size:0.9rem;">ج</span></div>
            </div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">عدد الأصناف</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${items.length}</div>
            </div>
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">ورديات مفتوحة</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${openShifts}</div>
            </div>
        </div>
    `;
    renderBottomNav('dashboard');
}

// ==== شاشة البضاعة ====
async function renderGoods() {
    const companies = await getAll('companies');
    const items = await getAll('items');

    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>البضاعة الموجودة</h2>
            <button class="btn btn-primary" style="width:auto; padding:8px 15px; margin:0; font-size:0.9rem;" onclick="addCompanyPrompt()">+ إضافة شركة</button>
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
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">اكتب اسم الصنف لمتابعة بيعه في الفواتير، وتفاصيله في البضاعة المضافة والمصروفات.</p>
            <input type="text" placeholder="اسم الصنف أو الشركة..." onkeyup="searchItems(this.value)" style="margin-bottom:0; background:var(--bg-color);">
        </div>

        <div id="searchResults" class="hidden"></div>

        <h3 style="margin-top:25px; margin-bottom:15px;">الشركات</h3>
        <div id="companiesList">
            ${companies.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">لا يوجد شركات. اضغط "إضافة شركة".</p>' : ''}
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

async function addCompanyPrompt() {
    const pass = prompt('أدخل باسورد المدير لإضافة شركة:');
    const managerPass = (await getAll('settings')).find(s => s.key === 'manager_pass').value;
    if (pass !== managerPass) return alert('باسورد خطأ');

    const name = prompt('اسم الشركة الجديدة:');
    if (name) {
        await addItem('companies', { name });
        renderGoods();
    }
}

async function openCompany(companyName) {
    // سيتم برمجتها في الجزء الثاني
    alert('سيتم فتح صفحة الشركة في التحديث القادم');
}

// ==== التشغيل الأساسي ====
window.onload = () => {
    initSplash();
};

// دالة الرسم الرئيسية
async function render() {
    if (state.screen === 'branches') return renderBranches();
    if (state.screen === 'dashboard') return renderDashboard();
    if (state.screen === 'goods') return renderGoods();
    
    // لو الشاشة لسه مش متبرمجة
    $('#main-content').innerHTML = `<h2 style="text-align:center; margin-top:50px;">قيد الإنشاء...</h2>`;
    renderBottomNav(state.screen);
}
// ================= الجزء التاني (الورديات، الفواتير، الإعدادات) =================

// ==== شاشة الورديات ====
async function renderShifts() {
    const shifts = (await getAll('shifts')).filter(s => !s.closed && s.branch === state.currentBranch.id);
    
    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">الورديات</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">افتح وردية جديدة وسجّل أصناف المبيعات</p>

        <div class="card">
            <h3 style="margin-bottom:15px;">وردية جديدة</h3>
            <label>نوع الوردية</label>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <button class="btn btn-outline" id="btn-day" style="flex:1;" onclick="selectShiftType('نهارية')">☀️ نهارية</button>
                <button class="btn btn-outline" id="btn-night" style="flex:1;" onclick="selectShiftType('ليلية')">🌙 ليلية</button>
            </div>
            
            <label>اسم الموظف المسؤول</label>
            <input type="text" id="shiftEmp" placeholder="اسم الموظف" onkeyup="checkShiftBtn()">
            
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <input type="checkbox" id="shiftMatabak" style="width:20px; height:20px; margin:0;">
                <label for="shiftMatabak" style="margin:0;">مطبق (شغال الورديتين)</label>
            </div>

            <label>تاريخ الوردية</label>
            <input type="date" id="shiftDate" value="${getToday()}">
            
            <button class="btn btn-primary" id="openShiftBtn" onclick="openShift()" disabled>فتح الوردية وبدء الفاتورة</button>
        </div>

        <h3 style="margin-top:25px; margin-bottom:15px;">ورديات مفتوحة</h3>
        ${shifts.length ? shifts.map(s => `
            <div class="card" onclick="resumeShift(${s.id})" style="cursor:pointer;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="color:var(--primary);">${s.type} ${s.isMatabak ? '(مطبق)' : ''} - ${s.employee}</h4>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${s.date}</span>
                </div>
            </div>
        `).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted); background:#fff; border-radius:12px; border:1px solid var(--border);">لا توجد ورديات مفتوحة حالياً</p>'}
    `;
    renderBottomNav('shifts');
    if (state.tempShiftType) selectShiftType(state.tempShiftType);
}

function selectShiftType(type) {
    state.tempShiftType = type;
    const btnDay = $('#btn-day');
    const btnNight = $('#btn-night');
    if(!btnDay || !btnNight) return;
    
    btnDay.style.background = 'transparent'; btnDay.style.color = 'var(--text-main)';
    btnNight.style.background = 'transparent'; btnNight.style.color = 'var(--text-main)';
    
    if (type === 'نهارية') {
        btnDay.style.background = 'var(--primary)'; btnDay.style.color = '#fff';
    } else {
        btnNight.style.background = 'var(--primary)'; btnNight.style.color = '#fff';
    }
}

function checkShiftBtn() {
    const val = $('#shiftEmp').value.trim();
    $('#openShiftBtn').disabled = !val;
}

async function openShift() {
    const emp = $('#shiftEmp').value.trim();
    const date = $('#shiftDate').value;
    const isMatabak = $('#shiftMatabak').checked;
    
    const shift = {
        type: state.tempShiftType || 'نهارية',
        employee: emp,
        date: date,
        isMatabak: isMatabak,
        branch: state.currentBranch.id,
        closed: false,
        invoiceItems: [],
        total: 0
    };
    
    const id = await addItem('shifts', shift);
    shift.id = id;
    state.activeShift = shift;
    navigate('invoice');
}

async function resumeShift(id) {
    state.activeShift = await getById('shifts', id);
    navigate('invoice');
}

// ==== شاشة الفاتورة (داخل الوردية) ====
async function renderInvoice() {
    if (!state.activeShift) return navigate('shifts');
    const s = state.activeShift;
    
    $('#main-content').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>الفاتورة</h2>
            <button class="icon-btn" onclick="navigate('shifts')">🔙</button>
        </div>

        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <div>
                    <h3 style="color:var(--primary);">وردية ${s.type} ${s.isMatabak ? '(مطبق)' : ''}</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-top:5px;">الموظف: ${s.employee}</p>
                </div>
                <button class="btn btn-outline" style="width:auto; padding:8px 12px; margin:0; font-size:0.8rem; color:var(--danger); border-color:var(--danger);" onclick="deleteShift(${s.id})">حذف الوردية</button>
            </div>
            <button class="btn btn-primary" style="display:flex; justify-content:center; gap:10px; align-items:center;" onclick="openAddItemModal()">
                + إضافة صنف
            </button>
        </div>

        <div class="card" style="padding:0; overflow:hidden;">
            <div style="padding:15px; background:var(--bg-color); border-bottom:1px solid var(--border); display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem; color:var(--text-muted);">
                <span>الأصناف (${s.invoiceItems.length})</span>
                <span>الإجمالي</span>
            </div>
            
            ${s.invoiceItems.length === 0 ? `
                <div style="text-align:center; padding:40px 20px;">
                    <p style="color:var(--text-muted); margin-bottom:5px;">الفاتورة فاضية</p>
                    <p style="font-size:0.8rem; color:var(--text-muted);">اضغط «إضافة صنف» لاختيار بضاعة أو كتابته يدوياً.</p>
                </div>
            ` : s.invoiceItems.map((item, idx) => `
                <div style="padding:15px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h4 style="font-size:1rem; margin-bottom:5px;">${item.name}</h4>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${item.company}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="text-align:center;">
                            <input type="number" value="${item.qty}" style="width:60px; padding:5px; margin:0; text-align:center; font-weight:700;" onchange="updateInvoiceQty(${idx}, this.value)">
                            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:5px;">الكمية</div>
                        </div>
                        <div style="font-weight:800; font-size:1.1rem; min-width:50px; text-align:left;">
                            ${formatMoney(item.price * item.qty)}
                        </div>
                    </div>
                </div>
            `).join('')}
            
            <div style="padding:15px; display:flex; justify-content:space-between; font-weight:800; font-size:1.2rem; background:var(--bg-color);">
                <span>الإجمالي:</span>
                <span style="color:var(--primary);">${formatMoney(s.total)} ج</span>
            </div>
        </div>

        ${s.invoiceItems.length > 0 ? `
            <button class="btn btn-primary" style="margin-top:20px; background:var(--primary); color:#fff; display:flex; justify-content:center; gap:10px;" onclick="closeShift(${s.id})">
                💾 حفظ الفاتورة وخصم الكميات
            </button>
        ` : ''}
    `;
    renderBottomNav('shifts');
}

// المودال (الشاشة المنبثقة) لإضافة صنف
function openAddItemModal() {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.id = 'addItemOverlay';
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3>إضافة صنف للفاتورة</h3>
                <button class="icon-btn" onclick="document.getElementById('addItemOverlay').remove()">✖</button>
            </div>
            
            <div class="tabs">
                <div class="tab active" onclick="switchAddTab('goods', this)">من البضاعة</div>
                <div class="tab" onclick="switchAddTab('manual', this)">إدخال يدوي</div>
            </div>

            <div id="tab-goods">
                <label>الشركة</label>
                <select id="addCompanySelect" onchange="updateItemSelect()">
                    <option value="">كل الشركات</option>
                </select>
                
                <label>الصنف</label>
                <select id="addItemSelect">
                    <option value="">اختر الصنف</option>
                </select>
                
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label>الكمية</label>
                        <input type="number" id="addQty" value="1" step="0.25">
                    </div>
                    <div style="flex:1;">
                        <label>سعر الوحدة</label>
                        <input type="text" id="addPrice" readonly placeholder="تلقائي" style="background:#e8e8e8;">
                    </div>
                </div>
                
                <div class="chips-container">
                    <div class="chip" onclick="setAddQty(0.25)">ربع</div>
                    <div class="chip" onclick="setAddQty(0.5)">نصف</div>
                    <div class="chip" onclick="setAddQty(0.75)">¾</div>
                    <div class="chip active" onclick="setAddQty(1)">1</div>
                    <div class="chip" onclick="setAddQty(2)">2</div>
                </div>
                
                <button class="btn btn-primary" onclick="addItemToInvoice('goods')" style="background:#8fa89e;">إضافة للفاتورة</button>
            </div>

            <div id="tab-manual" class="hidden">
                <label>اسم الصنف (إدخال يدوي)</label>
                <input type="text" id="manualName" placeholder="اكتب اسم الصنف...">
                
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label>الكمية</label>
                        <input type="number" id="manualQty" value="1" step="0.25">
                    </div>
                    <div style="flex:1;">
                        <label>السعر</label>
                        <input type="number" id="manualPrice" placeholder="0">
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="addItemToInvoice('manual')" style="background:#8fa89e; margin-top:20px;">إضافة للفاتورة</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    loadCompanySelect();
}

function switchAddTab(tabId, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    if(tabId === 'goods') {
        $('#tab-goods').classList.remove('hidden');
        $('#tab-manual').classList.add('hidden');
    } else {
        $('#tab-goods').classList.add('hidden');
        $('#tab-manual').classList.remove('hidden');
    }
}

function setAddQty(qty) {
    $('#addQty').value = qty;
    document.querySelectorAll('.chips-container .chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
}

async function loadCompanySelect() {
    const companies = await getAll('companies');
    const select = $('#addCompanySelect');
    if(!select) return;
    companies.forEach(c => {
        select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
    updateItemSelect();
}

async function updateItemSelect() {
    const comp = $('#addCompanySelect').value;
    const items = await getAll('items');
    const select = $('#addItemSelect');
    select.innerHTML = '<option value="">اختر الصنف</option>';
    
    const filtered = comp ? items.filter(i => i.company === comp) : items;
    filtered.forEach(i => {
        select.innerHTML += `<option value="${i.id}" data-price="${i.price}">${i.name} (متوفر: ${i.qty})</option>`;
    });
}

// ربط السعر لما نختار الصنف
document.addEventListener('change', (e) => {
    if(e.target.id === 'addItemSelect') {
        const opt = e.target.options[e.target.selectedIndex];
        if(opt.value) {
            $('#addPrice').value = opt.dataset.price;
        } else {
            $('#addPrice').value = '';
        }
    }
});

async function addItemToInvoice(mode) {
    let item;
    if(mode === 'goods') {
        const id = $('#addItemSelect').value;
        const qty = parseFloat($('#addQty').value);
        if(!id || !qty) return alert('اختر الصنف والكمية');
        const dbItem = await getById('items', parseInt(id));
        item = { id: dbItem.id, name: dbItem.name, company: dbItem.company, price: dbItem.price, qty: qty };
    } else {
        const name = $('#manualName').value;
        const qty = parseFloat($('#manualQty').value);
        const price = parseFloat($('#manualPrice').value);
        if(!name || !qty || !price) return alert('اكمل البيانات');
        item = { id: null, name, company: 'إدخال يدوي', price, qty };
    }

    state.activeShift.invoiceItems.push(item);
    state.activeShift.total += (item.price * item.qty);
    await updateItem('shifts', state.activeShift);
    $('#addItemOverlay').remove();
    renderInvoice();
}

async function updateInvoiceQty(idx, newQty) {
    const s = state.activeShift;
    s.invoiceItems[idx].qty = parseFloat(newQty);
    // إعادة حساب الإجمالي
    s.total = s.invoiceItems.reduce((a,b) => a + (b.price * b.qty), 0);
    await updateItem('shifts', s);
    renderInvoice();
}

async function closeShift(id) {
    const s = state.activeShift;
    // خصم من رصيد البضاعة
    for (let invItem of s.invoiceItems) {
        if (invItem.id) {
            const dbItem = await getById('items', invItem.id);
            if(dbItem) {
                dbItem.qty -= invItem.qty;
                await updateItem('items', dbItem);
            }
        }
    }
    s.closed = true;
    await updateItem('shifts', s);
    state.activeShift = null;
    alert('تم حفظ الفاتورة وخصم الكميات بنجاح!');
    navigate('supplies');
}

async function deleteShift(id) {
    const pass = prompt('أدخل باسورد المدير لحذف الوردية:');
    const managerPass = (await getAll('settings')).find(s => s.key === 'manager_pass').value;
    if (pass !== managerPass) return alert('باسورد خطأ');
    
    await deleteItem('shifts', id);
    state.activeShift = null;
    navigate('shifts');
}

// ==== شاشة التوريدات (الأرشيف) ====
async function renderSupplies() {
    const shifts = (await getAll('shifts')).filter(s => s.closed && s.branch === state.currentBranch.id).sort((a,b) => b.id - a.id);
    const totalSupplied = shifts.reduce((a,b) => a + (b.total || 0), 0);

    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">التوريدات</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">أرشيف الورديات المحفوظة - للعرض فقط</p>

        <div class="card" style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem;">
            <span>عدد الورديات: <span style="color:var(--primary);">${shifts.length}</span></span>
            <span>${formatMoney(totalSupplied)} جنيه</span>
        </div>

        ${shifts.length ? shifts.map(s => `
            <div class="card" onclick="viewSupplyDetails(${s.id})" style="cursor:pointer;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <h4 style="color:var(--primary);">${s.type} ${s.isMatabak ? '(مطبق)' : ''} - ${s.employee}</h4>
                    <span style="font-weight:800;">${formatMoney(s.total)}</span>
                </div>
                <p style="color:var(--text-muted); font-size:0.8rem;">${s.date} · ${s.invoiceItems.length} صنف</p>
            </div>
        `).join('') : '<p style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد توريدات محفوظة</p>'}
    `;
    renderBottomNav('supplies');
}

async function viewSupplyDetails(id) {
    const s = await getById('shifts', id);
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div style="background:var(--bg-color); padding:10px; border-radius:8px; text-align:center; margin-bottom:20px; font-size:0.9rem; color:var(--text-muted);">
                🔒 نسخة مؤرشفة — لا يمكن تعديل الأصناف أو القيم
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h3>الوردية ${s.type}</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${s.date} · الموظف: ${s.employee}</p>
                </div>
                <button class="btn btn-outline" style="width:auto; padding:8px; color:var(--danger); border-color:var(--danger); margin:0;" onclick="deleteSupply(${s.id}, this)">حذف الوردية</button>
            </div>
            
            <table style="width:100%; text-align:right;">
                <tr><th style="padding-bottom:10px; border-bottom:1px solid var(--border);">الصنف</th><th style="padding-bottom:10px; border-bottom:1px solid var(--border);">الكمية</th></tr>
                ${s.invoiceItems.map(i => `
                    <tr>
                        <td style="padding:10px 0; border-bottom:1px solid var(--border);">
                            <div style="font-weight:700;">${i.name}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${i.company}</div>
                        </td>
                        <td style="padding:10px 0; border-bottom:1px solid var(--border); font-weight:700;">${i.qty}</td>
                    </tr>
                `).join('')}
            </table>
            
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:800; font-size:1.2rem;">
                <span>${s.invoiceItems.length} صنف</span>
                <span style="color:var(--primary);">${formatMoney(s.total)} ج</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
}

async function deleteSupply(id, btn) {
    if (!await confirmManagerPass()) return;
    const s = await getById('shifts', id);
    // إرجاع الكميات للرصيد
    for (let invItem of s.invoiceItems) {
        if (invItem.id) {
            const dbItem = await getById('items', invItem.id);
            if(dbItem) {
                dbItem.qty += invItem.qty;
                await updateItem('items', dbItem);
            }
        }
    }
    await deleteItem('shifts', id);
    btn.closest('.bottom-sheet-overlay').remove();
    renderSupplies();
}

// ==== الإعدادات العامة ====
async function openSettings() {
    if (!await confirmManagerPass()) return;
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3>⚙️ إعدادات المدير</h3>
                <button class="icon-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button>
            </div>
            <button class="btn btn-outline" style="margin-bottom:10px;" onclick="addCompanyPrompt(); this.closest('.bottom-sheet-overlay').remove();">+ إضافة شركة جديدة</button>
            <button class="btn btn-outline" style="margin-bottom:10px;" onclick="alert('هنعملها في التحديث القادم')">+ إضافة صنف لشركة</button>
            <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="resetApp(); this.closest('.bottom-sheet-overlay').remove();">🗑️ مسح كل البيانات (Reset)</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function confirmManagerPass() {
    const pass = prompt('أدخل باسورد المدير:');
    if(pass === null) return false;
    const managerPass = (await getAll('settings')).find(s => s.key === 'manager_pass').value;
    if(pass !== managerPass) { alert('باسورد خطأ'); return false; }
    return true;
}

async function resetApp() {
    if(confirm('هل أنت متأكد من مسح كل البيانات؟ لا يمكن التراجع!')) {
        indexedDB.deleteDatabase('alfayez_db');
        setTimeout(() => location.reload(), 500);
    }
}

// تحديث دالة الرسم الرئيسية عشان تشمل الشاشات الجديدة
const originalRender = render;
render = async function() {
    if (state.screen === 'dashboard') return renderDashboard();
    if (state.screen === 'goods') return renderGoods();
    if (state.screen === 'shifts') return renderShifts();
    if (state.screen === 'invoice') return renderInvoice();
    if (state.screen === 'supplies') return renderSupplies();
    if (state.screen === 'branches') return renderBranches();
    
    $('#main-content').innerHTML = `<h2 style="text-align:center; margin-top:50px;">قيد الإنشاء...</h2>`;
    renderBottomNav(state.screen);
};
