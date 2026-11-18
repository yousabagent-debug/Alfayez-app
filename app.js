// ==== حالة التطبيق ====
let state = { currentBranch: null, screen: 'login', userProfile: null, activeShift: null, tempShiftType: 'نهارية' };

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

// ==== تسجيل الحركات ====
async function logActivity(action, details) {
    try {
        await addItem('activities', {
            action: action,
            details: details,
            user_email: state.userProfile ? state.userProfile.email : 'غير معروف',
            branch_name: state.currentBranch ? state.currentBranch.name : 'غير معروف',
            branch_id: state.currentBranch ? state.currentBranch.id : null,
            date: new Date().toLocaleString('ar-EG'),
            timestamp: Date.now()
        });
    } catch(e) { console.log(e); }
}

// ==== التنقل ====
function navigate(screen) { 
    state.screen = screen; 
    render(); 
}

// ==== شاشة البداية ====
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
                    navigate('login');
                } else {
                    let profile = await getUserProfile(user.id);
                    if (!profile) {
                        try {
                            await supabaseClient.from('profiles').insert([{ id: user.id, email: user.email, status: 'pending' }]);
                            profile = await getUserProfile(user.id);
                        } catch(e) { console.log(e); }
                    }

                    const isAdminEmail = user.email === 'yousabagent@gmail.com' || user.email === 'yousabproject1@gmail.com';
                    
                    if (isAdminEmail) {
                        state.userProfile = { ...profile, role: 'admin', status: 'approved' };
                        navigate('branches');
                    } else if (!profile || profile.status === 'pending') {
                        navigate('pending');
                    } else if (profile.status === 'approved') {
                        const branches = await getAll('branches');
                        const branch = branches.find(b => String(b.id) === String(profile.branch_id));
                        if (branch) {
                            state.userProfile = profile;
                            state.currentBranch = branch;
                            navigate('dashboard');
                        } else {
                            state.userProfile = profile;
                            navigate('branches');
                        }
                    }
                }
            }, 500);
        }, 2000);
    }
}

// ==== الرسم ====
async function render() {
    if (state.screen === 'login') return renderLoginScreen();
    if (state.screen === 'branches') return renderBranches();
    if (state.screen === 'dashboard') return renderDashboard();
    if (state.screen === 'goods') return renderGoods();
    if (state.screen === 'shifts') return renderShifts();
    if (state.screen === 'invoice') return renderInvoice();
    if (state.screen === 'supplies') return renderSupplies();
    if (state.screen === 'expenses') return renderExpenses();
    if (state.screen === 'reports') return renderReports();
    if (state.screen === 'employee-settings') return renderEmployeeSettings();
    if (state.screen === 'pending') return renderPendingScreen();
    
    $('#main-content').innerHTML = `<h2 style="text-align:center; margin-top:50px;">قيد الإنشاء...</h2>`;
    renderBottomNav(state.screen);
}

// ==== شاشة انتظار الموافقة ====
async function renderPendingScreen() {
    $('#main-header').style.display = 'flex';
    $('#bottom-nav').classList.add('hidden');
    
    const user = await getCurrentUser();
    
    $('#main-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh; text-align:center; padding:20px;">
            <div style="font-size:4rem; margin-bottom:20px;">⏳</div>
            <h2 style="color:var(--primary); margin-bottom:10px;">حسابك قيد المراجعة</h2>
            <p style="color:var(--text-muted); margin-bottom:5px;">البريد الإلكتروني:</p>
            <p style="font-weight:bold; margin-bottom:20px;">${user ? user.email : ''}</p>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:30px;">يرجى الانتظار حتى يقوم المدير بالموافقة عليك وتحديد الفرع الخاص بك.</p>
            <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="signOut()">🚪 تسجيل الخروج</button>
        </div>
    `;
}

// ==== دوال الإشعارات وجرس التنبيهات (آمنة تماماً وخلف الكواليس) ====
async function updateNotificationBadge() {
    try {
        if (typeof supabaseClient === 'undefined') return;
        
        let { count, error } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true });

        if (error) return;

        const bellBtns = document.querySelectorAll('button[onclick*="openNotificationsModal"], .fa-bell, [onclick*="openNotificationsModal"], .notification-bell'); 

        bellBtns.forEach(bellBtn => {
            let badge = bellBtn.querySelector('.notif-badge');
            
            if (window.notificationsRead) {
                if (badge) badge.style.display = 'none';
                return;
            }

            if (!badge && count > 0) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                badge.style.cssText = "position:absolute; top:-5px; right:-5px; background:var(--danger, #ff4757); color:white; border-radius:50%; padding:2px 6px; font-size:0.7rem; font-weight:bold;";
                bellBtn.style.position = 'relative';
                bellBtn.appendChild(badge);
            }
            if (badge) {
                if (count > 0) {
                    badge.innerText = count > 99 ? '99+' : count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    } catch (e) {
        console.log('تنبيه الإشعارات:', e);
    }
}

async function openNotificationsModal() {
    try {
        window.notificationsRead = true;
        const bellBtns = document.querySelectorAll('button[onclick*="openNotificationsModal"], .fa-bell, [onclick*="openNotificationsModal"], .notification-bell');
        bellBtns.forEach(bellBtn => {
            let badge = bellBtn.querySelector('.notif-badge');
            if (badge) badge.style.display = 'none';
        });

        if (typeof supabaseClient === 'undefined') return;

        let { data: notifs, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);

        if (error) throw error;

        let notifHtml = notifs && notifs.length > 0 
            ? notifs.map(n => `
                <div style="padding: 10px; border-bottom: 1px solid var(--border); text-align: right;">
                    <div style="font-weight: bold; color: var(--primary);">${n.title || 'إشعار جديد'}</div>
                    <div style="font-size: 0.9rem; color: var(--text-main); margin-top: 3px;">${n.message}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">${n.created_at ? new Date(n.created_at).toLocaleString('ar-EG') : ''}</div>
                </div>
              `).join('')
            : '<p style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد إشعارات حالياً</p>';

        const existingModal = document.getElementById('notif-modal-overlay');
        if (existingModal) existingModal.remove();

        let modalBg = document.createElement('div');
        modalBg.id = 'notif-modal-overlay';
        modalBg.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;";
        
        modalBg.onclick = function(e) {
            if (e.target === modalBg) modalBg.remove();
        };

        modalBg.innerHTML = `
            <div style="background:white; width:90%; max-width:400px; border-radius:12px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.2); max-height:80vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 style="margin:0; color:var(--primary);">🔔 الإشعارات والتنبيهات</h3>
                    <button onclick="document.getElementById('notif-modal-overlay').remove()" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--danger); font-weight:bold;">✕</button>
                </div>
                <div>${notifHtml}</div>
            </div>
        `;
        document.body.appendChild(modalBg);

    } catch (err) {
        console.log(err);
    }
}

window.onload = () => { 
    initSplash(); 
    // فحص الإشعارات بعد تحميل التطبيق بمدة كافية لضمان عدم حدوث أي تعليق
    setTimeout(() => {
        window.notificationsRead = false;
        updateNotificationBadge();
    }, 3000);
};
