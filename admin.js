// ==== إدارة الحسابات والموظفين ====
async function renderAdminPanel() {
    const { data: profiles, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
    const branches = await getAll('branches');

    if (error) { alert('خطأ في جلب البيانات'); return; }

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>إدارة الحسابات</h2>
            <button class="icon-btn" onclick="navigate('branches')">🔙</button>
        </div>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">وافق على الموظفين وحدد الفروع الخاصة بهم</p>
        <div id="profilesList">
    `;

    if (profiles.length === 0) {
        html += '<p style="text-align:center; color:var(--text-muted); padding:20px;">لا يوجد حسابات مسجلة حتى الآن.</p>';
    } else {
        profiles.forEach(p => {
            const isApproved = p.status === 'approved';
            const branch = branches.find(b => b.id === p.branch_id);
            
            html += `
                <div class="card" style="padding:15px; margin-bottom:15px; border-left: 4px solid ${isApproved ? 'var(--success)' : 'var(--accent)'};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h4 style="font-size:0.95rem; margin-bottom:5px;">${p.email}</h4>
                            <span style="font-size:0.8rem; color:var(--text-muted);">
                                الحالة: <b style="color:${isApproved ? 'var(--success)' : 'var(--accent)'};">${isApproved ? 'مقبول' : 'قيد الانتظار'}</b>
                                ${branch ? ` | الفرع: <b>${branch.name}</b>` : ''}
                            </span>
                        </div>
                        ${!isApproved ? `<button class="btn btn-primary" style="width:auto; padding:5px 15px; font-size:0.8rem;" onclick="approveUser('${p.id}')">موافقة</button>` : ''}
                    </div>
                    ${isApproved ? `
                        <div style="margin-top:10px; display:flex; gap:10px;">
                            <select style="flex:1; padding:5px; font-size:0.8rem;" onchange="changeBranch('${p.id}', this.value)">
                                <option value="">تغيير الفرع...</option>
                                ${branches.map(b => `<option value="${b.id}" ${b.id === p.branch_id ? 'selected' : ''}>${b.name}</option>`).join('')}
                            </select>
                            <button class="btn btn-outline" style="width:auto; padding:5px 15px; font-size:0.8rem; color:var(--danger); border-color:var(--danger);" onclick="deleteUserProfile('${p.id}')">حذف</button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }
    html += '</div>';
    $('#main-content').innerHTML = html;
    renderBottomNav('dashboard');
}

async function approveUser(userId) {
    const branches = await getAll('branches');
    let branchOptions = branches.map(b => `${b.id}: ${b.name}`).join('\n');
    const choice = prompt(`اختر رقم الفرع للموظف:\n${branchOptions}`);
    if (!choice) return;
    const branchId = parseInt(choice);
    const { error } = await supabaseClient.from('profiles').update({ status: 'approved', branch_id: branchId }).eq('id', userId);
    if (error) { alert('خطأ في الموافقة'); return; }
    alert('تمت الموافقة وتعيين الفرع بنجاح!');
    renderAdminPanel();
}

async function changeBranch(userId, branchId) {
    if (!branchId) return;
    const { error } = await supabaseClient.from('profiles').update({ branch_id: parseInt(branchId) }).eq('id', userId);
    if (error) { alert('خطأ في التعديل'); return; }
    alert('تم تغيير الفرع');
}

async function deleteUserProfile(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب من التطبيق؟')) return;
    const { error } = await supabaseClient.from('profiles').delete().eq('id', userId);
    if (error) { alert('خطأ في الحذف'); return; }
    renderAdminPanel();
}

// ==== إدارة الأسعار والشركات (للمدير فقط) ====
async function renderPriceManager() {
    const companies = await getAll('companies');
    const allItems = await getAll('items');
    
    const uniqueItems = [];
    const seen = new Set();
    allItems.forEach(item => {
        const key = `${item.name}-${item.company}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
        }
    });

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0;">
            <h2>إدارة الأسعار والشركات</h2>
            <button class="icon-btn" onclick="navigate('branches')">🔙</button>
        </div>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">تحكم كامل في الشركات والأسعار</p>
        
        <button class="btn btn-primary" onclick="openAddCompanySheetAdmin()" style="margin-bottom: 20px;">+ إضافة شركة جديدة</button>

        <div id="adminCompaniesList">
    `;

    companies.forEach(c => {
        const compItems = uniqueItems.filter(i => i.company === c.name);
        html += `
            <div class="card" style="padding:15px; margin-bottom:15px; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:10px;">
                    <div style="cursor:pointer; flex:1;" onclick="toggleAdminCompanyItems('${c.name}')">
                        <h3 style="color:var(--primary); display:flex; align-items:center; gap:10px;">
                            ${c.name} 
                            <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(${compItems.length} صنف)</span>
                        </h3>
                    </div>
                    <button class="btn btn-outline" style="width:auto; padding:5px 10px; margin:0; font-size:0.75rem; color:var(--danger); border-color:var(--danger);" onclick="startDeleteCompany('${c.name}')">🗑️ حذف</button>
                </div>
                
                <div id="admin-items-${c.name.replace(/\s/g, '')}" class="hidden">
                    <button class="btn btn-outline" style="width:100%; margin-bottom:10px; font-size:0.8rem;" onclick="openAddItemSheetAdmin('${c.name}')">+ إضافة صنف للشركة</button>
                    <div class="table-responsive">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead><tr style="background:var(--bg-color);"><th style="padding:8px; border-bottom:1px solid var(--border); font-size:0.85rem;">الصنف</th><th style="padding:8px; border-bottom:1px solid var(--border); font-size:0.85rem; width:100px;">السعر</th><th style="padding:8px; border-bottom:1px solid var(--border); font-size:0.85rem; width:60px;">حذف</th></tr></thead>
                            <tbody>
                                ${compItems.length ? compItems.map(item => `
                                    <tr>
                                        <td style="padding:8px; border-bottom:1px solid var(--border); font-weight:700;">${item.name}</td>
                                        <td style="padding:8px; border-bottom:1px solid var(--border);">
                                            <input type="number" value="${item.price}" style="width:80px; padding:8px; text-align:center; font-weight:bold; border-radius:8px; border:1px solid var(--border);" onchange="updatePrice('${item.name}', '${item.company}', this.value)">
                                        </td>
                                        <td style="padding:8px; border-bottom:1px solid var(--border); text-align:center;">
                                            <button class="icon-btn" style="width:30px; height:30px; font-size:0.8rem; color:var(--danger);" onclick="startDeleteItem('${item.name}', '${item.company}')">🗑️</button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">لا يوجد أصناف.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    $('#main-content').innerHTML = html;
    renderBottomNav('dashboard');
}

function toggleAdminCompanyItems(companyName) {
    const safeId = companyName.replace(/\s/g, '');
    const el = document.getElementById(`admin-items-${safeId}`);
    if (el) el.classList.toggle('hidden');
}

async function updatePrice(itemName, companyName, newPrice) {
    if (!newPrice) return;
    const items = await getAll('items');
    for (let item of items) {
        if (item.name === itemName && item.company === companyName) {
            item.price = parseFloat(newPrice);
            await updateItem('items', item);
        }
    }
    alert('تم تحديث السعر في كل الفروع!');
}

// ==== إضافة شركة من شاشة الإدارة ====
function openAddCompanySheetAdmin() {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>شركة جديدة</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>اسم الشركة</label><input type="text" id="adminNewCompanyName" placeholder="مثال: التعاون"></div>
            <button class="btn-save" onclick="saveNewCompanyAdmin(this)">حفظ الشركة</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveNewCompanyAdmin(btn) {
    const name = document.getElementById('adminNewCompanyName').value.trim();
    if (!name) { document.getElementById('adminNewCompanyName').style.borderColor = 'red'; return; }
    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    await addItem('companies', { name });
    btn.closest('.bottom-sheet-overlay').remove();
    renderPriceManager();
}

// ==== إضافة صنف من شاشة الإدارة (صنف واحد بس) ====
function openAddItemSheetAdmin(companyName) {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>صنف جديد</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group"><label>اسم الصنف</label><input type="text" id="adminNewItemName" placeholder="مثال: زيت 1 لتر"></div>
            <div class="input-group"><label>السعر</label><input type="number" id="adminNewItemPrice" value="0"></div>
            <button class="btn-save" onclick="saveNewItemAdmin('${companyName}', this)">حفظ الصنف</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function saveNewItemAdmin(companyName, btn) {
    const name = document.getElementById('adminNewItemName').value.trim();
    const price = parseFloat(document.getElementById('adminNewItemPrice').value) || 0;
    if (!name) { document.getElementById('adminNewItemName').style.borderColor = 'red'; return; }
    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;

    await addItem('items', { 
        name, 
        company: companyName, 
        price, 
        qty: 0,
        branch_id: null
    });

    btn.closest('.bottom-sheet-overlay').remove();
    renderPriceManager();
    alert('تمت إضافة الصنف لكل الفروع');
}

async function startDeleteCompany(companyName) {
    const confirm1 = confirm(`هل تريد حذف شركة "${companyName}"؟`);
    if (!confirm1) return;
    const confirm2 = confirm(`تأكيد ثاني: سيتم حذف كل أصناف "${companyName}"!`);
    if (!confirm2) return;
    const confirm3 = confirm(`تأكيد أخير: هل أنت متأكد 100% من الحذف؟`);
    if (!confirm3) return;

    const companies = await getAll('companies');
    const comp = companies.find(c => c.name === companyName);
    if (comp) await deleteItem('companies', comp.id);
    
    const items = await getAll('items');
    for (let item of items) { if (item.company === companyName) { await deleteItem('items', item.id); } }
    
    alert('تم حذف الشركة وكل أصنافها');
    renderPriceManager();
}

async function startDeleteItem(itemName, companyName) {
    const confirm1 = confirm('هل تريد حذف هذا الصنف؟');
    if (!confirm1) return;
    const confirm2 = confirm('تأكيد ثاني: سيتم حذف الصنف نهائياً!');
    if (!confirm2) return;
    const confirm3 = confirm('تأكيد أخير: هل أنت متأكد 100%؟');
    if (!confirm3) return;

    const items = await getAll('items');
    for (let i of items) {
        if (i.name === itemName && i.company === companyName) {
            await deleteItem('items', i.id);
        }
    }
    alert('تم حذف الصنف من كل الفروع');
    renderPriceManager();
}
