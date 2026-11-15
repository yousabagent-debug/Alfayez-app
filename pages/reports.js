// ==== شاشة التقارير ====
async function renderReports() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const activities = await getAll('activities');
    const reportEmails = (await getAll('report_emails')).filter(e => e.branch_id === state.currentBranch.id || !e.branch_id);
    const expenses = (await getAll('expenses')).filter(e => e.branch_id === state.currentBranch.id);
    const shifts = (await getAll('shifts')).filter(s => s.closed && s.branch_id === state.currentBranch.id);
    
    const totalExpenses = expenses.reduce((a,b) => a + (b.total || 0), 0);
    const totalSales = shifts.reduce((a,b) => a + (b.total || 0), 0);
    const net = totalSales - totalExpenses;

    $('#main-content').innerHTML = `
        <h2 style="margin: 15px 0;">التقرير</h2>
        <p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">كل حركة في اليوم: مبيعات، مصروفات، وتحركات المستخدمين</p>

        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="font-size:1.1rem;">📧 إيميلات التقارير</h3>
                <button class="icon-btn" onclick="openAddEmailModal()" style="background:var(--primary); color:#fff;">+</button>
            </div>
            <div id="emailsList">
                ${reportEmails.length ? reportEmails.map(e => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
                        <span style="font-size:0.9rem;">${e.email}</span>
                        <button class="icon-btn" style="width:30px; height:30px; font-size:0.8rem; color:var(--danger);" onclick="deleteReportEmail(${e.id})">🗑️</button>
                    </div>
                `).join('') : '<p style="text-align:center; color:var(--text-muted); font-size:0.85rem;">لا يوجد إيميلات مضافة</p>'}
            </div>
            <button class="btn btn-primary" style="margin-top:15px; display:flex; justify-content:center; gap:10px;" onclick="sendReport()">
                📤 إرسال التقرير الآن
            </button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:20px;">
            <div class="card" style="margin:0; padding:15px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted);">المبيعات</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--primary);">${formatMoney(totalSales)}</div>
            </div>
            <div class="card" style="margin:0; padding:15px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted);">المصروفات</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--danger);">${formatMoney(totalExpenses)}</div>
            </div>
            <div class="card" style="margin:0; padding:15px; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted);">الصافي</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--success);">${formatMoney(net)}</div>
            </div>
        </div>

        <div class="card">
            <h3 style="font-size:1.1rem; margin-bottom:15px;">📋 سجل التحركات</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">كل حركة يقوم بها المستخدمون مسجلة هنا</p>
            
            ${activities.length ? activities.sort((a,b) => b.timestamp - a.timestamp).map(a => `
                <div style="padding:12px 0; border-bottom:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-weight:700; font-size:0.9rem; color:var(--primary);">${a.action}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${a.date}</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${a.details}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">👤 ${a.user_email}</div>
                </div>
            `).join('') : '<p style="text-align:center; color:var(--text-muted);">لا يوجد تحركات مسجلة</p>'}
        </div>
    `;
    
    renderBottomNav('reports');
}

function openAddEmailModal() {
    const overlay = createEl('div', 'bottom-sheet-overlay');
    overlay.innerHTML = `
        <div class="bottom-sheet">
            <div class="bottom-sheet-header"><h2>إضافة إيميل جديد</h2><button class="close-btn" onclick="this.closest('.bottom-sheet-overlay').remove()">✖</button></div>
            <div class="input-group">
                <label>البريد الإلكتروني</label>
                <input type="email" id="newReportEmail" placeholder="example@email.com">
            </div>
            <button class="btn-save" onclick="saveNewReportEmail(this)">حفظ الإيميل</button>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('newReportEmail').focus(), 100);
}

async function saveNewReportEmail(btn) {
    const email = document.getElementById('newReportEmail').value.trim();
    if (!email || !email.includes('@')) {
        document.getElementById('newReportEmail').style.borderColor = 'red';
        return;
    }
    
    btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
    
    await addItem('report_emails', { email, branch_id: state.currentBranch.id });
    
    btn.closest('.bottom-sheet-overlay').remove();
    renderReports();
}

async function deleteReportEmail(id) {
    if (await confirmManagerPass()) {
        await deleteItem('report_emails', id);
        renderReports();
    }
}

async function confirmManagerPass() {
    const pass = prompt('أدخل باسورد المدير:');
    if(pass === null) return false;
    const managerPass = (await getAll('settings')).find(s => s.key === 'manager_pass').value;
    if(pass !== managerPass) { alert('باسورد خطأ'); return false; }
    return true;
}

// ==== إرسال التقرير ====
async function sendReport() {
    const emails = await getAll('report_emails');
    if (emails.length === 0) return alert('أضف إيميل أولاً');

    const branchName = state.currentBranch.name;
    const today = getToday();
    const shifts = (await getAll('shifts')).filter(s => s.closed && s.branch_id === state.currentBranch.id);
    const expenses = (await getAll('expenses')).filter(e => e.branch_id === state.currentBranch.id);
    const activities = await getAll('activities');

    const totalSales = shifts.reduce((a,b) => a + (b.total || 0), 0);
    const totalExpenses = expenses.reduce((a,b) => a + (b.total || 0), 0);
    const net = totalSales - totalExpenses;

    // تجهيز شكل الإيميل HTML هنا في التطبيق
    let emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0c2b21; margin: 0;">الفايز للزيوت والشحومات</h1>
                <p style="color: #666; font-size: 14px;">تقرير الحركة اليومي</p>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #333;">فرع: ${branchName}</h2>
                <p style="color: #666;">التاريخ: ${today}</p>
                
                <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 20px;">
                    <div style="background-color: #e8f5e9; padding: 10px; border-radius: 8px; width: 30%;">
                        <div style="color: #666; font-size: 12px;">المبيعات</div>
                        <div style="font-size: 18px; font-weight: bold; color: #0c2b21;">${formatMoney(totalSales)}</div>
                    </div>
                    <div style="background-color: #ffebee; padding: 10px; border-radius: 8px; width: 30%;">
                        <div style="color: #666; font-size: 12px;">المصروفات</div>
                        <div style="font-size: 18px; font-weight: bold; color: #d32f2f;">${formatMoney(totalExpenses)}</div>
                    </div>
                    <div style="background-color: #e3f2fd; padding: 10px; border-radius: 8px; width: 30%;">
                        <div style="color: #666; font-size: 12px;">الصافي</div>
                        <div style="font-size: 18px; font-weight: bold; color: #1976d2;">${formatMoney(net)}</div>
                    </div>
                </div>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">الورديات</h3>
                ${shifts.length === 0 ? '<p style="color: #999;">لا توجد ورديات محفوظة</p>' : ''}
                ${shifts.map(s => `
                    <div style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                            <span>${s.type} - ${s.employee}</span>
                            <span>${formatMoney(s.total)} ج</span>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">${s.date}</div>
                        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <th style="text-align: right; padding: 5px;">الصنف</th>
                                    <th style="text-align: center; padding: 5px;">الكمية</th>
                                    <th style="text-align: left; padding: 5px;">السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(s.invoice_items || []).map(i => `
                                    <tr>
                                        <td style="text-align: right; padding: 5px;">${i.name}</td>
                                        <td style="text-align: center; padding: 5px;">${i.qty}</td>
                                        <td style="text-align: left; padding: 5px;">${formatMoney(i.price)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">المصروفات</h3>
                ${expenses.length === 0 ? '<p style="color: #999;">لا توجد مصروفات</p>' : ''}
                <ul style="list-style: none; padding: 0;">
                    ${expenses.map(e => `
                        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span>${e.title}</span>
                            <span style="font-weight: bold; color: #d32f2f;">${formatMoney(e.total)} ج</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-radius: 10px;">
                <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">سجل التحركات</h3>
                ${activities.length === 0 ? '<p style="color: #999;">لا توجد تحركات مسجلة</p>' : ''}
                <ul style="list-style: none; padding: 0; font-size: 12px;">
                    ${activities.slice(0, 20).map(a => `
                        <li style="padding: 5px 0; border-bottom: 1px dotted #eee; color: #555;">
                            <b>${a.user_email}</b> - ${a.action}: ${a.details} <span style="color: #999;">(${a.date})</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;

    try {
        const { data, error } = await supabaseClient.functions.invoke('send-report', {
            body: {
                to: emails.map(e => e.email),
                subject: `تقرير الحركة اليومي — ${branchName} — ${today}`,
                html: emailHtml
            }
        });

        if (error) throw error;
        alert('تم إرسال التقرير بنجاح!');
    } catch (error) {
        console.error(error);
        alert('حدث خطأ في إرسال التقرير: ' + error.message);
    }
}
