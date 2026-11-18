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
                        // تم حل مشكلة عدم تطابق نوع البيانات (String/Number) جذرياً هنا
                        const branch = branches.find(b => String(b.id) === String(profile.branch_id));
                        if (branch) {
                            state.userProfile = profile;
                            state.currentBranch = branch;
                            navigate('dashboard');
                        } else {
                            // لو الفرع مش متحدد للموظف، بنحوله لشاشة اختيار الفروع بأمان
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

window.onload = () => { initSplash(); };
