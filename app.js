// ==== حالة التطبيق ====
let state = { currentBranch: null, screen: 'login', userProfile: null };

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
                        state.userProfile = profile;
                        navigate('branches');
                    }
                }
            }, 500);
        }, 2000);
    }
}

// ==== الرسم (هيتوسع بعدين) ====
async function render() {
    if (state.screen === 'login') return renderLoginScreen();
    if (state.screen === 'branches') return renderBranches();
    
    // شاشات تانية مؤقتة
    $('#main-content').innerHTML = `<h2 style="text-align:center; margin-top:50px;">قيد الإنشاء...</h2>`;
}

// ==== ميزة السحب للتحديث (بس لو فيه نت) ====
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].screenY;
    
    // لو السحب لتحت مسافة 100 بكسل، وكان في أعلى الصفحة، وكان فيه نت
    if (touchEndY - touchStartY > 100 && window.scrollY === 0 && navigator.onLine) {
        const toast = document.createElement('div');
        toast.innerText = 'جاري تحديث البيانات...';
        toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:var(--primary); color:#fff; padding:10px 20px; border-radius:20px; font-size:0.9rem; z-index:9999; box-shadow:0 4px 10px rgba(0,0,0,0.2);';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}, { passive: true });

window.onload = () => { initSplash(); };
