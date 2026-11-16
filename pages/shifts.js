// ==== شاشة الورديات ====
async function renderShifts() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const allShifts = await getAll('shifts');
    const shifts = allShifts.filter(s => !s.closed && s.branch_id === state.currentBranch.id);

    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">${t('shifts')}</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">${t('shiftsDesc')}</p>

        <div class="card">
            <h3 style="margin-bottom:15px;">${t('newShift')}</h3>
            
            <label>${t('shiftType')}</label>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <button class="btn btn-outline" id="btn-day" style="flex:1;" onclick="selectShiftType('نهارية')">☀️ ${t('dayShift')}</button>
                <button class="btn btn-outline" id="btn-night" style="flex:1;" onclick="selectShiftType('ليلية')">🌙 ${t('nightShift')}</button>
            </div>
            
            <label>${t('employeeName')}</label>
            <input type="text" id="shiftEmp" placeholder="${t('employeeName')}" onkeyup="checkShiftBtn()">
            
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <input type="checkbox" id="shiftMatabak" style="width:20px; height:20px; margin:0;">
                <label for="shiftMatabak" style="margin:0; font-weight:normal;">${t('matabak')}</label>
            </div>

            <label>${t('shiftDate')}</label>
            <input type="date" id="shiftDate" value="${getToday()}">
            
            <button class="btn btn-primary" id="openShiftBtn" onclick="openShift()" disabled>${t('openShift')}</button>
        </div>

        <h3 style="margin-top:25px; margin-bottom:15px;">${t('openShifts')} (${shifts.length})</h3>
        ${shifts.length === 0 ? `<p style="text-align:center; padding:20px; color:var(--text-muted); background:#fff; border-radius:12px; border:1px solid var(--border);">${t('noOpenShifts')}</p>` : ''}
        ${shifts.map(s => `
            <div class="card" onclick="resumeShift(${s.id})" style="cursor:pointer;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="color:var(--primary);">${s.type === 'نهارية' ? t('dayShift') : t('nightShift')} ${s.is_matabak ? t('matabak') : ''} - ${s.employee}</h4>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${s.date}</span>
                </div>
            </div>
        `).join('')}
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
    if (type === 'نهارية') { btnDay.style.background = 'var(--primary)'; btnDay.style.color = '#fff'; } 
    else { btnNight.style.background = 'var(--primary)'; btnNight.style.color = '#fff'; }
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
        is_matabak: isMatabak, 
        branch_id: state.currentBranch.id, 
        closed: false, 
        invoice_items: [], 
        total: 0 
    };
    const result = await addItem('shifts', shift);
    if(result) {
        await logActivity('فتح وردية', `وردية ${shift.type} للموظف ${shift.employee}`);
        state.activeShift = result;
        navigate('invoice');
    }
}

async function resumeShift(id) {
    state.activeShift = await getById('shifts', id);
    if (state.activeShift) {
        state.activeShift.invoiceItems = state.activeShift.invoice_data || [];
        navigate('invoice');
    }
}
