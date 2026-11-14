// ==== حالة التطبيق ====
let state = { currentBranch: null, screen: 'login', userProfile: null };

// ==== أدوات مساعدة ====
const $ = (sel) => document.querySelector(sel);
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
                navigate('login'); // نروح لشاشة تسجيل الدخول
            }, 500);
        }, 2000);
    }
}

// ==== الرسم (هيتوسع بعدين) ====
async function render() {
    if (state.screen === 'login') return renderLoginScreen();
    
    // الشاشات التانية هتتضاف بعدين
    $('#main-content').innerHTML = `<h2 style="text-align:center; margin-top:50px;">قيد الإنشاء...</h2>`;
}

window.onload = () => { initSplash(); };
