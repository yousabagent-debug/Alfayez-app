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

// ==========================================
// ==== إدارة الأسعار والشركات (للمدير فقط) ====
// ==========================================

async function renderPriceManager() {
    const companies = await getAll('companies');
    const items = await getAll('items');
    
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
        const compItems = items.filter(i => i.company === c.name);
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
                            <thead><tr style="background:var(--bg-color);"><th style="padding:8px; border-bottom:1px solid var(--border); font-size:0.85rem;">الصنف</th><th style="padding:8px; border-bottom:1px solid var(--border); font-size:0.85rem;
